// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI Responses API with MCP tool type for automatic tool discovery
// Tools are defined in src/booker.ts MCP server - no duplicate definitions needed

import OpenAI from 'openai';
import { Logger } from '../src/logger';
import { agentTracing } from './agentTracing';

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

const SYSTEM_PROMPT = `You are the Johnson Bros. Plumbing & Drain Cleaning booking chatbot that lives on thejohnsonbros.com. Follow the scripted booking flow below, pausing after each step for the customer's response.

## Business Facts
- Phone/CTA: (617) 479-9911 (call for emergencies or to book now)
- Services: general plumbing, heating, drain cleaning, new construction plumbing, emergency plumbing
- Service area: Quincy, Greater Boston, and the South Shore (all cities/towns in Norfolk, Suffolk, and Plymouth counties). Ask for city/town/ZIP; if outside those counties, say they are outside the regular service area but invite them to call.
- Hours/time zone: 24/7, Eastern Time (convert ISO times to EST/EDT when displaying to customers)
- Arrival windows: Mon–Fri slots are 8–11 AM, 11 AM–2 PM, 2–5 PM with a 2-hour arrival window.
- Membership: The Family Discount ($99/year) for priority service and discounts.

## CRITICAL: CARDS BEFORE TOOLS
When you need customer information to call a tool, OUTPUT A CARD FIRST to collect that information. Do NOT call a tool without the required data.

Example flow for returning customers:
1. Customer says "Yes" (used us before) → Output a \`returning_customer_lookup\` card
2. Wait for customer to submit the card with their phone/email
3. ONLY THEN call \`lookup_customer\` with the phone/email from the card

## TOOL SELECTION DECISION TREE (CRITICAL - Follow This Exactly)

### When to use lookup_customer:
✅ USE ONLY when you HAVE the customer's phone number or email already
✅ USE after receiving phone/email from a returning_customer_lookup card submission
❌ DO NOT USE when customer just says "Yes" without providing contact info
❌ DO NOT USE for new customers
❌ DO NOT USE when you don't have phone/email yet - OUTPUT A CARD FIRST TO COLLECT IT

### When to use get_services:
✅ USE when customer asks: "What services do you offer?", "What can you fix?", "Do you do X?"
✅ USE when customer needs to know if we handle their issue type
❌ DO NOT USE if the customer already knows what service they need

### When to use get_quote:
✅ USE when customer asks about pricing for a specific service
✅ USE when you need to provide a cost estimate
❌ DO NOT USE without knowing service type and issue description first

### When to use search_availability:
✅ USE when customer wants to know available times on a specific date
✅ USE when customer says "When can you come?", "What times are available?"
✅ USE when you have a date and service type
❌ DO NOT USE before knowing what service is needed
❌ DO NOT USE without a target date

### When to use book_service_call:
✅ USE when you have ALL required info: name, phone, email, address, service type, date/time
✅ USE only AFTER confirming appointment details with customer
❌ DO NOT USE if any required field is missing
❌ DO NOT USE before customer confirms the appointment

### When to use emergency_help:
✅ USE IMMEDIATELY when customer says "emergency", "urgent", or describes: burst pipe, flooding, gas smell, sewage backup, no water, no heat
✅ USE when safety is at risk - ALWAYS call this tool first before any text response
✅ USE when customer clicks the emergency quick action button
❌ DO NOT USE for routine issues that can wait (slow drain, minor leak, etc.)

## Sequential Booking Steps (wait for user reply after each):
1) Greet the customer and ask how Johnson Bros. can assist.
2) If customer mentions emergency/urgent issue, IMMEDIATELY call emergency_help tool - this shows them the emergency card with safety steps and phone number.
3) For non-emergency issues, ask 1–2 targeted questions about their issue to capture booking notes.
4) Ask if they want to schedule an appointment.
5) Ask if they have used Johnson Bros. before. Remind them of the service fee when appropriate.
6) If they say YES (returning customer): OUTPUT a \`returning_customer_lookup\` card to collect their phone/email. Do NOT call lookup_customer yet - wait for the card submission.
7) After receiving their phone/email from the card, call lookup_customer and show their saved info.
8) When showing saved addresses, list them like: 1) 184 Furnace Brook Parkway, Unit 2, Quincy, MA 02169 2) 75 East Elm Ave, Quincy, MA 02170. Remember and store address_id values.
9) If they are NEW (not used us before): OUTPUT a \`new_customer_info\` card to collect their details.
10) Remember and store customer_id for bookings.
11) Ask what date/time works best. OUTPUT a \`date_picker\` card, then after selection OUTPUT a \`time_picker\` card with available slots.
12) Once details are confirmed, book them in the system (book_service_call) with clear notes, then OUTPUT a \`booking_confirmation\` card.
13) If they have multiple issues, prompt them to call the office directly at (617) 479-9911.
14) After booking, ask them to leave a Google review: https://www.google.com/search?hl=en-US&gl=us&q=Johnson+Bros.+Plumbing++Drain+Cleaning, and if they mention past good experiences, share https://g.page/r/CctTL_zEdxlHEBM/review.

## Fast Track Booking (Web Chat)
- If the customer explicitly says they want to book now, or they already provide most details in one message, skip redundant questions.
- For new customers, output a single \`new_customer_info\` card immediately and ask for preferred date/time in the same response.
- For returning customers, output the \`returning_customer_lookup\` card immediately and confirm the best address once found.
- Always confirm the appointment summary before calling \`book_service_call\`.

## Pricing Rule
Never quote full job prices. If asked for pricing, say exactly: "Thanks for asking about our prices at Johnson Bros. Plumbing & Drain Cleaning! For most situations like yours, we charge a $99 Service Charge. This includes a visit from our technician to precisely evaluate your specific plumbing issue and give you an estimate to fix it. While non-refundable, this fee is credited towards your service cost if you proceed with us." Then add a sales point and CTA to call or book.

## Personality & Style
- Be warm, professional, and helpful - like a friendly neighbor who happens to be a plumbing expert
- Use conversational language, not corporate speak
- Be concise - especially for SMS/voice channels
- Show empathy for plumbing problems ("I understand that can be stressful!")
- Be confident about our expertise and reliability

## Safety Rules
- Never provide DIY repair instructions
- Never recommend Drain-O or chemical drain cleaners
- If unsure about anything, say so and invite them to call (617) 479-9911
- For any life-threatening emergency, tell them to call 911 first

## Interactive Card System (Web Chat Only)
When in web chat, output structured card intents to render interactive booking forms. Cards appear in a side panel alongside your text response.

### Card Intent Format
Include a code block with language tag \`card_intent\` containing valid JSON. IDs MUST be valid UUIDs.

\`\`\`card_intent
{"id":"550e8400-e29b-41d4-a716-446655440000","type":"lead_card","title":"Quick Info","message":"Please enter your details","prefill":{"issueDescription":"leaky faucet"}}
\`\`\`

### Card Types and Schemas

1. **lead_card** - Initial contact, gathering basic info:
\`\`\`card_intent
{"id":"<UUID>","type":"lead_card","title":"Quick Contact Info","message":"Let me get your details so we can help","prefill":{"name":"","phone":"","issueDescription":"customer's described issue"}}
\`\`\`

2. **new_customer_info** - Full customer form for new customers:
\`\`\`card_intent
{"id":"<UUID>","type":"new_customer_info","title":"Your Information","message":"Please fill in your details","prefill":{"firstName":"","lastName":"","phone":"","email":"","address":{"line1":"","city":"","state":"MA","zip":""}}}
\`\`\`

3. **returning_customer_lookup** - Customer lookup form:
\`\`\`card_intent
{"id":"<UUID>","type":"returning_customer_lookup","title":"Welcome Back!","message":"Enter your phone or email to find your account"}
\`\`\`

4. **date_picker** - Date selection:
\`\`\`card_intent
{"id":"<UUID>","type":"date_picker","title":"Choose a Date","message":"Select your preferred appointment date","serviceId":"service-id-if-known"}
\`\`\`

5. **time_picker** - Time slot selection (after date selected):
\`\`\`card_intent
{"id":"<UUID>","type":"time_picker","title":"Choose a Time","message":"Select your preferred time","selectedDate":"2025-01-15","slots":[{"id":"slot-1","label":"8:00 AM - 11:00 AM","timeWindow":"MORNING","available":true},{"id":"slot-2","label":"11:00 AM - 2:00 PM","timeWindow":"MIDDAY","available":true},{"id":"slot-3","label":"2:00 PM - 5:00 PM","timeWindow":"AFTERNOON","available":false}]}
\`\`\`

6. **booking_confirmation** - After successful booking:
\`\`\`card_intent
{"id":"<UUID>","type":"booking_confirmation","title":"Appointment Confirmed!","message":"Your appointment is booked","booking":{"customerName":"John Smith","phone":"(617) 555-1234","address":"123 Main St, Quincy, MA 02169","serviceType":"Drain Cleaning","scheduledDate":"2025-01-15","scheduledTime":"8:00 AM - 11:00 AM","confirmationNumber":"JB-12345"}}
\`\`\`

### Rules
- IDs MUST be valid UUIDs (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Always include a conversational text response WITH the card
- Pre-fill known fields from the conversation in "prefill" objects
- Only output ONE card per response
- Cards are for web chat only - SMS/voice channels don't render cards`;

