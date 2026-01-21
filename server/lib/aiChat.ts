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

export async function processChat(sessionId: string, message: string, channel: string = 'web') {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: message }],
      response_format: { type: "text" },
      tools: ALLOWED_MCP_TOOLS.length > 0 ? ALLOWED_MCP_TOOLS.map(t => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema
        }
      })) : undefined
    } as any);

    const usage = response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens
    } : undefined;

    let reply = response.choices[0].message.content || "";
    const toolCalls = response.choices[0].message.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      const toolResponses = await Promise.all(toolCalls.map(async (toolCall: any) => {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        const result = await callMcpTool(name, args, channel);
        return {
          role: "tool",
          tool_call_id: toolCall.id,
          name,
          content: result.raw
        };
      }));

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
          response.choices[0].message,
          ...toolResponses as any[]
        ]
      });

      reply = secondResponse.choices[0].message.content || "";
    }

    // Proactively inject card intents if they are missing but relevant
    if (channel === 'web' && reply.toLowerCase().includes('emergency') && !reply.includes('card_intent')) {
      const emergencyCard = {
        type: "emergency_help",
        id: `card-${Date.now()}`,
        title: "Plumbing Emergency Detected",
        message: "We're here to help. Follow these safety steps and call us immediately.",
        severity: "critical",
        instructions: [
          "Shut off the main water valve immediately",
          "If you smell gas, leave the building and call 911",
          "Turn off electricity if water is near outlets",
          "Call (617) 479-9911 for 24/7 emergency dispatch"
        ],
        contactLabel: "Call (617) 479-9911",
        contactPhone: "(617) 479-9911"
      };
      reply += `\n\n\`\`\`card_intent\n${JSON.stringify(emergencyCard, null, 2)}\n\`\`\``;
    }

    // Strip card intents for SMS/Voice channels if they were accidentally included by AI or tools
    if (channel === 'sms' || channel === 'voice') {
      const cardIntentRegex = /```card_intent[\s\S]*?```/g;
      reply = reply.replace(cardIntentRegex, '').trim();
    }

    await logInteraction({
      sessionId,
      channel: channel as any,
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
