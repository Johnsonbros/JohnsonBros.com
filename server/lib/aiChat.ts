// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI Responses API with MCP tool type for automatic tool discovery
// Tools are defined in src/booker.ts MCP server - no duplicate definitions needed

import OpenAI from 'openai';
import { Logger } from '../src/logger';
import { agentTracing } from './agentTracing';
import { trackOpenAIUsage } from './usageTracker';
import { generateZekePrompt } from './zekePrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get the public MCP server URL for OpenAI Responses API
// The MCP server at /mcp proxies to the internal MCP server on port 3001
function getMcpServerUrl(): string {
  if (process.env.MCP_PUBLIC_URL) {
    return process.env.MCP_PUBLIC_URL;
  }
  
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/mcp`;
  }
  
  Logger.warn('MCP_PUBLIC_URL not set - using default. Set MCP_PUBLIC_URL for production.');
  return 'http://localhost:5000/mcp';
}

const MCP_PUBLIC_URL = getMcpServerUrl();

// Allowed tools to expose to OpenAI - matches tools in src/booker.ts
const ALLOWED_MCP_TOOLS = [
  'book_service_call',
  'search_availability', 
  'lookup_customer',
  'get_services',
  'get_quote',
  'get_capacity',
  'emergency_help',
  'search_faq',
  'create_lead',
  'get_job_status',
  'get_service_history',
  'request_reschedule_callback',
  'request_cancellation_callback'
];

// Session storage for Responses API
interface ResponsesSessionData {
  previousResponseId?: string;
  lastUsed: number;
}

const responsesSessionData: Map<string, ResponsesSessionData> = new Map();
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

// Clean up expired sessions
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const expired: string[] = [];
  
  for (const [sessionId, data] of responsesSessionData.entries()) {
    if (now - data.lastUsed > SESSION_TTL) {
      expired.push(sessionId);
    }
  }
  
  for (const sessionId of expired) {
    responsesSessionData.delete(sessionId);
    Logger.debug(`Cleaned up expired session: ${sessionId}`);
  }
  
  if (expired.length > 0) {
    Logger.info(`Cleaned up ${expired.length} expired sessions`);
  }
}

let sessionCleanupInterval: NodeJS.Timeout | null = null;
sessionCleanupInterval = setInterval(cleanupExpiredSessions, 15 * 60 * 1000);

export function stopMcpSessionCleanup(): void {
  if (sessionCleanupInterval) {
    clearInterval(sessionCleanupInterval);
    sessionCleanupInterval = null;
    Logger.info('Session cleanup stopped');
  }
}

export function clearSession(sessionId: string): void {
  responsesSessionData.delete(sessionId);
  Logger.info(`Cleared session: ${sessionId}`);
}

export async function getSessionHistory(sessionId: string): Promise<any[]> {
  return []; // Placeholder for now
}

const SYSTEM_PROMPT = generateZekePrompt('sms');

export { SYSTEM_PROMPT, openai, ALLOWED_MCP_TOOLS, MCP_PUBLIC_URL };

export async function processChat(sessionId: string, message: string) {
  // Logic to process chat
  return { message: "ZEKE is processing your request." };
}
