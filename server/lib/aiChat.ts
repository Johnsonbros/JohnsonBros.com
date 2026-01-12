// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI to understand customer requests and calls MCP server for HousecallPro integration

import OpenAI from 'openai';
import { Logger } from '../src/logger';
import { fetch } from 'undici';
import { agentTracing } from './agentTracing';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MCP Server endpoint - running on port 3001
const DEFAULT_MCP_BASE_URL = 'http://localhost:3001';
const MCP_SERVER_URL = (process.env.MCP_SERVER_URL || DEFAULT_MCP_BASE_URL).replace(/\/$/, '');

// Define the tools available to the AI (mirrors MCP server tools)
const PLUMBING_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description: "Look up an existing customer in the system by phone number, email, or name. Use this when a customer asks to be looked up or wants to use their existing information.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Customer's phone number to search for"
          },
          email: {
            type: "string",
            description: "Customer's email address to search for"
          },
          name: {
            type: "string",
            description: "Customer's name to search for"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_services",
      description: "List all plumbing services offered by Johnson Bros. Plumbing with descriptions, price ranges, and estimated durations",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filter by category: emergency, maintenance, repair, installation, specialty"
          },
          search: {
            type: "string",
            description: "Search term to filter services"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_quote",
      description: "Get an instant price estimate for plumbing services based on the type of work needed",
      parameters: {
        type: "object",
        properties: {
          service_type: {
            type: "string",
            description: "Type of service (e.g., 'drain cleaning', 'water heater repair')"
          },
          issue_description: {
            type: "string",
            description: "Description of the plumbing problem"
          },
          property_type: {
            type: "string",
            enum: ["residential", "commercial"],
            description: "Type of property"
          },
          urgency: {
            type: "string",
            enum: ["routine", "soon", "urgent", "emergency"],
            description: "How urgent is the repair"
          }
        },
        required: ["service_type", "issue_description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_availability",
      description: "Search for available appointment slots on a specific date",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date to check availability (YYYY-MM-DD format)"
          },
          serviceType: {
            type: "string",
            description: "Type of plumbing service"
          },
          time_preference: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "any"],
            description: "Preferred time of day"
          }
        },
        required: ["date", "serviceType"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_service_call",
      description: "Book a plumbing service appointment. Creates the booking in HousecallPro with customer info and schedules the appointment.",
      parameters: {
        type: "object",
        properties: {
          first_name: {
            type: "string",
            description: "Customer's first name"
          },
          last_name: {
            type: "string",
            description: "Customer's last name"
          },
          phone: {
            type: "string",
            description: "Customer's phone number"
          },
          email: {
            type: "string",
            description: "Customer's email address"
          },
          street: {
            type: "string",
            description: "Street address for service"
          },
          city: {
            type: "string",
            description: "City"
          },
          state: {
            type: "string",
            description: "State (e.g., MA)"
          },
          zip: {
            type: "string",
            description: "ZIP code"
          },
          description: {
            type: "string",
            description: "Description of the plumbing issue"
          },
          time_preference: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "any"],
            description: "Preferred time of day"
          },
          earliest_date: {
            type: "string",
            description: "Earliest preferred date (YYYY-MM-DD)"
          }
        },
        required: ["first_name", "last_name", "phone", "street", "city", "state", "zip", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "emergency_help",
      description: "Get immediate guidance for plumbing emergencies with safety instructions",
      parameters: {
        type: "object",
        properties: {
          emergency_type: {
            type: "string",
            description: "Type of emergency (e.g., 'burst pipe', 'gas leak', 'sewage backup')"
          },
          additional_details: {
            type: "string",
            description: "Additional details about the situation"
          }
        },
        required: ["emergency_type"]
      }
    }
  }
];

// Session storage for MCP sessions
const mcpSessions: Map<string, string> = new Map();

