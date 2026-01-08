// SMS Booking Agent - Uses OpenAI Agents SDK with MCP Server for HousecallPro booking
// Sends delayed SMS after form submission and manages AI-powered conversations via MCP tools

import { db } from '../db';
import { scheduledSms, smsConversations, smsMessages } from '@shared/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendSMS } from './twilio';
import { Logger } from '../src/logger';
// @ts-ignore - openai-agents types resolution issue
import { OpenAIAgent } from 'openai-agents';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Delay for follow-up SMS: 3 minutes and 57 seconds = 237 seconds
const FOLLOW_UP_DELAY_MS = 237 * 1000;

// MCP Server URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp';

// Store active agent sessions with conversation history
const agentSessions: Map<string, {
  messages: ChatCompletionMessageParam[];
  customerName: string;
  serviceDetails: string | null;
  conversationId: number;
}> = new Map();

// MCP Client singleton
let mcpClient: Client | null = null;
let mcpTools: any[] = [];
let mcpConnectionPromise: Promise<Client> | null = null;

// Retry configuration for MCP connection
const MCP_RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};

// Initialize MCP client connection with retry and exponential backoff
async function getMcpClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  // Prevent concurrent connection attempts
  if (mcpConnectionPromise) {
    return mcpConnectionPromise;
  }

  mcpConnectionPromise = connectWithRetry();
  
  try {
    const client = await mcpConnectionPromise;
    return client;
  } finally {
    mcpConnectionPromise = null;
  }
}

async function connectWithRetry(): Promise<Client> {
  let lastError: Error | null = null;
  let delay = MCP_RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= MCP_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      Logger.info(`[SMS Agent] Connecting to MCP server (attempt ${attempt}/${MCP_RETRY_CONFIG.maxRetries})...`);
      
      const transport = new StreamableHTTPClientTransport(
        new URL(MCP_SERVER_URL)
      );

      const client = new Client({
        name: 'sms-booking-agent',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await client.connect(transport);
      
      // Fetch available tools from MCP server
      const { tools } = await client.listTools();
      mcpTools = tools;
      mcpClient = client;
      
      Logger.info(`[SMS Agent] Connected to MCP server with ${tools.length} tools: ${tools.map((t: any) => t.name).join(', ')}`);
      
      return client;
    } catch (error: any) {
      lastError = error;
      Logger.warn(`[SMS Agent] MCP connection attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < MCP_RETRY_CONFIG.maxRetries) {
        const jitter = Math.random() * 0.2 * delay;
        const waitTime = Math.min(delay + jitter, MCP_RETRY_CONFIG.maxDelayMs);
        Logger.info(`[SMS Agent] Retrying MCP connection in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= MCP_RETRY_CONFIG.backoffMultiplier;
      }
    }
  }

  Logger.error('[SMS Agent] Failed to connect to MCP server after all retries:', { error: lastError?.message });
  throw lastError || new Error('Failed to connect to MCP server');
}

// Convert MCP tools to OpenAI function format
function mcpToolsToOpenAIFunctions(tools: any[]): any[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema || { type: 'object', properties: {} }
    }
  }));
}

// Execute an MCP tool call
async function executeMcpTool(name: string, args: any): Promise<string> {
  const client = await getMcpClient();
  
  try {
    Logger.info(`[SMS Agent] Executing MCP tool: ${name}`, { args });
    
    const result = await client.callTool({
      name,
      arguments: args
    });
    
    // Extract text content from result
    const content = result.content;
    if (Array.isArray(content)) {
      return content.map((c: any) => c.text || JSON.stringify(c)).join('\n');
    }
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error: any) {
    Logger.error(`[SMS Agent] MCP tool ${name} failed:`, { error: error.message });
    throw error;
  }
}

// Format phone number to E.164 format for Twilio
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

