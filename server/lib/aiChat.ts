// AI Chat Service - Powers web chat, SMS, and voice conversations
// Uses OpenAI to understand customer requests and call MCP tools

import OpenAI from 'openai';
import { Logger } from '../src/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define the tools available to the AI (mirrors MCP server tools)
const PLUMBING_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
      description: "Book a plumbing service appointment. Collects customer info, finds available slots, and creates the booking",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Customer's full name"
          },
          customer_phone: {
            type: "string",
            description: "Customer's phone number"
          },
          customer_email: {
            type: "string",
            description: "Customer's email address"
          },
          address: {
            type: "string",
            description: "Full service address including city, state, and ZIP"
          },
          service_type: {
            type: "string",
            description: "Type of plumbing service needed"
          },
          issue_description: {
            type: "string",
            description: "Description of the plumbing issue"
          },
          preferred_date: {
            type: "string",
            description: "Preferred appointment date (YYYY-MM-DD)"
          },
          time_preference: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "any"],
            description: "Preferred time of day"
          }
        },
        required: ["customer_name", "customer_phone", "address", "service_type", "issue_description"]
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

// Service data (same as MCP server)
const PLUMBING_SERVICES = [
  { id: "emergency-repair", name: "Emergency Plumbing Repair", description: "24/7 emergency services for burst pipes, major leaks, sewage backups", priceRange: { min: 150, max: 500 }, estimatedDuration: "1-4 hours", category: "emergency", isEmergency: true },
  { id: "drain-cleaning", name: "Drain Cleaning", description: "Professional drain cleaning for clogged sinks, showers, tubs", priceRange: { min: 99, max: 250 }, estimatedDuration: "1-2 hours", category: "maintenance" },
  { id: "water-heater", name: "Water Heater Service", description: "Installation, repair, and maintenance of water heaters", priceRange: { min: 150, max: 2500 }, estimatedDuration: "2-6 hours", category: "installation" },
  { id: "toilet-repair", name: "Toilet Repair & Installation", description: "Fix running toilets, clogs, leaks, or install new toilets", priceRange: { min: 85, max: 450 }, estimatedDuration: "1-3 hours", category: "repair" },
  { id: "faucet-fixtures", name: "Faucet & Fixture Installation", description: "Install or repair faucets, showerheads, garbage disposals", priceRange: { min: 75, max: 300 }, estimatedDuration: "1-2 hours", category: "installation" },
  { id: "pipe-repair", name: "Pipe Repair & Replacement", description: "Fix leaking, corroded, or damaged pipes", priceRange: { min: 150, max: 800 }, estimatedDuration: "2-8 hours", category: "repair" },
  { id: "sewer-line", name: "Sewer Line Service", description: "Camera inspection, cleaning, and repair of main sewer lines", priceRange: { min: 200, max: 5000 }, estimatedDuration: "2-8 hours", category: "specialty" },
  { id: "gas-line", name: "Gas Line Services", description: "Gas leak detection, repair, and new gas line installation", priceRange: { min: 150, max: 1500 }, estimatedDuration: "2-6 hours", category: "specialty" },
  { id: "sump-pump", name: "Sump Pump Services", description: "Installation, repair, and maintenance of sump pumps", priceRange: { min: 150, max: 1200 }, estimatedDuration: "2-4 hours", category: "installation" },
  { id: "water-filtration", name: "Water Filtration", description: "Whole-house water filtration and water softener installation", priceRange: { min: 300, max: 3000 }, estimatedDuration: "3-6 hours", category: "installation" }
];

const EMERGENCY_GUIDANCE: Record<string, any> = {
  "burst_pipe": {
    title: "Burst Pipe Emergency",
    immediateSteps: ["Turn off the main water supply immediately", "Turn off electricity in affected areas", "Open faucets to drain remaining water", "Move valuables away from the water"],
    doNotDo: ["Do not attempt to repair the pipe yourself while water is on", "Do not use electrical appliances in wet areas"],
    urgency: "critical"
  },
  "gas_leak": {
    title: "Gas Leak Emergency",
    immediateSteps: ["Do NOT turn on any lights or electrical switches", "Do NOT use your phone inside the house", "Open windows and doors if safely possible", "Leave the house immediately", "Call 911 and your gas company from outside"],
    doNotDo: ["NEVER light matches or flames", "NEVER operate electrical switches", "NEVER try to locate the leak yourself"],
    urgency: "critical"
  },
  "sewage_backup": {
    title: "Sewage Backup Emergency",
    immediateSteps: ["Stop using all water immediately", "Keep children and pets away", "Turn off HVAC to prevent spreading contamination", "Open windows for ventilation"],
    doNotDo: ["Do NOT try to clean up sewage yourself", "Do NOT run water or flush toilets"],
    urgency: "critical"
  },
  "no_hot_water": {
    title: "No Hot Water",
    immediateSteps: ["Check if the water heater is getting power", "For gas heaters: Check if the pilot light is lit", "Check the temperature setting", "Allow 30-60 minutes after relighting pilot"],
    doNotDo: ["Do not attempt to repair gas connections yourself"],
    urgency: "moderate"
  },
  "clogged_drain": {
    title: "Clogged Drain",
    immediateSteps: ["Try a plunger first", "For kitchen sinks: Check garbage disposal", "Avoid chemical drain cleaners", "Try hot water flush"],
    doNotDo: ["Do not mix different chemical drain cleaners"],
    urgency: "low"
  }
};

