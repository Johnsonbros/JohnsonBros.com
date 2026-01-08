// MCP Rate Limiter and Abuse Detection
// Protects the MCP server from spam and abuse

import { Logger } from '../src/logger';
import { sendAbuseAlert } from './businessNotifications';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  toolCounts: Record<string, number>;
}

interface SessionEntry extends RateLimitEntry {
  sessionId: string;
}

interface IpEntry extends RateLimitEntry {
  ipAddress: string;
  sessions: Set<string>;
}

// In-memory rate limit stores
const sessionLimits = new Map<string, SessionEntry>();
const ipLimits = new Map<string, IpEntry>();

// Configuration
const CONFIG = {
  // Per-session limits
  SESSION_MAX_REQUESTS: 50,        // Max requests per session
  SESSION_WINDOW_MS: 15 * 60 * 1000, // 15 minute window
  SESSION_COOLDOWN_MS: 2000,       // Min time between requests (2 seconds)
  
  // Per-IP limits
  IP_MAX_REQUESTS: 100,            // Max requests per IP
  IP_MAX_SESSIONS: 10,             // Max sessions per IP
  IP_WINDOW_MS: 60 * 60 * 1000,    // 1 hour window
  
  // Tool-specific limits (per session)
  TOOL_LIMITS: {
    book_service_call: 5,          // Max 5 bookings per session
    create_lead: 10,               // Max 10 leads per session
    search_availability: 20,       // More generous for browsing
    get_quote: 20,
    lookup_customer: 10,
    get_services: 30,              // Allow many service queries
    search_faq: 50,                // Very generous for FAQs
    emergency_help: 10,
    get_job_status: 10,
    get_service_history: 10,
    request_reschedule_callback: 5,
    request_cancellation_callback: 5,
    request_review: 5
  } as Record<string, number>,
  
  // Abuse detection thresholds
  ABUSE_BURST_COUNT: 10,           // Requests in burst window triggers alert
  ABUSE_BURST_WINDOW_MS: 10000,    // 10 second burst window
};

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
  requestCount?: number;
  limit?: number;
}

// Clean up old entries periodically
function cleanupOldEntries() {
  const now = Date.now();
  
  for (const [sessionId, entry] of sessionLimits) {
    if (now - entry.lastRequest > CONFIG.SESSION_WINDOW_MS) {
      sessionLimits.delete(sessionId);
    }
  }
  
  for (const [ip, entry] of ipLimits) {
    if (now - entry.lastRequest > CONFIG.IP_WINDOW_MS) {
      ipLimits.delete(ip);
    }
  }
}

// Store interval reference for cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

// Start cleanup interval
function startCleanupInterval() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupOldEntries, 5 * 60 * 1000);
  }
}

// Stop cleanup interval (for graceful shutdown)
export function stopRateLimiterCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    sessionLimits.clear();
    ipLimits.clear();
  }
}

// Initialize cleanup on module load
startCleanupInterval();

