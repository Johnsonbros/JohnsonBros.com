import { db } from '../db';
import { customers, interactionLogs, proactiveUpdates } from '@shared/schema';
import { eq, or, desc } from 'drizzle-orm';
import { Logger } from '../src/logger';
import { ZekeProactiveService } from './zekeProactive';

export async function resolveIdentity(phone?: string, email?: string) {
  if (!phone && !email) return null;

  const conditions = [];
  if (phone) {
    const normalized = phone.replace(/\D/g, '');
    conditions.push(eq(customers.normalizedPhone, normalized));
  }
  if (email) {
    conditions.push(eq(customers.email, email.toLowerCase()));
  }

  const customer = await db.query.customers.findFirst({
    where: or(...conditions),
  });

  if (customer) {
    const history = await db.query.interactionLogs.findMany({
      where: eq(interactionLogs.customerId, customer.id),
      orderBy: [desc(interactionLogs.createdAt)],
      limit: 5,
    });
    return { customer, history };
  }

  return null;
}

export async function logInteraction(data: {
  customerId?: number;
  sessionId: string;
  channel: 'sms' | 'voice' | 'chat';
  direction: 'inbound' | 'outbound';
  content: string;
  toolsUsed?: string[];
  sentiment?: string;
  metadata?: any;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}) {
  try {
    // Check for critical technical failures to log proactively
    if (data.metadata?.error || data.content.toLowerCase().includes('error') || data.content.toLowerCase().includes('failed')) {
       await ZekeProactiveService.queueUpdate({
         severity: 'high',
         category: 'system',
         title: `Technical Issue in ${data.channel.toUpperCase()} session`,
         content: `Issue detected in session ${data.sessionId}: ${data.content.substring(0, 100)}...`,
         metadata: data.metadata
       }).catch(err => Logger.error('[ZEKE] Proactive alert failed:', err));
    }

    await db.insert(interactionLogs).values({
      customerId: data.customerId,
      sessionId: data.sessionId,
      channel: data.channel,
      direction: data.direction,
      content: data.content,
      toolsUsed: data.toolsUsed || [],
      sentiment: data.sentiment,
      metadata: data.metadata || {},
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    });
  } catch (error: any) {
    Logger.error('[ZEKE] Failed to log interaction:', { error: error.message });
  }
}
