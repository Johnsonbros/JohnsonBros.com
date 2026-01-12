import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getToolMetricsSnapshot, server } from './booker.js';

const log = pino({ name: 'mcp-http-server', level: process.env.LOG_LEVEL || 'info' });

// In-memory rate limiting for MCP requests
const sessionRequestCounts = new Map<string, { count: number; firstRequest: number; lastRequest: number }>();
const ipRequestCounts = new Map<string, { count: number; firstRequest: number; lastRequest: number; sessions: Set<string> }>();

const RATE_LIMIT_CONFIG = {
  SESSION_MAX_REQUESTS: 500,
  SESSION_WINDOW_MS: 15 * 60 * 1000,
  SESSION_COOLDOWN_MS: 50,
  SESSION_INIT_BURST: 50,
  IP_MAX_REQUESTS: 1000,
  IP_MAX_SESSIONS: 100,
  IP_WINDOW_MS: 60 * 60 * 1000,
};

function checkMcpRateLimit(sessionId: string, ipAddress: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  
  // Session-level rate limiting
  let session = sessionRequestCounts.get(sessionId);
  if (!session) {
    session = { count: 0, firstRequest: now, lastRequest: now };
    sessionRequestCounts.set(sessionId, session);
  }
  
  // Reset window if expired
  if (now - session.firstRequest > RATE_LIMIT_CONFIG.SESSION_WINDOW_MS) {
    session.count = 0;
    session.firstRequest = now;
  }
  
  // Allow burst of requests during session initialization (first 10 requests)
  // MCP protocol requires several rapid requests during connection handshake
  const isInitPhase = session.count < RATE_LIMIT_CONFIG.SESSION_INIT_BURST;
  
  // Cooldown check - skip during initialization phase to allow protocol handshake
  if (!isInitPhase && session.count > 0 && now - session.lastRequest < RATE_LIMIT_CONFIG.SESSION_COOLDOWN_MS) {
    return { allowed: false, reason: 'Request too fast, please slow down' };
  }
  
  // Session limit check
  if (session.count >= RATE_LIMIT_CONFIG.SESSION_MAX_REQUESTS) {
    return { allowed: false, reason: 'Session request limit exceeded' };
  }
  
  // IP-level rate limiting
  let ip = ipRequestCounts.get(ipAddress);
  if (!ip) {
    ip = { count: 0, firstRequest: now, lastRequest: now, sessions: new Set() };
    ipRequestCounts.set(ipAddress, ip);
  }
  
  // Reset IP window if expired
  if (now - ip.firstRequest > RATE_LIMIT_CONFIG.IP_WINDOW_MS) {
    ip.count = 0;
    ip.firstRequest = now;
    ip.sessions.clear();
  }
  
  // Track sessions per IP
  ip.sessions.add(sessionId);
  if (ip.sessions.size > RATE_LIMIT_CONFIG.IP_MAX_SESSIONS) {
    log.warn({ ipAddress, sessionCount: ip.sessions.size }, 'Too many sessions from IP');
    return { allowed: false, reason: 'Too many sessions from this IP' };
  }
  
  // IP limit check
  if (ip.count >= RATE_LIMIT_CONFIG.IP_MAX_REQUESTS) {
    return { allowed: false, reason: 'IP request limit exceeded' };
  }
  
  // Update counters
  session.count++;
  session.lastRequest = now;
  ip.count++;
  ip.lastRequest = now;
  
  return { allowed: true };
}

