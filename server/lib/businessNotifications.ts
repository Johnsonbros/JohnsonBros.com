// Business Notification Service
// Sends SMS reports to business owner after AI interactions

import { db } from '../db';
import { businessNotifications, aiConversations } from '@shared/schema';
import { sendSMS } from './twilio';
import { Logger } from '../src/logger';
import { eq } from 'drizzle-orm';

// Business owner phone number for notifications
const BUSINESS_OWNER_PHONE = process.env.BUSINESS_NOTIFICATION_PHONE || '+16174799911';

// Sentiment keywords for basic detection
const SENTIMENT_KEYWORDS = {
  positive: ['thank', 'thanks', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'appreciate', 'helpful', 'awesome'],
  negative: ['frustrated', 'angry', 'upset', 'terrible', 'horrible', 'worst', 'hate', 'ridiculous', 'unacceptable', 'disappointed'],
  frustrated: ['again', 'still', 'keep', 'multiple', 'already', 'waiting', 'long time', 'not working', 'broken', 'emergency']
};

export type NotificationType = 
  | 'ai_interaction'
  | 'out_of_area_lead'
  | 'abuse_alert'
  | 'booking_confirmation'
  | 'high_priority_lead';

export interface AiInteractionReport {
  sessionId: string;
  channel: 'web_chat' | 'sms' | 'voice' | 'mcp';
  customerName?: string;
  customerPhone?: string;
  issueDescription?: string;
  outcome: 'booked' | 'lead_created' | 'quote_given' | 'faq_answered' | 'referred_to_phone' | 'abandoned' | 'out_of_area';
  toolsUsed?: string[];
  conversationSummary?: string;
  messageCount?: number;
  duration?: number;
  bookingId?: string;
  leadId?: number;
}

// Detect sentiment from conversation text
export function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'frustrated' {
  if (!text) return 'neutral';
  
  const lowerText = text.toLowerCase();
  
  // Check for frustrated indicators first (often most important)
  const frustratedMatches = SENTIMENT_KEYWORDS.frustrated.filter(kw => lowerText.includes(kw)).length;
  if (frustratedMatches >= 2) return 'frustrated';
  
  // Check for negative sentiment
  const negativeMatches = SENTIMENT_KEYWORDS.negative.filter(kw => lowerText.includes(kw)).length;
  if (negativeMatches >= 1) return 'negative';
  
  // Check for positive sentiment
  const positiveMatches = SENTIMENT_KEYWORDS.positive.filter(kw => lowerText.includes(kw)).length;
  if (positiveMatches >= 1) return 'positive';
  
  return 'neutral';
}

// Format SMS message for AI interaction report
function formatInteractionSms(report: AiInteractionReport, sentiment: string): string {
  const urgencyEmoji = sentiment === 'frustrated' ? '🚨' : sentiment === 'negative' ? '⚠️' : '📱';
  const channelLabel = {
    'web_chat': 'Web',
    'sms': 'SMS',
    'voice': 'Voice',
    'mcp': 'AI'
  }[report.channel] || report.channel;
  
  const outcomeLabel = {
    'booked': '✅ BOOKED',
    'lead_created': '📝 Lead Created',
    'quote_given': '💰 Quote Given',
    'faq_answered': 'ℹ️ FAQ',
    'referred_to_phone': '📞 Referred to Phone',
    'abandoned': '❌ Abandoned',
    'out_of_area': '🗺️ Out of Area'
  }[report.outcome] || report.outcome;

  let message = `${urgencyEmoji} JB AI [${channelLabel}]\n`;
  
  if (report.customerName) {
    message += `Customer: ${report.customerName}\n`;
  }
  if (report.customerPhone) {
    message += `Phone: ${report.customerPhone}\n`;
  }
  
  message += `Outcome: ${outcomeLabel}\n`;
  
  if (report.issueDescription) {
    const shortIssue = report.issueDescription.length > 50 
      ? report.issueDescription.substring(0, 47) + '...'
      : report.issueDescription;
    message += `Issue: ${shortIssue}\n`;
  }
  
  if (sentiment === 'frustrated' || sentiment === 'negative') {
    message += `⚠️ Sentiment: ${sentiment.toUpperCase()}\n`;
  }
  
  if (report.bookingId) {
    message += `Job ID: ${report.bookingId}\n`;
  }
  
  return message;
}