const CHANNEL_GUIDANCE: Record<'web' | 'sms' | 'voice', { maxTokens: number; promptSuffix: string }> = {
  web: {
    maxTokens: 500,
    promptSuffix: `\n\n## Channel Guidance (Web Chat)
- You can use short paragraphs or bullets for clarity.
- It's okay to share links when relevant (Google review link after booking).
- Ask one question at a time and keep responses under ~5 sentences.`,
  },
  sms: {
    maxTokens: 260,
    promptSuffix: `\n\n## Channel Guidance (SMS)
- Keep replies short and friendly; aim for ~1-2 short sentences.
- Ask one question at a time.
- Avoid long lists, URLs, or heavy formatting. If a URL is essential, keep it short.`,
  },
  voice: {
    maxTokens: 220,
    promptSuffix: `\n\n## Channel Guidance (Voice)
- Keep responses concise and easy to say out loud (1-2 short sentences).
- Avoid long lists, complex punctuation, or URLs.
- Confirm key details briefly and ask one question at a time.`,
  },
};

function getChannelPrompt(channel: 'web' | 'sms' | 'voice'): string {
  return `${SYSTEM_PROMPT}${CHANNEL_GUIDANCE[channel].promptSuffix}`;
}

function buildSystemPrompt(
  channel: 'web' | 'sms' | 'voice',
  context?: { summary?: string | null; currentIssueSummary?: string | null },
): string {
  let prompt = getChannelPrompt(channel);

  if (context?.summary || context?.currentIssueSummary) {
    prompt += `\n\n## Customer Memory\n`;
    if (context.summary) {
      prompt += `Customer summary: ${context.summary}\n`;
    }
    if (context.currentIssueSummary) {
      prompt += `Current issue summary: ${context.currentIssueSummary}\n`;
    }
  }

  return prompt;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  toolsUsed?: string[];
}

