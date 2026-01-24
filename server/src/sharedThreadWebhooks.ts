import { Router, Request, Response } from 'express';
import { generateTwiML, generateVoiceTwiML } from '../lib/twilio';
import { processChat } from '../lib/aiChat';
import {
  buildThreadContext,
  getOrCreateDefaultThread,
  logMessage,
  memoryCompression,
  normalizePhoneToE164,
  resolveCustomerIdFromIdentity,
} from '../lib/sharedThread';
import { Logger } from './logger';
import { db } from '../db';
import { sharedThreadCustomers } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const HUMAN_ESCALATION_NUMBER = '6174799911';

function shouldEscalate(text: string) {
  const lowered = text.toLowerCase();
  const keywords = ['emergency', 'dispatch', 'book appointment', 'book', 'human', 'agent', 'representative'];
  return keywords.some((keyword) => lowered.includes(keyword));
}

router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { From, To, Body, MessageSid } = req.body;

    if (!From || !Body) {
      res.type('text/xml').send(generateTwiML('Sorry, there was an error processing your message.'));
      return;
    }

    const fromE164 = normalizePhoneToE164(From);
    const messageText = `${Body}`.trim();

    const customerId = await resolveCustomerIdFromIdentity({
      type: 'phone',
      value: fromE164,
      verified: true,
    });

    if (/^(stop|unsubscribe|cancel|end|quit)$/i.test(messageText)) {
      await dbOptOutSms(customerId);
      res.type('text/xml').send(generateTwiML('You have been unsubscribed. Reply START to resubscribe.'));
      return;
    }

    const thread = await getOrCreateDefaultThread(customerId);
    await logMessage(thread.id, 'sms', 'in', messageText, { MessageSid, To });

    const response = await processChat(thread.providerThreadId, messageText, 'sms');

    await logMessage(thread.id, 'sms', 'out', response.message, { MessageSid });
    res.type('text/xml').send(generateTwiML(response.message));
  } catch (error: any) {
    Logger.error('[SharedThread SMS] Error processing message:', error);
    res.type('text/xml').send(generateTwiML('Sorry, I\'m having trouble right now. Please call us at (617) 479-9911.'));
  }
});

router.post('/voice/incoming', async (req: Request, res: Response) => {
  const greeting = 'Johnson Bros Plumbing assistant. How can we help today?';
  res
    .type('text/xml')
    .send(generateVoiceTwiML(greeting, { gather: true, action: '/api/webhooks/twilio/voice/handle-speech' }));
});

router.post('/voice/handle-speech', async (req: Request, res: Response) => {
  try {
    const { From, CallSid, SpeechResult, Confidence } = req.body;

    if (!From || !SpeechResult) {
      res
        .type('text/xml')
        .send(
          generateVoiceTwiML("I didn't catch that. Could you please repeat?", {
            gather: true,
            action: '/api/webhooks/twilio/voice/handle-speech',
          }),
        );
      return;
    }

    const fromE164 = normalizePhoneToE164(From);
    const customerId = await resolveCustomerIdFromIdentity({
      type: 'phone',
      value: fromE164,
      verified: true,
    });
    const thread = await getOrCreateDefaultThread(customerId);

    await logMessage(thread.id, 'voice', 'in', SpeechResult, { CallSid, confidence: Confidence });
    await memoryCompression(customerId, thread.id, true);

    if (shouldEscalate(SpeechResult)) {
      await logMessage(thread.id, 'voice', 'out', "I'm connecting you now.", { CallSid });
      res.type('text/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm connecting you now.</Say>
  <Dial>${HUMAN_ESCALATION_NUMBER}</Dial>
</Response>`,
      );
      return;
    }

    const response = await processChat(thread.providerThreadId, SpeechResult, 'voice');

    await logMessage(thread.id, 'voice', 'out', response.message, { CallSid });

    res.type('text/xml').send(
      generateVoiceTwiML(response.message, {
        gather: true,
        action: '/api/webhooks/twilio/voice/handle-speech',
      }),
    );
  } catch (error: any) {
    Logger.error('[SharedThread Voice] Error processing call:', error);
    res
      .type('text/xml')
      .send(
        generateVoiceTwiML(
          'Sorry, I\'m having technical difficulties. Please call back or try our number directly at 617-479-9911.',
          { gather: false },
        ),
      );
  }
});

async function dbOptOutSms(customerId: string) {
  await db.update(sharedThreadCustomers).set({ optedOutSms: true }).where(eq(sharedThreadCustomers.id, customerId));
}

export default router;