// Check rate limit for a request
export function checkRateLimit(
  sessionId: string,
  ipAddress: string,
  toolName: string
): RateLimitResult {
  const now = Date.now();
  
  // Get or create session entry
  let session = sessionLimits.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      count: 0,
      firstRequest: now,
      lastRequest: now,
      blocked: false,
      toolCounts: {}
    };
    sessionLimits.set(sessionId, session);
  }
  
  // Get or create IP entry
  let ip = ipLimits.get(ipAddress);
  if (!ip) {
    ip = {
      ipAddress,
      count: 0,
      firstRequest: now,
      lastRequest: now,
      blocked: false,
      toolCounts: {},
      sessions: new Set()
    };
    ipLimits.set(ipAddress, ip);
  }
  
  // Check if blocked
  if (session.blocked) {
    return {
      allowed: false,
      reason: 'Session blocked due to abuse',
      retryAfterMs: CONFIG.SESSION_WINDOW_MS - (now - session.firstRequest)
    };
  }
  
  if (ip.blocked) {
    return {
      allowed: false,
      reason: 'IP blocked due to abuse',
      retryAfterMs: CONFIG.IP_WINDOW_MS - (now - ip.firstRequest)
    };
  }
  
  // Reset window if expired
  if (now - session.firstRequest > CONFIG.SESSION_WINDOW_MS) {
    session.count = 0;
    session.firstRequest = now;
    session.toolCounts = {};
  }
  
  if (now - ip.firstRequest > CONFIG.IP_WINDOW_MS) {
    ip.count = 0;
    ip.firstRequest = now;
    ip.toolCounts = {};
    ip.sessions.clear();
  }
  
  // Cooldown check (too many requests too fast)
  const timeSinceLastRequest = now - session.lastRequest;
  if (session.count > 0 && timeSinceLastRequest < CONFIG.SESSION_COOLDOWN_MS) {
    return {
      allowed: false,
      reason: 'Request too soon, please wait',
      retryAfterMs: CONFIG.SESSION_COOLDOWN_MS - timeSinceLastRequest,
      requestCount: session.count
    };
  }
  
  // Session request limit
  if (session.count >= CONFIG.SESSION_MAX_REQUESTS) {
    return {
      allowed: false,
      reason: 'Session request limit exceeded',
      requestCount: session.count,
      limit: CONFIG.SESSION_MAX_REQUESTS
    };
  }
  
  // IP request limit
  if (ip.count >= CONFIG.IP_MAX_REQUESTS) {
    return {
      allowed: false,
      reason: 'IP request limit exceeded',
      requestCount: ip.count,
      limit: CONFIG.IP_MAX_REQUESTS
    };
  }
  
  // IP session limit
  ip.sessions.add(sessionId);
  if (ip.sessions.size > CONFIG.IP_MAX_SESSIONS) {
    Logger.warn(`[RateLimiter] IP ${ipAddress} has too many sessions: ${ip.sessions.size}`);
    ip.blocked = true;
    
    // Send abuse alert (async, don't wait)
    sendAbuseAlert(sessionId, ipAddress, ip.count, `Too many sessions: ${ip.sessions.size}`).catch(() => {});
    
    return {
      allowed: false,
      reason: 'Too many sessions from this IP'
    };
  }
  
  // Tool-specific limit
  const toolLimit = CONFIG.TOOL_LIMITS[toolName];
  if (toolLimit !== undefined) {
    const toolCount = session.toolCounts[toolName] || 0;
    if (toolCount >= toolLimit) {
      return {
        allowed: false,
        reason: `Tool ${toolName} limit exceeded`,
        requestCount: toolCount,
        limit: toolLimit
      };
    }
    session.toolCounts[toolName] = toolCount + 1;
  }
  
  // Check for burst abuse
  const burstWindow = CONFIG.ABUSE_BURST_WINDOW_MS;
  if (timeSinceLastRequest < burstWindow && session.count > CONFIG.ABUSE_BURST_COUNT) {
    Logger.warn(`[RateLimiter] Burst detected for session ${sessionId}: ${session.count} requests in ${timeSinceLastRequest}ms`);
    
    // Send abuse alert (async, don't wait)
    sendAbuseAlert(sessionId, ipAddress, session.count, `Burst attack: ${session.count} requests in ${timeSinceLastRequest}ms`).catch(() => {});
  }
  
  // Update counters
  session.count++;
  session.lastRequest = now;
  ip.count++;
  ip.lastRequest = now;
  ip.toolCounts[toolName] = (ip.toolCounts[toolName] || 0) + 1;
  
  return {
    allowed: true,
    requestCount: session.count,
    limit: CONFIG.SESSION_MAX_REQUESTS
  };
}

// Record request completion for monitoring
export function recordRequest(
  sessionId: string,
  toolName: string,
  status: 'success' | 'error' | 'rate_limited',
  executionTimeMs: number,
  correlationId: string
) {
  // This is a lightweight in-memory record for monitoring
  // Full logging is done in the database via mcpRequestLogs table
  Logger.debug(`[RateLimiter] ${status}: ${toolName} (${executionTimeMs}ms) [${correlationId}]`);
}

// Get current rate limit stats for a session
export function getSessionStats(sessionId: string): {
  requestCount: number;
  limit: number;
  toolCounts: Record<string, number>;
  windowRemaining: number;
} | null {
  const session = sessionLimits.get(sessionId);
  if (!session) return null;
  
  const now = Date.now();
  return {
    requestCount: session.count,
    limit: CONFIG.SESSION_MAX_REQUESTS,
    toolCounts: { ...session.toolCounts },
    windowRemaining: Math.max(0, CONFIG.SESSION_WINDOW_MS - (now - session.firstRequest))
  };
}

// Get MCP health stats
export function getMcpHealthStats(): {
  activeSessions: number;
  activeIps: number;
  totalRequestsLastHour: number;
  blockedSessions: number;
  blockedIps: number;
} {
  let totalRequests = 0;
  let blockedSessions = 0;
  let blockedIps = 0;
  
  for (const session of sessionLimits.values()) {
    totalRequests += session.count;
    if (session.blocked) blockedSessions++;
  }
  
  for (const ip of ipLimits.values()) {
    if (ip.blocked) blockedIps++;
  }
  
  return {
    activeSessions: sessionLimits.size,
    activeIps: ipLimits.size,
    totalRequestsLastHour: totalRequests,
    blockedSessions,
    blockedIps
  };
}

// Manually block a session (admin action)
export function blockSession(sessionId: string, reason: string): boolean {
  const session = sessionLimits.get(sessionId);
  if (session) {
    session.blocked = true;
    Logger.warn(`[RateLimiter] Session ${sessionId} manually blocked: ${reason}`);
    return true;
  }
  return false;
}

// Manually block an IP (admin action)
export function blockIp(ipAddress: string, reason: string): boolean {
  const ip = ipLimits.get(ipAddress);
  if (ip) {
    ip.blocked = true;
    Logger.warn(`[RateLimiter] IP ${ipAddress} manually blocked: ${reason}`);
    return true;
  }
  
  // Create blocked entry if doesn't exist
  ipLimits.set(ipAddress, {
    ipAddress,
    count: 0,
    firstRequest: Date.now(),
    lastRequest: Date.now(),
    blocked: true,
    toolCounts: {},
    sessions: new Set()
  });
  Logger.warn(`[RateLimiter] IP ${ipAddress} blocked: ${reason}`);
  return true;
}
