import { randomUUID } from 'crypto';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import bcrypt from 'bcryptjs';
import OpenAI from 'openai';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  sharedThreadCustomers,
  sharedThreadIdentities,
  sharedThreadMessages,
  sharedThreadPendingLinks,
  sharedThreadThreads,
} from '@shared/schema';
import { Logger } from '../src/logger';

export type IdentityType = 'web_user_id' | 'phone';
export type ChannelType = 'web' | 'sms' | 'voice';
export type DirectionType = 'in' | 'out';

const DEFAULT_THREAD_KEY = 'default';
const DEFAULT_REGION = (process.env.DEFAULT_REGION || 'US') as CountryCode;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 5;
const MEMORY_COMPRESSION_TURNS = 12;
const RECENT_MESSAGE_LIMIT = 12;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function normalizePhoneToE164(input: string): string {
  const trimmed = input.trim();
  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) {
    throw new Error('Invalid phone number');
  }
  return parsed.number;
}

export async function resolveCustomerIdFromIdentity(params: {
  type: IdentityType;
  value: string;
  verified?: boolean;
}): Promise<string> {
  const { type, value, verified = true } = params;
  const [existing] = await db
    .select()
    .from(sharedThreadIdentities)
    .where(and(eq(sharedThreadIdentities.type, type), eq(sharedThreadIdentities.value, value)))
    .limit(1);

  if (existing) {
    await db
      .update(sharedThreadCustomers)
      .set({ lastSeenAt: new Date() })
      .where(eq(sharedThreadCustomers.id, existing.customerId));
    return existing.customerId;
  }

  const [customer] = await db
    .insert(sharedThreadCustomers)
    .values({})
    .returning();

  await db.insert(sharedThreadIdentities).values({
    type,
    value,
    customerId: customer.id,
    verified,
  });

  return customer.id;
}

export async function getOrCreateDefaultThread(customerId: string) {
  const [existing] = await db
    .select()
    .from(sharedThreadThreads)
    .where(and(eq(sharedThreadThreads.customerId, customerId), eq(sharedThreadThreads.threadKey, DEFAULT_THREAD_KEY)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [thread] = await db
    .insert(sharedThreadThreads)
    .values({
      customerId,
      threadKey: DEFAULT_THREAD_KEY,
      providerThreadId: `thread_${randomUUID()}`,
    })
    .returning();

  return thread;
}

export async function logMessage(
  threadId: string,
  channel: ChannelType,
  direction: DirectionType,
  text: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(sharedThreadMessages).values({
    threadId,
    channel,
    direction,
    text,
    metadata,
  });

  await db
    .update(sharedThreadThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(sharedThreadThreads.id, threadId));

  const [thread] = await db
    .select({ customerId: sharedThreadThreads.customerId })
    .from(sharedThreadThreads)
    .where(eq(sharedThreadThreads.id, threadId))
    .limit(1);

  if (thread) {
    await db
      .update(sharedThreadCustomers)
      .set({ lastSeenAt: new Date() })
      .where(eq(sharedThreadCustomers.id, thread.customerId));
  }
}

export async function buildThreadContext(customerId: string, threadId: string) {
  const [customer] = await db
    .select()
    .from(sharedThreadCustomers)
    .where(eq(sharedThreadCustomers.id, customerId))
    .limit(1);

  const recentMessages = await db
    .select({
      direction: sharedThreadMessages.direction,
      text: sharedThreadMessages.text,
    })
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, threadId))
    .orderBy(desc(sharedThreadMessages.createdAt))
    .limit(RECENT_MESSAGE_LIMIT);

  return {
    summary: customer?.summary || null,
    currentIssueSummary: customer?.currentIssueSummary || null,
    recentMessages: recentMessages
      .slice()
      .reverse()
      .map((message) => ({
        role: message.direction === 'in' ? 'user' as const : 'assistant' as const,
        content: message.text,
      })),
  };
}

