// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI Responses API with MCP tool type for automatic tool discovery
// Tools are defined in src/booker.ts MCP server - no duplicate definitions needed

import OpenAI from 'openai';
import { Logger } from '../src/logger';
import { logInteraction } from './memory';
import { generateZekePrompt } from './zekePrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get the public MCP server URL for OpenAI Responses API
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

export function clearSession(sessionId: string): void {
  Logger.info(`Cleared session: ${sessionId}`);
}

export async function getSessionHistory(sessionId: string): Promise<any[]> {
  return []; // Placeholder for now
}

const SYSTEM_PROMPT = generateZekePrompt('sms');

export { SYSTEM_PROMPT, openai, ALLOWED_MCP_TOOLS, MCP_PUBLIC_URL };

export async function processChat(sessionId: string, message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: message }],
    });

    const usage = response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens
    } : undefined;

    const reply = response.choices[0].message.content || "";

    await logInteraction({
      sessionId,
      channel: 'chat',
      direction: 'outbound',
      content: reply,
      usage
    });

    return { message: reply };
  } catch (error: any) {
    Logger.error('[ZEKE] Chat processing failed:', error.message);
    throw error;
  }
}