// Cleanup old entries every 5 minutes
let rateLimitCleanupInterval: NodeJS.Timeout | null = null;
rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [sessionId, entry] of sessionRequestCounts) {
    if (now - entry.lastRequest > RATE_LIMIT_CONFIG.SESSION_WINDOW_MS) {
      sessionRequestCounts.delete(sessionId);
    }
  }
  for (const [ip, entry] of ipRequestCounts) {
    if (now - entry.lastRequest > RATE_LIMIT_CONFIG.IP_WINDOW_MS) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Cleanup function for graceful shutdown
export function stopMcpHttpServer(): void {
  if (rateLimitCleanupInterval) {
    clearInterval(rateLimitCleanupInterval);
    rateLimitCleanupInterval = null;
    log.info('Rate limit cleanup interval stopped');
  }
}

// Create Express application
const app = express();
app.use(express.json());

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
const configuredOrigins = process.env.MCP_CORS_ORIGINS
  ? process.env.MCP_CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const siteUrl = process.env.SITE_URL?.replace(/\/$/, '');
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(siteUrl ? [siteUrl] : [])
];

const allowAllOrigins = configuredOrigins.includes('*');
const allowedOrigins = allowAllOrigins
  ? null
  : (configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins); // null = allow all origins

if (process.env.NODE_ENV === 'production' && !allowAllOrigins && configuredOrigins.length === 0 && !siteUrl) {
  log.warn('MCP_CORS_ORIGINS is not set in production; defaulting to localhost origins only.');
}

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header) for server-to-server calls
    if (!origin) return callback(null, true);

    // If allowedOrigins is null, allow all origins (production default for MCP)
    if (allowedOrigins === null) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const error = new Error('Origin not allowed by MCP CORS policy');
    return callback(error);
  },
  exposedHeaders: ['Mcp-Session-Id']
}));

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message.includes('CORS')) {
    log.warn({ error: err.message }, 'Blocked MCP request due to CORS policy');
    return res.status(403).json({ error: 'Forbidden', message: err.message });
  }
  return next(err);
});

const authToken = process.env.MCP_AUTH_TOKEN;

app.use((req, res, next) => {
  if (!authToken) return next();

  const header = req.headers['authorization'];
  if (header === `Bearer ${authToken}`) return next();

  log.warn({ path: req.path }, 'Unauthorized MCP HTTP request blocked');
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid MCP authentication token required'
  });
});

// Store transports by session ID
const transports: Record<string, { transport: StreamableHTTPServerTransport; lastActive: number; timeout?: NodeJS.Timeout }> = {};

const SESSION_TTL_MS = Number(process.env.MCP_SESSION_TTL_MS ?? 15 * 60 * 1000);

function clearSession(sessionId: string) {
  const existing = transports[sessionId];
  if (existing?.timeout) clearTimeout(existing.timeout);
  delete transports[sessionId];
  log.info({ sessionId }, 'MCP session cleared');
}