export async function memoryCompression(customerId: string, threadId: string, force = false) {
  if (!process.env.OPENAI_API_KEY) {
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, threadId));

  if (count < MEMORY_COMPRESSION_TURNS) {
    return;
  }

  if (!force && count % MEMORY_COMPRESSION_TURNS !== 0) {
    return;
  }

  const messages = await db
    .select({
      direction: sharedThreadMessages.direction,
      text: sharedThreadMessages.text,
    })
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, threadId))
    .orderBy(desc(sharedThreadMessages.createdAt))
    .limit(MEMORY_COMPRESSION_TURNS);

  const transcript = messages
    .slice()
    .reverse()
    .map((message) => `${message.direction === 'in' ? 'Customer' : 'Assistant'}: ${message.text}`)
    .join('\n');

  const [customer] = await db
    .select()
    .from(sharedThreadCustomers)
    .where(eq(sharedThreadCustomers.id, customerId))
    .limit(1);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are summarizing a customer conversation for a plumbing business. Provide two short summaries: ' +
            '1) long-term customer profile (name, address, preferences) and 2) current issue summary (what they need now).',
        },
        {
          role: 'user',
          content: `Existing customer summary: ${customer?.summary || 'None'}\n` +
            `Existing issue summary: ${customer?.currentIssueSummary || 'None'}\n` +
            `Recent transcript:\n${transcript}\n\n` +
            'Return JSON with keys "summary" and "currentIssueSummary".',
        },
      ],
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '';
    const parsed = safeParseSummary(content);
    if (!parsed) {
      return;
    }

    await db
      .update(sharedThreadCustomers)
      .set({
        summary: parsed.summary,
        currentIssueSummary: parsed.currentIssueSummary,
      })
      .where(eq(sharedThreadCustomers.id, customerId));
  } catch (error) {
    Logger.warn('[SharedThread] Memory compression failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function safeParseSummary(content: string): { summary: string; currentIssueSummary: string } | null {
  try {
    const trimmed = content.trim();
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return null;
    }
    const json = trimmed.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(json);
    if (typeof parsed.summary !== 'string' || typeof parsed.currentIssueSummary !== 'string') {
      return null;
    }
    return {
      summary: parsed.summary,
      currentIssueSummary: parsed.currentIssueSummary,
    };
  } catch {
    return null;
  }
}

