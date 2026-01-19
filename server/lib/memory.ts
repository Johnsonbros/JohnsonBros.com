import { db } from '../db';
import { customers, interactionLogs } from '@shared/schema';
import { eq, or, desc } from 'drizzle-orm';
import { Logger } from '../src/logger';

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
}) {
  try {
    await db.insert(interactionLogs).values({
      customerId: data.customerId,
      sessionId: data.sessionId,
      channel: data.channel,
      direction: data.direction,
      content: data.content,
      toolsUsed: data.toolsUsed || [],
      sentiment: data.sentiment,
      metadata: data.metadata || {},
    });
  } catch (error: any) {
    Logger.error('[ZEKE] Failed to log interaction:', { error: error.message });
  }
}