// Execute tool calls locally
async function executeTool(name: string, args: any): Promise<string> {
  Logger.info(`Executing tool: ${name}`, args);
  
  switch (name) {
    case "get_services": {
      let services = [...PLUMBING_SERVICES];
      if (args.category) {
        services = services.filter(s => s.category === args.category);
      }
      if (args.search) {
        const term = args.search.toLowerCase();
        services = services.filter(s => 
          s.name.toLowerCase().includes(term) || 
          s.description.toLowerCase().includes(term)
        );
      }
      return JSON.stringify({
        services: services.map(s => ({
          name: s.name,
          description: s.description,
          price_range: `$${s.priceRange.min} - $${s.priceRange.max}`,
          duration: s.estimatedDuration,
          category: s.category
        })),
        total: services.length,
        phone: "(617) 479-9911"
      });
    }
    
    case "get_quote": {
      const searchTerms = (args.service_type || '').toLowerCase();
      const foundService = PLUMBING_SERVICES.find(s => 
        s.name.toLowerCase().includes(searchTerms) ||
        s.description.toLowerCase().includes(searchTerms)
      );
      
      const service = foundService || { 
        id: "general", 
        name: "General Plumbing Service", 
        description: "General plumbing services",
        priceRange: { min: 99, max: 500 }, 
        estimatedDuration: "1-4 hours",
        category: "repair"
      };
      
      let multiplier = 1;
      if (args.urgency === "emergency") multiplier = 1.5;
      else if (args.urgency === "urgent") multiplier = 1.25;
      if (args.property_type === "commercial") multiplier *= 1.2;
      
      return JSON.stringify({
        service: service.name,
        estimated_price_range: `$${Math.round(service.priceRange.min * multiplier)} - $${Math.round(service.priceRange.max * multiplier)}`,
        estimated_duration: service.estimatedDuration,
        urgency: args.urgency || "routine",
        notes: ["Final price depends on actual scope of work", "We offer a $99 diagnostic fee waived if you proceed with repair"],
        next_step: "Book an appointment for an exact quote"
      });
    }
    
    case "search_availability": {
      // Simulate availability - in production this calls HousecallPro
      const slots = [
        { time: "9:00 AM", available: true },
        { time: "11:00 AM", available: true },
        { time: "2:00 PM", available: true },
        { time: "4:00 PM", available: true }
      ];
      
      let filtered = slots;
      if (args.time_preference === "morning") {
        filtered = slots.filter(s => s.time.includes("AM"));
      } else if (args.time_preference === "afternoon") {
        filtered = slots.filter(s => s.time.includes("PM"));
      }
      
      return JSON.stringify({
        date: args.date,
        service: args.serviceType,
        available_slots: filtered,
        total_available: filtered.length,
        message: filtered.length > 0 
          ? `Found ${filtered.length} available slots on ${args.date}`
          : "No slots available. Try a different date or time preference."
      });
    }
    
    case "book_service_call": {
      // In production, this would call the MCP server's book_service_call
      // For now, return a confirmation that guides the user
      return JSON.stringify({
        status: "booking_initiated",
        message: `To complete your booking for ${args.service_type}, please confirm: Name: ${args.customer_name}, Phone: ${args.customer_phone}, Address: ${args.address}`,
        next_steps: [
          "We'll call you within 30 minutes to confirm the appointment",
          "A technician will arrive at the scheduled time",
          "Payment is due upon completion"
        ],
        emergency_note: "For immediate emergencies, call us directly at (617) 479-9911"
      });
    }
    
    case "emergency_help": {
      const type = (args.emergency_type || '').toLowerCase();
      let guidance = null;
      
      if (type.includes('burst') || type.includes('pipe')) guidance = EMERGENCY_GUIDANCE.burst_pipe;
      else if (type.includes('gas')) guidance = EMERGENCY_GUIDANCE.gas_leak;
      else if (type.includes('sewage') || type.includes('backup')) guidance = EMERGENCY_GUIDANCE.sewage_backup;
      else if (type.includes('hot water') || type.includes('water heater')) guidance = EMERGENCY_GUIDANCE.no_hot_water;
      else if (type.includes('clog') || type.includes('drain')) guidance = EMERGENCY_GUIDANCE.clogged_drain;
      
      if (!guidance) {
        guidance = {
          title: "Plumbing Emergency",
          immediateSteps: ["Turn off main water supply if there's active water damage", "Avoid using plumbing fixtures", "Document the issue with photos"],
          urgency: "moderate"
        };
      }
      
      return JSON.stringify({
        emergency_type: guidance.title,
        urgency: guidance.urgency,
        immediate_steps: guidance.immediateSteps,
        safety_warnings: guidance.doNotDo || [],
        call_now: guidance.urgency === "critical" ? "CALL NOW: (617) 479-9911" : "Schedule service: (617) 479-9911"
      });
    }
    
    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for Johnson Bros. Plumbing & Drain Cleaning, serving the South Shore of Massachusetts. Your role is to:

1. Help customers book plumbing service appointments
2. Provide instant price estimates for services
3. Give emergency plumbing guidance when needed
4. Answer questions about our services

Key information:
- Business: Johnson Bros. Plumbing & Drain Cleaning
- Phone: (617) 479-9911 (available 24/7 for emergencies)
- Service Area: South Shore Massachusetts (Quincy, Braintree, Weymouth, Hingham, Cohasset, Abington, and surrounding areas)
- We're licensed, insured, and have over 15 years of experience
- We offer "The Family Discount" membership ($99/year) for priority service and discounts

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
      max_tokens: channel === 'sms' ? 300 : 500 // Shorter for SMS
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
        const toolResult = await executeTool(toolName, toolArgs);
        
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