export async function createPendingLink(params: { webUserId: string; phoneE164: string }) {
  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(sharedThreadPendingLinks)
    .where(
      and(
        eq(sharedThreadPendingLinks.phoneE164, params.phoneE164),
        gte(sharedThreadPendingLinks.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );

  if (recentCount[0]?.count >= OTP_MAX_PER_HOUR) {
    throw new Error('Too many verification attempts. Please wait and try again.');
  }

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(sharedThreadPendingLinks).values({
    webUserId: params.webUserId,
    phoneE164: params.phoneE164,
    codeHash,
    expiresAt,
  });

  return { code, expiresAt };
}

export async function confirmPendingLink(params: {
  webUserId: string;
  phoneE164: string;
  code: string;
}) {
  const [pending] = await db
    .select()
    .from(sharedThreadPendingLinks)
    .where(
      and(
        eq(sharedThreadPendingLinks.webUserId, params.webUserId),
        eq(sharedThreadPendingLinks.phoneE164, params.phoneE164),
        gte(sharedThreadPendingLinks.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(sharedThreadPendingLinks.createdAt))
    .limit(1);

  if (!pending) {
    throw new Error('Verification code expired or not found.');
  }

  if (pending.attemptCount >= OTP_MAX_ATTEMPTS) {
    throw new Error('Too many attempts. Please request a new code.');
  }

  const isValid = await bcrypt.compare(params.code, pending.codeHash);
  if (!isValid) {
    await db
      .update(sharedThreadPendingLinks)
      .set({ attemptCount: pending.attemptCount + 1 })
      .where(eq(sharedThreadPendingLinks.id, pending.id));
    throw new Error('Invalid verification code.');
  }

  const webCustomerId = await resolveCustomerIdFromIdentity({
    type: 'web_user_id',
    value: params.webUserId,
    verified: true,
  });
  const phoneCustomerId = await resolveCustomerIdFromIdentity({
    type: 'phone',
    value: params.phoneE164,
    verified: true,
  });

  const mergedCustomerId = await mergeCustomers(webCustomerId, phoneCustomerId);
  const thread = await getOrCreateDefaultThread(mergedCustomerId);

  await db
    .update(sharedThreadIdentities)
    .set({ verified: true, customerId: mergedCustomerId })
    .where(
      and(
        eq(sharedThreadIdentities.type, 'web_user_id'),
        eq(sharedThreadIdentities.value, params.webUserId),
      ),
    );

  await db
    .update(sharedThreadIdentities)
    .set({ verified: true, customerId: mergedCustomerId })
    .where(
      and(
        eq(sharedThreadIdentities.type, 'phone'),
        eq(sharedThreadIdentities.value, params.phoneE164),
      ),
    );

  await db
    .delete(sharedThreadPendingLinks)
    .where(
      and(
        eq(sharedThreadPendingLinks.webUserId, params.webUserId),
        eq(sharedThreadPendingLinks.phoneE164, params.phoneE164),
      ),
    );

  return { customerId: mergedCustomerId, threadId: thread.id };
}

export async function mergeCustomers(primaryCustomerId: string, secondaryCustomerId: string) {
  if (primaryCustomerId === secondaryCustomerId) {
    return primaryCustomerId;
  }

  const [primaryCustomer] = await db
    .select()
    .from(sharedThreadCustomers)
    .where(eq(sharedThreadCustomers.id, primaryCustomerId))
    .limit(1);
  const [secondaryCustomer] = await db
    .select()
    .from(sharedThreadCustomers)
    .where(eq(sharedThreadCustomers.id, secondaryCustomerId))
    .limit(1);

  if (!primaryCustomer || !secondaryCustomer) {
    return primaryCustomerId;
  }

  const [primaryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sharedThreadMessages)
    .innerJoin(sharedThreadThreads, eq(sharedThreadMessages.threadId, sharedThreadThreads.id))
    .where(eq(sharedThreadThreads.customerId, primaryCustomerId));

  const [secondaryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sharedThreadMessages)
    .innerJoin(sharedThreadThreads, eq(sharedThreadMessages.threadId, sharedThreadThreads.id))
    .where(eq(sharedThreadThreads.customerId, secondaryCustomerId));

  const primaryScore = primaryCount?.count || 0;
  const secondaryScore = secondaryCount?.count || 0;

  const shouldSwap =
    secondaryScore > primaryScore ||
    (secondaryScore === primaryScore &&
      secondaryCustomer.createdAt &&
      primaryCustomer.createdAt &&
      secondaryCustomer.createdAt < primaryCustomer.createdAt);

  const winner = shouldSwap ? secondaryCustomerId : primaryCustomerId;
  const loser = shouldSwap ? primaryCustomerId : secondaryCustomerId;

  await db
    .update(sharedThreadIdentities)
    .set({ customerId: winner })
    .where(eq(sharedThreadIdentities.customerId, loser));

  const winnerThread = await getOrCreateDefaultThread(winner);
  const loserThread = await getOrCreateDefaultThread(loser);

  if (winnerThread.id !== loserThread.id) {
    const summary = await buildMergeSummary(loserThread.id);
    if (summary) {
      await logMessage(winnerThread.id, 'web', 'in', summary, {
        systemNote: true,
        mergedThreadId: loserThread.id,
      });
    }

    await db
      .update(sharedThreadMessages)
      .set({ threadId: winnerThread.id })
      .where(eq(sharedThreadMessages.threadId, loserThread.id));

    await db.delete(sharedThreadThreads).where(eq(sharedThreadThreads.id, loserThread.id));
  }

  await db
    .update(sharedThreadThreads)
    .set({ customerId: winner })
    .where(eq(sharedThreadThreads.customerId, loser));

  await db.delete(sharedThreadCustomers).where(eq(sharedThreadCustomers.id, loser));

  return winner;
}

async function buildMergeSummary(threadId: string) {
  const messages = await db
    .select({
      direction: sharedThreadMessages.direction,
      text: sharedThreadMessages.text,
    })
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, threadId))
    .orderBy(desc(sharedThreadMessages.createdAt))
    .limit(10);

  if (messages.length === 0) {
    return '';
  }

  const transcript = messages
    .slice()
    .reverse()
    .map((message) => `${message.direction === 'in' ? 'Customer' : 'Assistant'}: ${message.text}`)
    .join('\n');

  return `System note: merged previous thread context.\n${transcript}`;
}

export async function getCustomerByIdentity(type: string, value: string) {
  const [identity] = await db
    .select()
    .from(sharedThreadIdentities)
    .where(and(eq(sharedThreadIdentities.type, type), eq(sharedThreadIdentities.value, value)))
    .limit(1);
  return identity;
}

export async function getThreadByCustomer(customerId: string) {
  const [thread] = await db
    .select()
    .from(sharedThreadThreads)
    .where(and(eq(sharedThreadThreads.customerId, customerId), eq(sharedThreadThreads.threadKey, DEFAULT_THREAD_KEY)))
    .limit(1);
  return thread;
}

export async function getMessagesByThread(threadId: string, limit = 50) {
  return db
    .select()
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, threadId))
    .orderBy(desc(sharedThreadMessages.createdAt))
    .limit(limit);
}