// Create the SMS booking agent with MCP tools
async function createSmsAgent(): Promise<OpenAIAgent> {
  // Ensure MCP client is connected and tools are loaded
  await getMcpClient();
  
  const agent = new OpenAIAgent({
    model: 'gpt-4o',
    system_instruction: `You are a friendly, professional AI assistant for Johnson Bros. Plumbing. You're having an SMS conversation with a potential customer to help them schedule a service call.

YOUR ROLE:
- Engage warmly and understand their plumbing issue
- Collect necessary information: name, address, phone, service description
- Book them for a $99 service call using the book_service_call tool
- The $99 service fee gets applied toward the cost of repairs

CONVERSATION STYLE:
- Keep messages short (SMS-friendly, under 160 chars when possible)
- Be helpful and empathetic about their plumbing problem
- Ask one question at a time
- Use the customer's first name

BOOKING PROCESS:
1. Understand their issue (use emergency_help if it's urgent like a burst pipe or gas leak)
2. Get their full address if not already known
3. Ask about their preferred timing (morning, afternoon, evening)
4. Use search_availability to find slots
5. Confirm the booking with book_service_call
6. Let them know about the $99 service call fee that applies to repairs

TOOLS AVAILABLE:
- book_service_call: Book a plumbing service appointment
- search_availability: Check available appointment slots  
- get_quote: Get instant price estimates
- get_services: List available plumbing services
- emergency_help: Provide emergency guidance for urgent issues

Remember: After booking, make sure the job notes include their issue description so the technician knows what to expect.`,
    temperature: 0.7,
    max_completion_tokens: 300
  });

  return agent;
}

// Schedule a follow-up SMS for a new lead
export async function scheduleLeadFollowUp(
  leadId: number,
  phoneNumber: string,
  customerName: string,
  serviceDetails: string
): Promise<number> {
  const scheduledFor = new Date(Date.now() + FOLLOW_UP_DELAY_MS);
  
  const [scheduled] = await db.insert(scheduledSms).values({
    leadId,
    phoneNumber: formatPhoneNumber(phoneNumber),
    customerName,
    serviceDetails,
    scheduledFor,
    status: 'pending',
  }).returning();
  
  Logger.info(`[SMS Agent] Scheduled follow-up for lead ${leadId} at ${scheduledFor.toISOString()}`);
  
  // Set up the delayed send
  setTimeout(async () => {
    await sendScheduledSms(scheduled.id);
  }, FOLLOW_UP_DELAY_MS);
  
  return scheduled.id;
}

// Generate personalized opening message using the agent
async function generateOpeningMessage(customerName: string, serviceDetails: string): Promise<string> {
  try {
    const agent = await createSmsAgent();
    
    const result = await agent.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Generate a brief, warm opening SMS message (under 160 chars) to follow up with a customer who just submitted a contact form.

Key points:
- Be warm and personal, use their first name
- Reference their plumbing issue briefly  
- Ask if you can help schedule a service call
- Mention the $99 service fee gets credited toward repairs
- Keep it conversational, not salesy`
        },
        {
          role: 'user',
          content: `Customer name: ${customerName}\nService details: ${serviceDetails || 'general plumbing help'}`
        }
      ],
      max_completion_tokens: 200
    });
    
    return result.choices[0].message.content || getDefaultOpeningMessage(customerName);
  } catch (error: any) {
    Logger.error('[SMS Agent] Error generating opening message:', { error: error?.message });
    return getDefaultOpeningMessage(customerName);
  }
}

function getDefaultOpeningMessage(customerName: string): string {
  const firstName = customerName.split(' ')[0];
  return `Hi ${firstName}! This is Johnson Bros. Plumbing following up on your request. Our $99 service call fee applies toward your repair. When works best to schedule?`;
}

// Send a scheduled SMS
async function sendScheduledSms(scheduledId: number): Promise<void> {
  try {
    const [scheduled] = await db
      .select()
      .from(scheduledSms)
      .where(eq(scheduledSms.id, scheduledId));
    
    if (!scheduled || scheduled.status !== 'pending') {
      Logger.info(`[SMS Agent] Scheduled SMS ${scheduledId} already processed or not found`);
      return;
    }
    
    // Generate personalized message
    const message = await generateOpeningMessage(
      scheduled.customerName,
      scheduled.serviceDetails || ''
    );
    
    // Create or get conversation for this phone number
    let [conversation] = await db
      .select()
      .from(smsConversations)
      .where(eq(smsConversations.phoneNumber, scheduled.phoneNumber));
    
    if (!conversation) {
      [conversation] = await db.insert(smsConversations).values({
        phoneNumber: scheduled.phoneNumber,
        leadId: scheduled.leadId,
        status: 'active',
        issueDescription: scheduled.serviceDetails,
      }).returning();
    }
    
    // Send the SMS via Twilio
    const result = await sendSMS(scheduled.phoneNumber, message);
    
    // Record the outbound message
    await db.insert(smsMessages).values({
      conversationId: conversation.id,
      direction: 'outbound',
      content: message,
      messageSid: result.sid,
      status: 'sent',
    });
    
    // Update scheduled SMS status
    await db.update(scheduledSms)
      .set({
        status: 'sent',
        sentAt: new Date(),
        messageSid: result.sid,
      })
      .where(eq(scheduledSms.id, scheduledId));
    
    // Update conversation message count
    await db.update(smsConversations)
      .set({
        messageCount: sql`${smsConversations.messageCount} + 1`,
        lastMessageAt: new Date(),
      })
      .where(eq(smsConversations.id, conversation.id));
    
    // Initialize agent session with context
    const sessionId = `sms_${scheduled.phoneNumber.replace(/\D/g, '')}`;
    agentSessions.set(sessionId, {
      messages: [
        {
          role: 'system',
          content: `You are helping ${scheduled.customerName} with their plumbing issue. Their stated problem: "${scheduled.serviceDetails || 'Not specified'}". You've just sent them an opening message. Continue the conversation to book them for a $99 service call.`
        },
        {
          role: 'assistant',
          content: message
        }
      ],
      customerName: scheduled.customerName,
      serviceDetails: scheduled.serviceDetails,
      conversationId: conversation.id
    });
    
    Logger.info(`[SMS Agent] Sent follow-up SMS to ${scheduled.phoneNumber}, SID: ${result.sid}`);
    
  } catch (error: any) {
    Logger.error(`[SMS Agent] Failed to send scheduled SMS ${scheduledId}:`, error);
    
    await db.update(scheduledSms)
      .set({
        status: 'failed',
        errorMessage: error.message,
      })
      .where(eq(scheduledSms.id, scheduledId));
  }
}