// Call MCP server tool with automatic session recovery
async function callMCPTool(toolName: string, args: any, chatSessionId: string, retryOnExpired: boolean = true): Promise<any> {
  try {
    // Get or create MCP session
    let mcpSessionId = mcpSessions.get(chatSessionId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    };

    if (mcpSessionId) {
      headers['Mcp-Session-Id'] = mcpSessionId;
    }

    // Call MCP server with tools/call method
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    // Store session ID if returned
    const sessionIdHeader = response.headers.get('Mcp-Session-Id');
    if (sessionIdHeader) {
      mcpSessions.set(chatSessionId, sessionIdHeader);
    }

    if (!response.ok) {
      const errorText = await response.text();

      // Check if it's a session expiration error (400 with -32001 code)
      if (response.status === 400) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.code === -32001 && retryOnExpired) {
            Logger.warn(`MCP session expired for chat session ${chatSessionId}, reinitializing...`);
            // Clear the expired session
            mcpSessions.delete(chatSessionId);
            // Reinitialize the session
            const initialized = await initMCPSession(chatSessionId);
            if (initialized) {
              Logger.info(`MCP session reinitialized, retrying tool call: ${toolName}`);
              // Retry the tool call once (retryOnExpired = false prevents infinite loop)
              return await callMCPTool(toolName, args, chatSessionId, false);
            }
          }
        } catch (parseError) {
          // If we can't parse the error, continue with generic error handling
        }
      }

      Logger.error(`MCP server error: ${response.status} ${errorText}`);
      throw new Error(`MCP server error: ${response.status}`);
    }

    const result = await response.json() as any;

    if (result.error) {
      // Check for session expiration in the result
      if (result.error.code === -32001 && retryOnExpired) {
        Logger.warn(`MCP session expired (error code), reinitializing...`);
        mcpSessions.delete(chatSessionId);
        const initialized = await initMCPSession(chatSessionId);
        if (initialized) {
          Logger.info(`MCP session reinitialized, retrying tool call: ${toolName}`);
          return await callMCPTool(toolName, args, chatSessionId, false);
        }
      }

      Logger.error('MCP tool error:', result.error);
      throw new Error(result.error.message || 'MCP tool error');
    }

    // Extract text content from MCP response
    if (result.result?.content?.[0]?.text) {
      return result.result.content[0].text;
    }

    return JSON.stringify(result.result || result);

  } catch (error: any) {
    Logger.error(`MCP tool call failed for ${toolName}:`, error);
    throw error;
  }
}

// Initialize MCP session
async function initMCPSession(chatSessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'jb-chat',
            version: '1.0.0'
          }
        }
      })
    });

    const sessionIdHeader = response.headers.get('Mcp-Session-Id');
    if (sessionIdHeader) {
      mcpSessions.set(chatSessionId, sessionIdHeader);
      Logger.info(`MCP session initialized: ${sessionIdHeader}`);
      return true;
    }
    
    return response.ok;
  } catch (error: any) {
    Logger.error('Failed to initialize MCP session:', error);
    return false;
  }
}