// Send business notification
export async function sendBusinessNotification(
  type: NotificationType,
  report: AiInteractionReport,
  customMessage?: string
): Promise<{ success: boolean; notificationId?: number; error?: string }> {
  try {
    const sentiment = detectSentiment(report.conversationSummary || report.issueDescription || '');
    const message = customMessage || formatInteractionSms(report, sentiment);
    
    // Log to database first
    const [notification] = await db.insert(businessNotifications).values({
      type,
      channel: 'sms',
      recipientPhone: BUSINESS_OWNER_PHONE,
      message,
      metadata: {
        sessionId: report.sessionId,
        aiChannel: report.channel,
        customerPhone: report.customerPhone,
        outcome: report.outcome,
        sentiment,
        toolsUsed: report.toolsUsed,
        bookingId: report.bookingId,
        leadId: report.leadId
      },
      status: 'pending'
    }).returning();

    // Also log the AI conversation
    await db.insert(aiConversations).values({
      sessionId: report.sessionId,
      channel: report.channel,
      customerPhone: report.customerPhone,
      customerName: report.customerName,
      issueDescription: report.issueDescription,
      outcome: report.outcome,
      sentiment,
      bookingId: report.bookingId,
      leadId: report.leadId,
      messageCount: report.messageCount || 0,
      toolsUsed: report.toolsUsed,
      conversationSummary: report.conversationSummary,
      duration: report.duration,
      startedAt: new Date(),
      endedAt: new Date()
    }).onConflictDoNothing();

    // Send SMS
    try {
      const smsResult = await sendSMS(BUSINESS_OWNER_PHONE, message);
      
      // Update notification status
      await db.update(businessNotifications)
        .set({
          status: 'sent',
          sentAt: new Date(),
          messageSid: smsResult.sid
        })
        .where(eq(businessNotifications.id, notification.id));

      Logger.info(`[Notifications] Sent ${type} notification for session ${report.sessionId}`);
      
      return { success: true, notificationId: notification.id };
    } catch (smsErr: any) {
      // Update notification with error
      await db.update(businessNotifications)
        .set({
          status: 'failed',
          errorMessage: smsErr.message
        })
        .where(eq(businessNotifications.id, notification.id));
      
      Logger.error(`[Notifications] Failed to send SMS:`, { error: smsErr.message });
      return { success: false, notificationId: notification.id, error: smsErr.message };
    }
    
  } catch (err: any) {
    Logger.error(`[Notifications] Error creating notification:`, { error: err.message });
    return { success: false, error: err.message };
  }
}

// Send out-of-area notification (urgent)
export async function sendOutOfAreaNotification(
  customerName: string,
  customerPhone: string,
  zipCode: string,
  issueDescription: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const message = `🗺️ OUT OF AREA LEAD\n` +
    `Customer: ${customerName}\n` +
    `Phone: ${customerPhone}\n` +
    `ZIP: ${zipCode}\n` +
    `Issue: ${issueDescription.substring(0, 60)}...\n` +
    `⚡ Customer asked to be contacted ASAP`;

  return sendBusinessNotification('out_of_area_lead', {
    sessionId,
    channel: 'mcp',
    customerName,
    customerPhone,
    issueDescription,
    outcome: 'out_of_area',
    conversationSummary: `Customer from ZIP ${zipCode} (outside service area) requested service`
  }, message);
}

// Send abuse alert (high priority)
export async function sendAbuseAlert(
  sessionId: string,
  ipAddress: string,
  requestCount: number,
  details: string
): Promise<{ success: boolean; error?: string }> {
  const message = `🚨 MCP ABUSE ALERT\n` +
    `Session: ${sessionId.substring(0, 8)}...\n` +
    `IP: ${ipAddress}\n` +
    `Requests: ${requestCount}\n` +
    `${details}`;

  return sendBusinessNotification('abuse_alert', {
    sessionId,
    channel: 'mcp',
    outcome: 'abandoned',
    conversationSummary: `Potential abuse detected: ${details}`
  }, message);
}

// Log AI conversation without sending notification (for tracking)
export async function logAiConversation(report: AiInteractionReport): Promise<number | null> {
  try {
    const sentiment = detectSentiment(report.conversationSummary || report.issueDescription || '');
    
    const [conversation] = await db.insert(aiConversations).values({
      sessionId: report.sessionId,
      channel: report.channel,
      customerPhone: report.customerPhone,
      customerName: report.customerName,
      issueDescription: report.issueDescription,
      outcome: report.outcome,
      sentiment,
      bookingId: report.bookingId,
      leadId: report.leadId,
      messageCount: report.messageCount || 0,
      toolsUsed: report.toolsUsed,
      conversationSummary: report.conversationSummary,
      duration: report.duration,
      startedAt: new Date(),
      endedAt: new Date()
    }).returning();

    return conversation.id;
  } catch (err: any) {
    Logger.error(`[Notifications] Failed to log conversation:`, { error: err.message });
    return null;
  }
}