// Handle incoming SMS reply using the agent with MCP tools
export async function handleIncomingSms(
  phoneNumber: string,
  messageBody: string,
  messageSid: string
): Promise<string> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const sessionId = `sms_${formattedPhone.replace(/\D/g, '')}`;
  
  // Get or create conversation
  let [conversation] = await db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.phoneNumber, formattedPhone));
  
  if (!conversation) {
    [conversation] = await db.insert(smsConversations).values({
      phoneNumber: formattedPhone,
      status: 'active',
    }).returning();
  }
  
  // Record inbound message
  await db.insert(smsMessages).values({
    conversationId: conversation.id,
    direction: 'inbound',
    content: messageBody,
    messageSid,
    status: 'sent',
  });
  
  // Update conversation stats
  await db.update(smsConversations)
    .set({
      messageCount: sql`${smsConversations.messageCount} + 1`,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(smsConversations.id, conversation.id));
  
  // Get or create agent session
  let session = agentSessions.get(sessionId);
  if (!session) {
    session = {
      messages: [
        {
          role: 'system',
          content: `You are a friendly AI assistant for Johnson Bros. Plumbing having an SMS conversation. Help the customer with their plumbing issue and book them for a $99 service call.`
        }
      ],
      customerName: 'Customer',
      serviceDetails: null,
      conversationId: conversation.id
    };
    agentSessions.set(sessionId, session);
  }
  
  // Add user message to history
  session.messages.push({
    role: 'user',
    content: messageBody
  });
  
  // Process through agent with MCP tools
  const response = await processAgentResponse(session);
  
  // Send response via SMS
  const outboundResult = await sendSMS(formattedPhone, response.message);
  
  // Record outbound message
  await db.insert(smsMessages).values({
    conversationId: conversation.id,
    direction: 'outbound',
    content: response.message,
    messageSid: outboundResult.sid,
    status: 'sent',
  });
  
  // Update conversation status if booking was made
  if (response.bookingMade) {
    await db.update(smsConversations)
      .set({
        status: 'booked',
        bookingNotes: response.summary,
        updatedAt: new Date(),
      })
      .where(eq(smsConversations.id, conversation.id));
  }
  
  // Update message count
  await db.update(smsConversations)
    .set({
      messageCount: sql`${smsConversations.messageCount} + 1`,
      lastMessageAt: new Date(),
    })
    .where(eq(smsConversations.id, conversation.id));
  
  return response.message;
}

