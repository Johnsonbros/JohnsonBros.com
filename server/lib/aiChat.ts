// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI to understand customer requests and calls MCP server for HousecallPro integration

import OpenAI from 'openai';
import { Logger } from '../src/logger';
import { fetch } from 'undici';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MCP Server endpoint - running on port 3001
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

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

// Call MCP server tool
async function callMCPTool(toolName: string, args: any, chatSessionId: string): Promise<any> {
  try {
    // Get or create MCP session
    let mcpSessionId = mcpSessions.get(chatSessionId);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
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
      Logger.error(`MCP server error: ${response.status} ${errorText}`);
      throw new Error(`MCP server error: ${response.status}`);
    }

    const result = await response.json() as any;
    
    if (result.error) {
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
        'Content-Type': 'application/json'
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

const SYSTEM_PROMPT = `You are a helpful AI assistant for Johnson Bros. Plumbing & Drain Cleaning, serving the South Shore of Massachusetts. Your role is to:

1. Help customers book plumbing service appointments
2. Provide instant price estimates for services
3. Give emergency plumbing guidance when needed
4. Answer questions about our services
5. Look up existing customers when they ask - you CAN access customer records!

Key information:
- Business: Johnson Bros. Plumbing & Drain Cleaning
- Phone: (617) 479-9911 (available 24/7 for emergencies)
- Service Area: South Shore Massachusetts (Quincy, Braintree, Weymouth, Hingham, Cohasset, Abington, and surrounding areas)
- We're licensed, insured, and have over 15 years of experience
- We offer "The Family Discount" membership ($99/year) for priority service and discounts

IMPORTANT - Customer Lookup:
- When a customer asks "can you look me up?", "do you have my info?", or provides their phone/email, USE the lookup_customer tool
- You CAN access customer records - use the lookup_customer tool with their phone, email, or name
- If you find them, confirm their information and offer to book using their existing address
- If not found, politely ask for their details to create a new booking

Guidelines:
- Be friendly, professional, and helpful
- For emergencies (burst pipes, gas leaks, sewage), immediately provide safety guidance
- When booking, collect: name, phone, address, service needed, and preferred time
- Keep responses concise - customers may be texting or talking
- Always offer to help book an appointment or provide a quote
- If you can't help with something, offer to connect them with a human`;

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
  channel: 'web' | 'sms' | 'voice' = 'web'
): Promise<ChatResponse> {
  try {
    // Get or create conversation history
    let history = conversationHistory.get(sessionId) || [];
    
    // Add system prompt if new conversation
    if (history.length === 0) {
      history.push({ role: 'system', content: SYSTEM_PROMPT });
    }
    
    // Add user message
    history.push({ role: 'user', content: userMessage });
    
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
      max_tokens: channel === 'sms' ? 300 : 500
    });
    
    const assistantMessage = response.choices[0].message;
    const toolsUsed: string[] = [];
    
    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      history.push(assistantMessage);
      
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        toolsUsed.push(toolName);
        
        // Execute tool via MCP server
        const toolResult = await executeTool(toolName, toolArgs, sessionId);
        
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
        max_tokens: channel === 'sms' ? 300 : 500
      });
      
      const finalMessage = finalResponse.choices[0].message;
      history.push(finalMessage);
      conversationHistory.set(sessionId, history);
      
      return {
        message: finalMessage.content || "I apologize, I couldn't generate a response. Please call us at (617) 479-9911.",
        toolsUsed
      };
    }
    
    // No tool calls - just return the response
    history.push(assistantMessage);
    conversationHistory.set(sessionId, history);
    
    return {
      message: assistantMessage.content || "I apologize, I couldn't generate a response. Please call us at (617) 479-9911.",
      toolsUsed
    };
    
  } catch (error: any) {
    Logger.error('AI Chat error:', error);
    return {
      message: "I'm having trouble right now. Please call us at (617) 479-9911 for immediate assistance."
    };
  }
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