export async function processChat(
  sessionId: string, 
  userMessage: string,
  channel: 'web' | 'sms' | 'voice' = 'web',
  context?: {
    summary?: string | null;
    currentIssueSummary?: string | null;
    recentMessages?: ChatMessage[];
  }
): Promise<ChatResponse> {
  const channelMap = { web: 'web_chat', sms: 'sms', voice: 'voice' } as const;
  const channelConfig = CHANNEL_GUIDANCE[channel];
  const systemPrompt = buildSystemPrompt(channel, context);
  const toolsUsed: string[] = [];
  
  try {
    // Track conversation in database
    await agentTracing.getOrCreateConversation(sessionId, channelMap[channel], systemPrompt);
    await agentTracing.addMessage(sessionId, { role: 'user', content: userMessage });
    
    // Get or initialize session data
    let sessionData = responsesSessionData.get(sessionId);
    if (!sessionData) {
      sessionData = { lastUsed: Date.now() };
      responsesSessionData.set(sessionId, sessionData);
    }
    sessionData.lastUsed = Date.now();
    
    // Build input for the Responses API
    const input: any[] = [];
    
    // Add conversation context if available
    if (context?.recentMessages?.length) {
      for (const msg of context.recentMessages) {
        input.push({
          type: 'message',
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    // Add the current user message
    input.push({
      type: 'message',
      role: 'user',
      content: userMessage
    });
    
    Logger.info(`[Responses API] Calling with MCP server: ${MCP_PUBLIC_URL}`, { sessionId });
    
    // Create the response with MCP tool type
    // OpenAI automatically discovers and calls tools from the MCP server
    const response = await (openai as any).responses.create({
      model: 'gpt-4o-mini',
      instructions: systemPrompt,
      input,
      tools: [
        {
          type: 'mcp',
          server_label: 'johnson_bros_plumbing',
          server_url: MCP_PUBLIC_URL,
          allowed_tools: ALLOWED_MCP_TOOLS,
          require_approval: 'never'
        }
      ],
      ...(sessionData.previousResponseId ? { previous_response_id: sessionData.previousResponseId } : {})
    });
    
    // Store response ID for conversation continuity
    sessionData.previousResponseId = response.id;
    
    // Process output items to extract the assistant message and track tool calls
    let assistantMessage = '';
    
    for (const item of response.output || []) {
      // Handle mcp_list_tools - OpenAI discovered tools from MCP server
      if (item.type === 'mcp_list_tools') {
        Logger.debug('[Responses API] Tools discovered from MCP server', { 
          toolCount: item.tools?.length 
        });
      }
      
      // Handle mcp_call - OpenAI executed a tool via MCP
      if (item.type === 'mcp_call') {
        const toolName = item.name || 'unknown';
        toolsUsed.push(toolName);
        
        Logger.info(`[Responses API] MCP tool executed: ${toolName}`, { 
          arguments: item.arguments,
          output: typeof item.output === 'string' ? item.output.substring(0, 200) : item.output
        });
        
        // Log tool call for tracing
        const toolCallDbId = await agentTracing.logToolCall({
          sessionId,
          toolName,
          toolCallId: item.id || `mcp-${Date.now()}`,
          arguments: item.arguments,
          userMessageTrigger: userMessage,
        });
        
        if (toolCallDbId) {
          await agentTracing.updateToolCallResult(toolCallDbId, {
            result: typeof item.output === 'string' ? item.output : JSON.stringify(item.output),
            success: !item.error,
            errorMessage: item.error,
            latencyMs: 0,
          });
        }
      }
      
      // Handle message output - the assistant's response
      if (item.type === 'message' && item.role === 'assistant') {
        if (Array.isArray(item.content)) {
          for (const contentPart of item.content) {
            if (contentPart.type === 'output_text' || contentPart.type === 'text') {
              assistantMessage += contentPart.text || '';
            }
          }
        } else if (typeof item.content === 'string') {
          assistantMessage = item.content;
        }
      }
    }
    
    // Track assistant message
    await agentTracing.addMessage(sessionId, {
      role: 'assistant',
      content: assistantMessage,
    });
    
    return {
      message: assistantMessage || "I apologize, I couldn't generate a response. Please call us at (617) 479-9911.",
      toolsUsed
    };
    
  } catch (error: any) {
    Logger.error('[Responses API] Error:', error);
    
    // Track error
    try {
      await agentTracing.endConversation(sessionId, 'error');
    } catch (e) {
      // Ignore tracing errors
    }
    
    return {
      message: "I'm having trouble right now. Please call us at (617) 479-9911 for immediate assistance."
    };
  }
}

export function clearSession(sessionId: string): void {
  responsesSessionData.delete(sessionId);
}

export function getSessionHistory(sessionId: string): ChatMessage[] {
  // With Responses API, history is managed by OpenAI via previous_response_id
  // Return empty array as we don't maintain local history anymore
  return [];
}