// Process agent response with MCP tool execution loop
async function processAgentResponse(session: {
  messages: ChatCompletionMessageParam[];
  customerName: string;
  serviceDetails: string | null;
  conversationId: number;
}): Promise<{ message: string; bookingMade: boolean; summary?: string }> {
  const agent = await createSmsAgent();
  
  // Ensure MCP tools are loaded
  await getMcpClient();
  const tools = mcpToolsToOpenAIFunctions(mcpTools);
  
  let bookingMade = false;
  let summary: string | undefined;
  let iterations = 0;
  const maxIterations = 5;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Call the agent
    const completion = await agent.chat.completions.create({
      model: 'gpt-4o',
      messages: session.messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      max_completion_tokens: 500
    });
    
    const message = completion.choices[0].message;
    
    // Add assistant message to history
    session.messages.push(message as ChatCompletionMessageParam);
    
    // Check if there are tool calls to execute
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        Logger.info(`[SMS Agent] Tool call: ${toolName}`, { args: toolArgs });
        
        try {
          // Execute the MCP tool
          const toolResult = await executeMcpTool(toolName, toolArgs);
          
          // Track if booking was made
          if (toolName === 'book_service_call') {
            bookingMade = true;
            summary = `Booked service call for ${session.customerName}. Issue: ${toolArgs.description || session.serviceDetails || 'Not specified'}`;
          }
          
          // Add tool result to conversation
          session.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult
          } as ChatCompletionMessageParam);
          
        } catch (error: any) {
          // Add error as tool result
          session.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Error: ${error.message}`
          } as ChatCompletionMessageParam);
        }
      }
      
      // Continue the loop to get the final response after tool execution
      continue;
    }
    
    // No tool calls, we have the final response
    const responseText = message.content || "I'm here to help! What plumbing issue can I assist you with today?";
    
    // Add to session history
    return {
      message: responseText,
      bookingMade,
      summary
    };
  }
  
  // Fallback if max iterations reached
  return {
    message: "I'd be happy to help schedule your service call! Can you tell me more about the plumbing issue you're experiencing?",
    bookingMade: false
  };
}

// Process any pending scheduled SMS that might have been missed
export async function processPendingScheduledSms(): Promise<void> {
  const now = new Date();
  
  const pendingMessages = await db
    .select()
    .from(scheduledSms)
    .where(
      and(
        eq(scheduledSms.status, 'pending'),
        lte(scheduledSms.scheduledFor, now)
      )
    );
  
  Logger.info(`[SMS Agent] Found ${pendingMessages.length} pending scheduled SMS to process`);
  
  for (const scheduled of pendingMessages) {
    await sendScheduledSms(scheduled.id);
  }
}

// Get conversation history for a phone number
export async function getConversationHistory(phoneNumber: string): Promise<{
  conversation: typeof smsConversations.$inferSelect | null;
  messages: (typeof smsMessages.$inferSelect)[];
}> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  const [conversation] = await db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.phoneNumber, formattedPhone));
  
  if (!conversation) {
    return { conversation: null, messages: [] };
  }
  
  const messages = await db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.conversationId, conversation.id))
    .orderBy(smsMessages.createdAt);
  
  return { conversation, messages };
}

// Store interval reference for cleanup
let smsProcessorInterval: NodeJS.Timeout | null = null;

// Start the pending SMS processor on server startup
export function startScheduledSmsProcessor(): void {
  // Initialize MCP connection on startup with retry logic
  const initMcpWithRetry = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await getMcpClient();
        Logger.info('[SMS Agent] MCP connection established successfully');
        return;
      } catch (err: any) {
        if (i < retries - 1) {
          Logger.warn(`[SMS Agent] MCP connection attempt ${i + 1} failed, retrying in ${delay}ms:`, { error: err.message });
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          Logger.warn('[SMS Agent] MCP connection failed after retries, will retry on first use:', { error: err.message });
        }
      }
    }
  };
  
  initMcpWithRetry().catch(() => {});
  
  // Process any missed messages immediately
  processPendingScheduledSms().catch(err => {
    Logger.error('[SMS Agent] Error processing pending SMS on startup:', err);
  });
  
  // Check for pending messages every minute
  smsProcessorInterval = setInterval(() => {
    processPendingScheduledSms().catch(err => {
      Logger.error('[SMS Agent] Error in scheduled SMS processor:', err);
    });
  }, 60 * 1000);
  
  Logger.info('[SMS Agent] Scheduled SMS processor started');
}

// Stop the scheduled SMS processor (for graceful shutdown)
export function stopScheduledSmsProcessor(): void {
  if (smsProcessorInterval) {
    clearInterval(smsProcessorInterval);
    smsProcessorInterval = null;
    Logger.info('[SMS Agent] Scheduled SMS processor stopped');
  }
  
  // Close MCP client connection if active
  if (mcpClient) {
    mcpClient.close().catch(() => {});
    mcpClient = null;
    mcpTools = [];
    Logger.info('[SMS Agent] MCP client connection closed');
  }
}
