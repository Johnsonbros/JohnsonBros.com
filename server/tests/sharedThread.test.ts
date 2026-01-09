import test from 'node:test';
import assert from 'node:assert/strict';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import {
  sharedThreadCustomers,
  sharedThreadIdentities,
  sharedThreadMessages,
  sharedThreadPendingLinks,
  sharedThreadThreads,
} from '@shared/schema';
import {
  confirmPendingLink,
  createPendingLink,
  getOrCreateDefaultThread,
  logMessage,
  mergeCustomers,
  resolveCustomerIdFromIdentity,
} from '../lib/sharedThread';

const hasDatabase = !!process.env.DATABASE_URL;

test('resolveCustomerIdFromIdentity returns stable customer id', { skip: !hasDatabase }, async () => {
  const identityValue = `web_test_${Date.now()}`;
  const customerId1 = await resolveCustomerIdFromIdentity({
    type: 'web_user_id',
    value: identityValue,
    verified: true,
  });
  const customerId2 = await resolveCustomerIdFromIdentity({
    type: 'web_user_id',
    value: identityValue,
    verified: true,
  });

  assert.equal(customerId1, customerId2);

  await db.delete(sharedThreadIdentities).where(eq(sharedThreadIdentities.value, identityValue));
  await db.delete(sharedThreadCustomers).where(eq(sharedThreadCustomers.id, customerId1));
});

test('getOrCreateDefaultThread reuses provider thread id', { skip: !hasDatabase }, async () => {
  const customerId = await resolveCustomerIdFromIdentity({
    type: 'web_user_id',
    value: `thread_test_${Date.now()}`,
    verified: true,
  });

  const thread1 = await getOrCreateDefaultThread(customerId);
  const thread2 = await getOrCreateDefaultThread(customerId);

  assert.equal(thread1.id, thread2.id);
  assert.equal(thread1.providerThreadId, thread2.providerThreadId);

  await db.delete(sharedThreadMessages).where(eq(sharedThreadMessages.threadId, thread1.id));
  await db.delete(sharedThreadThreads).where(eq(sharedThreadThreads.id, thread1.id));
  await db.delete(sharedThreadIdentities).where(eq(sharedThreadIdentities.customerId, customerId));
  await db.delete(sharedThreadCustomers).where(eq(sharedThreadCustomers.id, customerId));
});

test('OTP start/confirm links identities and clears pending link', { skip: !hasDatabase }, async () => {
  const webUserId = `otp_web_${Date.now()}`;
  const phoneE164 = `+1617${Math.floor(1000000 + Math.random() * 8999999)}`;

  const { code } = await createPendingLink({ webUserId, phoneE164 });
  const result = await confirmPendingLink({ webUserId, phoneE164, code });

  assert.ok(result.customerId);
  assert.ok(result.threadId);

  const pending = await db
    .select()
    .from(sharedThreadPendingLinks)
    .where(and(eq(sharedThreadPendingLinks.webUserId, webUserId), eq(sharedThreadPendingLinks.phoneE164, phoneE164)));
  assert.equal(pending.length, 0);

  await db.delete(sharedThreadMessages).where(eq(sharedThreadMessages.threadId, result.threadId));
  await db.delete(sharedThreadThreads).where(eq(sharedThreadThreads.id, result.threadId));
  await db.delete(sharedThreadIdentities).where(eq(sharedThreadIdentities.customerId, result.customerId));
  await db.delete(sharedThreadCustomers).where(eq(sharedThreadCustomers.id, result.customerId));
});

test('mergeCustomers keeps a single default thread and moves messages', { skip: !hasDatabase }, async () => {
  const webCustomer = await resolveCustomerIdFromIdentity({
    type: 'web_user_id',
    value: `merge_web_${Date.now()}`,
    verified: true,
  });
  const phoneCustomer = await resolveCustomerIdFromIdentity({
    type: 'phone',
    value: `+1617${Math.floor(1000000 + Math.random() * 8999999)}`,
    verified: true,
  });

  const webThread = await getOrCreateDefaultThread(webCustomer);
  const phoneThread = await getOrCreateDefaultThread(phoneCustomer);

  await logMessage(webThread.id, 'web', 'in', 'Web message');
  await logMessage(phoneThread.id, 'sms', 'in', 'Phone message');

  const mergedCustomerId = await mergeCustomers(webCustomer, phoneCustomer);
  const mergedThread = await getOrCreateDefaultThread(mergedCustomerId);
  const messages = await db
    .select()
    .from(sharedThreadMessages)
    .where(eq(sharedThreadMessages.threadId, mergedThread.id));

  assert.ok(messages.length >= 2);

  await db.delete(sharedThreadMessages).where(eq(sharedThreadMessages.threadId, mergedThread.id));
  await db.delete(sharedThreadThreads).where(eq(sharedThreadThreads.id, mergedThread.id));
  await db.delete(sharedThreadIdentities).where(eq(sharedThreadIdentities.customerId, mergedCustomerId));
  await db.delete(sharedThreadCustomers).where(eq(sharedThreadCustomers.id, mergedCustomerId));
});