// Handle all MCP Streamable HTTP requests (GET, POST, DELETE) on a single endpoint
app.all('/mcp', async (req, res) => {
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  // Only use existing session ID if provided in header, otherwise leave undefined for new sessions
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const rateLimitSessionId = sessionId || `new-${ipAddress}-${Date.now()}`;

  log.info({ method: req.method, path: req.path, ip: ipAddress, sessionId: sessionId || 'new' }, 'Received MCP request');

  // Apply rate limiting (use IP-based ID for new sessions)
  const rateLimitResult = checkMcpRateLimit(rateLimitSessionId, ipAddress);
  if (!rateLimitResult.allowed) {
    log.warn({ sessionId: rateLimitSessionId, ip: ipAddress, reason: rateLimitResult.reason }, 'MCP request rate limited');
    return res.status(429).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: rateLimitResult.reason || 'Rate limit exceeded'
      },
      id: null
    });
  }

  try {
    // Check for existing session ID
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport - store reference to prevent race condition
      const sessionData = transports[sessionId];
      if (!sessionData) {
        // Session was cleared by another request, treat as expired
        log.warn({ sessionId }, 'Session cleared during request, treating as expired');
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Session expired or invalid. Please reinitialize the connection.'
          },
          id: null
        });
      }

      transport = sessionData.transport;
      sessionData.lastActive = Date.now();
      if (sessionData.timeout) clearTimeout(sessionData.timeout);
      sessionData.timeout = setTimeout(() => clearSession(sessionId), SESSION_TTL_MS);
      log.info({ sessionId }, 'Reusing existing transport');
    } else if (sessionId && !transports[sessionId]) {
      // Client sent a session ID that we don't recognize (expired or invalid)
      log.warn({ sessionId }, 'Unknown session ID, client should reinitialize');
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session expired or invalid. Please reinitialize the connection.'
        },
        id: null
      });
    } else {
      // Create new transport with session management (no session ID provided)
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: async (newSessionId: string) => {
          log.info({ sessionId: newSessionId }, 'Session initialized');
          transports[newSessionId] = {
            transport,
            lastActive: Date.now(),
            timeout: setTimeout(() => clearSession(newSessionId), SESSION_TTL_MS)
          };
        },
        onsessionclosed: async (closedSessionId: string) => {
          log.info({ sessionId: closedSessionId }, 'Session closed');
          clearSession(closedSessionId);
        }
      });

      // Connect the server to the transport
      await server.connect(transport);
      log.info('Connected MCP server to new transport');
    }

    // Handle the request using the transport
    await transport.handleRequest(
      req as IncomingMessage,
      res as ServerResponse,
      req.body
    );
  } catch (error: any) {
    log.error({ error: error.message, stack: error.stack }, 'Error handling MCP request');

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// Health check endpoint with rate limiting stats
app.get('/health', (req, res) => {
  const activeSessions = Object.keys(transports).length;
  const rateLimitedSessions = sessionRequestCounts.size;
  const rateLimitedIps = ipRequestCounts.size;
  const toolMetrics = getToolMetricsSnapshot();
  
  res.json({
    status: 'ok',
    service: 'jb-booker-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      activeSessions,
      trackedSessions: rateLimitedSessions,
      trackedIps: rateLimitedIps
    },
    rateLimits: {
      sessionMax: RATE_LIMIT_CONFIG.SESSION_MAX_REQUESTS,
      sessionWindowMinutes: RATE_LIMIT_CONFIG.SESSION_WINDOW_MS / 60000,
      ipMax: RATE_LIMIT_CONFIG.IP_MAX_REQUESTS,
      ipWindowHours: RATE_LIMIT_CONFIG.IP_WINDOW_MS / 3600000
    },
    toolMetrics
  });
});

// Root endpoint with info
app.get('/', (req, res) => {
  res.json({
    name: 'Johnson Bros. Plumbing MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for HousecallPro booking integration',
    service_area: 'Norfolk, Suffolk, and Plymouth Counties, Massachusetts',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    },
    tools: {
      booking: [
        'book_service_call - Book a plumbing service appointment',
        'search_availability - Search for available appointment slots',
        'create_lead - Request a callback for customers who want to speak with office'
      ],
      customer: [
        'lookup_customer - Verify existing customer by name and phone',
        'get_job_status - Check status of scheduled or past jobs',
        'get_service_history - View past service records'
      ],
      information: [
        'get_services - List all available plumbing services',
        'get_quote - Get instant price estimates',
        'search_faq - Search frequently asked questions',
        'emergency_help - Get emergency plumbing guidance'
      ],
      modifications: [
        'request_reschedule_callback - Log reschedule request (requires phone call)',
        'request_cancellation_callback - Log cancellation request (requires phone call)'
      ],
      offline: [
        'request_review - [OFFLINE] Google review request (future feature)'
      ]
    },
    security: {
      rate_limiting: 'Enabled',
      cors: 'Configured',
      authentication: process.env.MCP_AUTH_TOKEN ? 'Token required' : 'Open'
    },
    toolMetrics: getToolMetricsSnapshot()
  });
});

// Start the server
const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  log.info({ port: PORT }, 'MCP HTTP server started successfully');
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Johnson Bros. Plumbing MCP Server                         ║
╟────────────────────────────────────────────────────────────╢
║  Status: Running                                           ║
║  Port: ${PORT}                                               ║
║  MCP Endpoint: http://localhost:${PORT}/mcp                  ║
║  Health Check: http://localhost:${PORT}/health               ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
