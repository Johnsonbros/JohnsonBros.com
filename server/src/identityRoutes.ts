import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sendSMS } from '../lib/twilio';
import { db } from '../db';
import {
  sharedThreadCustomers,
  sharedThreadIdentities,
} from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import {
  confirmPendingLink,
  createPendingLink,
  normalizePhoneToE164,
} from '../lib/sharedThread';
import { Logger } from './logger';

const router = Router();

const startLinkSchema = z.object({
  webUserId: z.string().min(1),
  phone: z.string().min(6),
});

const confirmLinkSchema = z.object({
  webUserId: z.string().min(1),
  phone: z.string().min(6),
  code: z.string().min(4),
});

router.post('/start-link', async (req: Request, res: Response) => {
  const parsed = startLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const phoneE164 = normalizePhoneToE164(parsed.data.phone);

    const [identity] = await db
      .select({ customerId: sharedThreadIdentities.customerId })
      .from(sharedThreadIdentities)
      .where(and(eq(sharedThreadIdentities.type, 'phone'), eq(sharedThreadIdentities.value, phoneE164)))
      .limit(1);

    if (identity) {
      const [customer] = await db
        .select({ optedOutSms: sharedThreadCustomers.optedOutSms })
        .from(sharedThreadCustomers)
        .where(eq(sharedThreadCustomers.id, identity.customerId))
        .limit(1);

      if (customer?.optedOutSms) {
        return res.status(400).json({ error: 'SMS opt-out is enabled for this phone number.' });
      }
    }

    const { code, expiresAt } = await createPendingLink({
      webUserId: parsed.data.webUserId,
      phoneE164,
    });

    const senderName = process.env.OTP_SENDER_NAME || 'Johnson Bros';
    const message = `${senderName}: Your verification code is ${code}. Expires in 10 minutes.`;
    await sendSMS(phoneE164, message);

    res.json({ ok: true, expires_at: expiresAt.toISOString() });
  } catch (error: any) {
    Logger.warn('[Identity] Start link failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(400).json({ error: error.message || 'Unable to start linking.' });
  }
});

router.post('/confirm-link', async (req: Request, res: Response) => {
  const parsed = confirmLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const phoneE164 = normalizePhoneToE164(parsed.data.phone);
    const result = await confirmPendingLink({
      webUserId: parsed.data.webUserId,
      phoneE164,
      code: parsed.data.code,
    });

    res.json({
      ok: true,
      customer_id: result.customerId,
      thread_id: result.threadId,
    });
  } catch (error: any) {
    Logger.warn('[Identity] Confirm link failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(400).json({ error: error.message || 'Unable to confirm link.' });
  }
});

export default router;
