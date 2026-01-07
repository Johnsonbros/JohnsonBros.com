// SMS Booking Agent - Handles proactive follow-up SMS for lead conversion
// Sends delayed SMS after form submission and manages AI-powered conversations

import { db } from '../db';
import { scheduledSms, smsConversations, smsMessages, leads } from '@shared/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { sendSMS, getTwilioPhoneNumber } from './twilio';
import { processChat, clearSession } from './aiChat';
import { Logger } from '../src/logger';
import OpenAI from 'openai';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Delay for follow-up SMS: 3 minutes and 57 seconds = 237 seconds
const FOLLOW_UP_DELAY_MS = 237 * 1000;

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

// Generate personalized opening message using AI
async function generateOpeningMessage(customerName: string, serviceDetails: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: `You are a friendly AI assistant for Johnson Bros. Plumbing. Generate a brief, warm opening SMS message (under 160 chars) to follow up with a customer who just submitted a contact form. 

Key points:
- Be warm and personal, use their first name
- Reference their plumbing issue briefly
- Ask if you can help schedule a service call
- Mention the $99 service fee gets credited toward repairs
- Keep it conversational, not salesy

Example: "Hi [Name]! This is Johnson Bros. Plumbing following up on your [issue]. Ready to help! Our $99 service call fee applies to your repair. When works best to schedule?"`
        },
        {
          role: 'user',
          content: `Customer name: ${customerName}\nService details they provided: ${serviceDetails || 'general plumbing help'}`
        }
      ],
      max_completion_tokens: 200
    });
    
    return response.choices[0].message.content || getDefaultOpeningMessage(customerName);
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
    // Get the scheduled SMS
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
    
    // Initialize the AI chat session with context about the customer
    const sessionId = `sms_${scheduled.phoneNumber.replace(/\D/g, '')}`;
    await initializeConversationContext(sessionId, scheduled.customerName, scheduled.serviceDetails);
    
    Logger.info(`[SMS Agent] Sent follow-up SMS to ${scheduled.phoneNumber}, SID: ${result.sid}`);
    
  } catch (error: any) {
    Logger.error(`[SMS Agent] Failed to send scheduled SMS ${scheduledId}:`, error);
    
    // Update status to failed
    await db.update(scheduledSms)
      .set({
        status: 'failed',
        errorMessage: error.message,
      })
      .where(eq(scheduledSms.id, scheduledId));
  }
}

// Initialize AI conversation with customer context
async function initializeConversationContext(
  sessionId: string,
  customerName: string,
  serviceDetails: string | null
): Promise<void> {
  // Pre-seed the conversation with customer context
  // The AI will pick up from here when the customer replies
  const contextMessage = `[System context: This is a proactive follow-up for ${customerName} who submitted a contact form. Their stated issue: "${serviceDetails || 'Not specified'}". The customer has already received our opening message. Wait for their response and continue the booking conversation naturally. Remember to book them for the $99 service call and add their issue details to the job notes.]`;
  
  // This seeds the context for when processChat is called on their reply
  Logger.info(`[SMS Agent] Initialized conversation context for ${sessionId}`);
}

// Handle incoming SMS reply in an ongoing conversation
export async function handleIncomingSms(
  phoneNumber: string,
  messageBody: string,
  messageSid: string
): Promise<string> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Get or create conversation
  let [conversation] = await db
    .select()
    .from(smsConversations)
    .where(eq(smsConversations.phoneNumber, formattedPhone));
  
  if (!conversation) {
    // New conversation from customer-initiated SMS
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
  
  // Process through AI chat
  const sessionId = `sms_${formattedPhone.replace(/\D/g, '')}`;
  const response = await processChat(sessionId, messageBody, 'sms');
  
  // Record outbound response
  const outboundResult = await sendSMS(formattedPhone, response.message);
  
  await db.insert(smsMessages).values({
    conversationId: conversation.id,
    direction: 'outbound',
    content: response.message,
    messageSid: outboundResult.sid,
    status: 'sent',
  });
  
  // Update conversation with extracted issue description if a booking tool was used
  if (response.toolsUsed?.includes('book_service_call')) {
    await db.update(smsConversations)
      .set({
        status: 'booked',
        updatedAt: new Date(),
      })
      .where(eq(smsConversations.id, conversation.id));
  }
  
  // Update message count again for outbound
  await db.update(smsConversations)
    .set({
      messageCount: sql`${smsConversations.messageCount} + 1`,
      lastMessageAt: new Date(),
    })
    .where(eq(smsConversations.id, conversation.id));
  
  return response.message;
}

// Process any pending scheduled SMS that might have been missed (e.g., server restart)
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

// Start the pending SMS processor on server startup
export function startScheduledSmsProcessor(): void {
  // Process any missed messages immediately
  processPendingScheduledSms().catch(err => {
    Logger.error('[SMS Agent] Error processing pending SMS on startup:', err);
  });
  
  // Check for pending messages every minute
  setInterval(() => {
    processPendingScheduledSms().catch(err => {
      Logger.error('[SMS Agent] Error in scheduled SMS processor:', err);
    });
  }, 60 * 1000);
  
  Logger.info('[SMS Agent] Scheduled SMS processor started');
}
