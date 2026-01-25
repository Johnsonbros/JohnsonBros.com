// SMS Booking Agent - Uses OpenAI Agents SDK with MCP Server for HousecallPro booking
// Sends delayed SMS after form submission and manages AI-powered conversations via MCP tools

import { db } from '../db';
import { scheduledSms, smsConversations, smsMessages } from '@shared/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendSMS } from './twilio';
import { Logger } from '../src/logger';
// @ts-ignore - openai-agents types resolution issue
import { OpenAIAgent } from 'openai-agents';
import { callMcpTool, listMcpTools, resetMcpClient } from './mcpClient';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Delay for follow-up SMS: 3 minutes and 57 seconds = 237 seconds
const FOLLOW_UP_DELAY_MS = 237 * 1000;

interface AgentSession {
  messages: ChatCompletionMessageParam[];
  customerName: string;
  serviceDetails: string | null;
  conversationId: number;
  createdAt: number;
  lastActivityAt: number;
}

// Store active agent sessions with conversation history
const agentSessions: Map<string, AgentSession> = new Map();

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [sessionId, session] of agentSessions.entries()) {
    if (now - session.lastActivityAt > SESSION_TTL_MS) {
      agentSessions.delete(sessionId);
    }
  }
}

let sessionCleanupInterval: NodeJS.Timeout | null = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS);
if (typeof sessionCleanupInterval.unref === 'function') {
  sessionCleanupInterval.unref();
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

// Track MCP health status
let mcpHealthy = false;
let lastMcpCheck = 0;
const MCP_HEALTH_CHECK_INTERVAL = 60000; // Check every minute

// Check MCP server health
async function checkMcpHealth(): Promise<boolean> {
  const now = Date.now();

  // Don't check too frequently
  if (now - lastMcpCheck < MCP_HEALTH_CHECK_INTERVAL) {
    return mcpHealthy;
  }

  lastMcpCheck = now;

  try {
    // Try to list tools as a health check
    await listMcpTools();
    mcpHealthy = true;
    return true;
  } catch (error: any) {
    mcpHealthy = false;
    Logger.error('[SMS Agent] MCP health check failed:', { error: error.message });
    return false;
  }
}

// Execute an MCP tool call with health check
async function executeMcpTool(name: string, args: any): Promise<string> {
  try {
    // Check MCP health before executing
    const healthy = await checkMcpHealth();
    if (!healthy) {
      Logger.warn(`[SMS Agent] MCP unhealthy, attempting to execute ${name} anyway`);
      // Try to reconnect
      await resetMcpClient();
      await listMcpTools(); // This will throw if still failing
      mcpHealthy = true; // Mark as healthy if we got here
    }

    Logger.info(`[SMS Agent] Executing MCP tool: ${name}`, { args });
    const result = await callMcpTool(name, args);
    mcpHealthy = true; // Mark as healthy after successful call
    return result.raw;
  } catch (error: any) {
    mcpHealthy = false;
    Logger.error(`[SMS Agent] MCP tool ${name} failed:`, { error: error.message });

    // Alert on critical booking tool failure
    if (name === 'book_service_call') {
      Logger.error('[SMS Agent] CRITICAL: Booking tool failed - customer booking will fail!', {
        tool: name,
        error: error.message,
        mcpHealthy,
      });
    }

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
    // Atomically claim the message by updating status to 'sending'
    // This prevents duplicate sends from setTimeout and setInterval
    const claimed = await db
      .update(scheduledSms)
      .set({ status: 'sending' })
      .where(
        and(
          eq(scheduledSms.id, scheduledId),
          eq(scheduledSms.status, 'pending')
        )
      )
      .returning();

    if (!claimed || claimed.length === 0) {
      Logger.info(`[SMS Agent] Scheduled SMS ${scheduledId} already claimed or not found`);
      return;
    }

    const scheduled = claimed[0];
    
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
    const now = Date.now();
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
      conversationId: conversation.id,
      createdAt: now,
      lastActivityAt: now
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
  cleanupExpiredSessions();
  let session = agentSessions.get(sessionId);
  if (!session) {
    const now = Date.now();
    session = {
      messages: [
        {
          role: 'system',
          content: `You are a friendly AI assistant for Johnson Bros. Plumbing having an SMS conversation. Help the customer with their plumbing issue and book them for a $99 service call.`
        }
      ],
      customerName: 'Customer',
      serviceDetails: null,
      conversationId: conversation.id,
      createdAt: now,
      lastActivityAt: now
    };
    agentSessions.set(sessionId, session);
  }
  session.lastActivityAt = Date.now();
  
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
async function processAgentResponse(session: AgentSession): Promise<{ message: string; bookingMade: boolean; summary?: string }> {
  const agent = await createSmsAgent();

  // Check MCP health before processing
  const healthy = await checkMcpHealth();
  if (!healthy) {
    Logger.warn('[SMS Agent] MCP unhealthy at start of conversation, attempting recovery');
    try {
      await resetMcpClient();
      await listMcpTools();
      mcpHealthy = true;
    } catch (error: any) {
      Logger.error('[SMS Agent] MCP recovery failed, proceeding without tools', { error: error.message });
      // Return fallback message
      return {
        message: "I apologize, but I'm having technical difficulties with our booking system right now. Please call us at (617) 479-9911 to schedule your appointment, and we'll get you taken care of right away!",
        bookingMade: false,
      };
    }
  }

  const tools = mcpToolsToOpenAIFunctions(await listMcpTools());

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
    message: "I'm having a little trouble reaching our booking tools right now. Could you briefly describe the issue and your preferred time, and I'll take it from there?",
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

// Get MCP health status for monitoring
export function getMcpHealthStatus(): { healthy: boolean; lastCheck: Date } {
  return {
    healthy: mcpHealthy,
    lastCheck: new Date(lastMcpCheck),
  };
}

// Start the pending SMS processor on server startup
export function startScheduledSmsProcessor(): void {
  // Initialize MCP connection on startup with retry logic
  const initMcpWithRetry = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await listMcpTools();
        mcpHealthy = true;
        lastMcpCheck = Date.now();
        Logger.info('[SMS Agent] MCP tools loaded successfully');
        return;
      } catch (err: any) {
        mcpHealthy = false;
        if (i < retries - 1) {
          Logger.warn(`[SMS Agent] MCP connection attempt ${i + 1} failed, retrying in ${delay}ms:`, { error: err.message });
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          Logger.error('[SMS Agent] CRITICAL: MCP connection failed after all retries!', {
            error: err.message,
            retries: retries,
          });
          // Continue anyway - will retry on first use
        }
      }
    }
  };

  initMcpWithRetry().catch((err: any) => {
    mcpHealthy = false;
    Logger.error('[SMS Agent] CRITICAL: MCP initialization completely failed:', { error: err?.message || err });
  });
  
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

  if (sessionCleanupInterval) {
    clearInterval(sessionCleanupInterval);
    sessionCleanupInterval = null;
    Logger.info('[SMS Agent] Session cleanup interval stopped');
  }

  resetMcpClient();
  Logger.info('[SMS Agent] MCP client connection reset');
}