// Execute tool calls - routes to MCP server for real HousecallPro integration
async function executeTool(name: string, args: any, chatSessionId: string): Promise<string> {
  Logger.info(`Executing tool via MCP: ${name}`, args);
  
  try {
    // Ensure MCP session is initialized
    if (!mcpSessions.has(chatSessionId)) {
      await initMCPSession(chatSessionId);
    }
    
    // Call the MCP server
    const result = await callMCPTool(name, args, chatSessionId);
    return typeof result === 'string' ? result : JSON.stringify(result);
    
  } catch (error: any) {
    Logger.error(`Tool ${name} failed, returning error response:`, error);
    
    // Return helpful error messages based on tool type
    switch (name) {
      case 'lookup_customer':
        return JSON.stringify({
          success: false,
          error: "I'm having trouble accessing customer records right now. Could you please provide your details so I can help you book an appointment?",
          fallback: true
        });
        
      case 'book_service_call':
        return JSON.stringify({
          success: false,
          error: "I'm having trouble completing the booking. Please call us directly at (617) 479-9911 to schedule your appointment.",
          fallback: true
        });
        
      case 'search_availability':
        return JSON.stringify({
          success: false,
          error: "I couldn't check availability right now. Please call (617) 479-9911 to check available times.",
          fallback: true
        });
        
      default:
        return JSON.stringify({
          success: false,
          error: "I'm experiencing a technical issue. Please try again or call (617) 479-9911.",
          fallback: true
        });
    }
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
✅ USE when customer describes emergency: burst pipe, flooding, gas smell, sewage backup
✅ USE immediately when safety is at risk
❌ DO NOT USE for routine issues that can wait

## Sequential Booking Steps (wait for user reply after each):
1) Greet the customer and ask how Johnson Bros. can assist.
2) Ask 1–2 targeted questions about their issue to capture booking notes.
3) Ask if they want to schedule an appointment.
4) If yes, ask if it is an emergency.
5) If emergency, instruct them to call (617) 479-9911 immediately.
6) If not emergency, ask if they have used Johnson Bros. before. Remind them of the service fee when appropriate.
7) If they say YES (returning customer): OUTPUT a \`returning_customer_lookup\` card to collect their phone/email. Do NOT call lookup_customer yet - wait for the card submission.
8) After receiving their phone/email from the card, call lookup_customer and show their saved info.
9) When showing saved addresses, list them like: 1) 184 Furnace Brook Parkway, Unit 2, Quincy, MA 02169 2) 75 East Elm Ave, Quincy, MA 02170. Remember and store address_id values.
10) If they are NEW (not used us before): OUTPUT a \`new_customer_info\` card to collect their details.
11) Remember and store customer_id for bookings.
12) Ask what date/time works best. OUTPUT a \`date_picker\` card, then after selection OUTPUT a \`time_picker\` card with available slots.
13) Once details are confirmed, book them in the system (book_service_call) with clear notes, then OUTPUT a \`booking_confirmation\` card.
14) If they have multiple issues, prompt them to call the office directly at (617) 479-9911.
15) After booking, ask them to leave a Google review: https://www.google.com/search?hl=en-US&gl=us&q=Johnson+Bros.+Plumbing++Drain+Cleaning, and if they mention past good experiences, share https://g.page/r/CctTL_zEdxlHEBM/review.

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
\`\`\`json
{
  "id": "<UUID>",
  "type": "lead_card",
  "title": "Quick Contact Info",
  "message": "Let me get your details so we can help",
  "prefill": {
    "name": "",
    "phone": "",
    "issueDescription": "customer's described issue"
  }
}
\`\`\`

2. **new_customer_info** - Full customer form for new customers:
\`\`\`json
{
  "id": "<UUID>",
  "type": "new_customer_info",
  "title": "Your Information",
  "message": "Please fill in your details",
  "prefill": {
    "firstName": "",
    "lastName": "",
    "phone": "",
    "email": "",
    "address": {
      "line1": "",
      "city": "",
      "state": "MA",
      "zip": ""
    }
  }
}
\`\`\`

3. **returning_customer_lookup** - Customer lookup form:
\`\`\`json
{
  "id": "<UUID>",
  "type": "returning_customer_lookup",
  "title": "Welcome Back!",
  "message": "Enter your phone or email to find your account"
}
\`\`\`

4. **date_picker** - Date selection:
\`\`\`json
{
  "id": "<UUID>",
  "type": "date_picker",
  "title": "Choose a Date",
  "message": "Select your preferred appointment date",
  "serviceId": "service-id-if-known"
}
\`\`\`

5. **time_picker** - Time slot selection (after date selected):
\`\`\`json
{
  "id": "<UUID>",
  "type": "time_picker",
  "title": "Choose a Time",
  "message": "Select your preferred time",
  "selectedDate": "2025-01-15",
  "slots": [
    {"id": "slot-1", "label": "8:00 AM - 11:00 AM", "timeWindow": "MORNING", "available": true},
    {"id": "slot-2", "label": "11:00 AM - 2:00 PM", "timeWindow": "MIDDAY", "available": true},
    {"id": "slot-3", "label": "2:00 PM - 5:00 PM", "timeWindow": "AFTERNOON", "available": false}
  ]
}
\`\`\`

6. **booking_confirmation** - After successful booking:
\`\`\`json
{
  "id": "<UUID>",
  "type": "booking_confirmation",
  "title": "Appointment Confirmed!",
  "message": "Your appointment is booked",
  "booking": {
    "customerName": "John Smith",
    "phone": "(617) 555-1234",
    "address": "123 Main St, Quincy, MA 02169",
    "serviceType": "Drain Cleaning",
    "scheduledDate": "2025-01-15",
    "scheduledTime": "8:00 AM - 11:00 AM",
    "confirmationNumber": "JB-12345"
  }
}
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

// Store conversation history per session
const conversationHistory: Map<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]> = new Map();

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
  
  try {
    // Ensure conversation is tracked
    const conversationId = await agentTracing.getOrCreateConversation(
      sessionId, 
      channelMap[channel],
      systemPrompt
    );
    
    // Get or create conversation history
    let history = conversationHistory.get(sessionId) || [];
    
    // Add system prompt if new conversation
    if (history.length === 0) {
      history.push({ role: 'system', content: systemPrompt });
      if (context?.recentMessages?.length) {
        history.push(
          ...context.recentMessages.map((message) => ({
            role: message.role,
            content: message.content,
          }))
        );
      }
    } else {
      history[0] = { role: 'system', content: systemPrompt };
    }
    
    // Add user message
    history.push({ role: 'user', content: userMessage });
    
    // Track user message
    await agentTracing.addMessage(sessionId, {
      role: 'user',
      content: userMessage,
    });
    
    // Limit history to prevent token overflow
    if (history.length > 20) {
      history = [history[0], ...history.slice(-18)];
    }
    
    // Call OpenAI with tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: history,
      tools: PLUMBING_TOOLS,
      tool_choice: 'auto',
      max_tokens: channelConfig.maxTokens
    });
    
    const assistantMessage = response.choices[0].message;
    const toolsUsed: string[] = [];
    
    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      history.push(assistantMessage);
      
      // Track assistant message with tool calls
      await agentTracing.addMessage(sessionId, {
        role: 'assistant',
        content: assistantMessage.content || '',
        toolCalls: assistantMessage.tool_calls
          .filter(tc => tc.type === 'function')
          .map(tc => ({
            id: tc.id,
            name: (tc as any).function.name,
            arguments: JSON.parse((tc as any).function.arguments),
          })),
      });
      
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        toolsUsed.push(toolName);
        
        // Log tool call start
        const startTime = Date.now();
        const toolCallDbId = await agentTracing.logToolCall({
          sessionId,
          toolName,
          toolCallId: toolCall.id,
          arguments: toolArgs,
          userMessageTrigger: userMessage,
        });
        
        // Execute tool via MCP server
        let toolResult: string;
        let success = true;
        let errorMessage: string | undefined;
        
        try {
          toolResult = await executeTool(toolName, toolArgs, sessionId);
        } catch (error: any) {
          toolResult = JSON.stringify({ error: error.message });
          success = false;
          errorMessage = error.message;
        }
        
        // Log tool call result
        const latencyMs = Date.now() - startTime;
        if (toolCallDbId) {
          await agentTracing.updateToolCallResult(toolCallDbId, {
            result: toolResult,
            success,
            errorMessage,
            latencyMs,
          });
        }
        
        // Track tool response
        await agentTracing.addMessage(sessionId, {
          role: 'tool',
          content: toolResult,
          toolCallId: toolCall.id,
        });
        
        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult
        });
      }
      
      // Get final response after tool calls
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: history,
        max_tokens: channelConfig.maxTokens
      });
      
      const finalMessage = finalResponse.choices[0].message;
      history.push(finalMessage);
      conversationHistory.set(sessionId, history);
      
      // Track final assistant message
      await agentTracing.addMessage(sessionId, {
        role: 'assistant',
        content: finalMessage.content || '',
      });
      
      return {
        message: finalMessage.content || "I apologize, I couldn't generate a response. Please call us at (617) 479-9911.",
        toolsUsed
      };
    }
    
    // No tool calls - just return the response
    history.push(assistantMessage);
    conversationHistory.set(sessionId, history);
    
    // Track assistant message
    await agentTracing.addMessage(sessionId, {
      role: 'assistant',
      content: assistantMessage.content || '',
    });
    
    return {
      message: assistantMessage.content || "I apologize, I couldn't generate a response. Please call us at (617) 479-9911.",
      toolsUsed
    };
    
  } catch (error: any) {
    Logger.error('AI Chat error:', error);
    
    // Track error in conversation
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

export function clearSession(sessionId: string): void {
  conversationHistory.delete(sessionId);
  mcpSessions.delete(sessionId);
}

export function getSessionHistory(sessionId: string): ChatMessage[] {
  const history = conversationHistory.get(sessionId) || [];
  return history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : ''
    }));
}
