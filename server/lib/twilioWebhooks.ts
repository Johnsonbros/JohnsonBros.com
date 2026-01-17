// Twilio Webhook Handlers for SMS and Voice
// Connects incoming SMS/calls to the AI booking agent

import { Request, Response, Router } from 'express';
import { Logger } from '../src/logger';
import { processChat, clearSession } from './aiChat';
import { createOutboundCall, generateTwiML, generateVoiceTwiML, getTwilioPhoneNumber } from './twilio';
import { agentTracing } from './agentTracing';
import { trackTwilioSMS, trackTwilioVoice } from './usageTracker';
import crypto from 'crypto';

const router = Router();

// Store voice session state (speech recognition results)
const voiceSessions: Map<string, {
  conversationStarted: boolean;
  lastActivity: number;
}> = new Map();

function requireInternalSecret(req: Request, res: Response): boolean {
  const internalSecret = process.env.INTERNAL_SECRET;

  if (!internalSecret) {
    Logger.error('[Twilio] INTERNAL_SECRET not configured');
    res.status(500).json({ error: 'Internal secret not configured' });
    return false;
  }

  const provided = req.headers['x-internal-secret'];
  if (provided !== internalSecret) {
    Logger.warn('[Twilio] Unauthorized outbound call attempt');
    res.status(403).json({ error: 'Unauthorized' });
    return false;
  }

  return true;
}

// Validate Twilio webhook signature
function validateTwilioSignature(req: Request): boolean {
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken || !twilioSignature) {
    Logger.warn('[Twilio] Missing auth token or signature');
    return process.env.NODE_ENV === 'development'; // Allow in dev
  }
  
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const params = req.body;
  
  // Build validation string
  let validationString = url;
  Object.keys(params).sort().forEach(key => {
    validationString += key + params[key];
  });
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(validationString)
    .digest('base64');
  
  return twilioSignature === expectedSignature;
}

// SMS Webhook - Receives incoming SMS messages
router.post('/sms', async (req: Request, res: Response) => {
  try {
    const { From, Body, MessageSid, NumSegments } = req.body;

    if (!From || !Body) {
      Logger.warn('[Twilio SMS] Missing From or Body in request');
      res.type('text/xml').send(generateTwiML('Sorry, there was an error processing your message.'));
      return;
    }

    Logger.info(`[Twilio SMS] Received message from ${From}: ${Body.substring(0, 50)}...`);

    // Use phone number as session ID for SMS continuity
    const sessionId = `sms_${From.replace(/\D/g, '')}`;

    // Track inbound SMS usage
    trackTwilioSMS('inbound', NumSegments ? parseInt(NumSegments) : 1, sessionId, {
      messageSid: MessageSid,
      from: From
    });

    // Process through AI chat with SMS channel
    const response = await processChat(sessionId, Body, 'sms');
    
    Logger.info(`[Twilio SMS] Responding to ${From}: ${response.message.substring(0, 50)}...`);
    
    // Send TwiML response
    res.type('text/xml').send(generateTwiML(response.message));
    
  } catch (error: any) {
    Logger.error('[Twilio SMS] Error processing message:', error);
    res.type('text/xml').send(generateTwiML(
      'Sorry, I\'m having trouble right now. Please call us at (617) 479-9911.'
    ));
  }
});

// Outbound voice call - requires internal secret
router.post('/voice/outbound', async (req: Request, res: Response) => {
  try {
    if (!requireInternalSecret(req, res)) {
      return;
    }

    const { to, mode, from } = req.body as { to?: string; mode?: 'realtime' | 'ivr'; from?: string };

    if (!to) {
      res.status(400).json({ error: 'Missing destination phone number' });
      return;
    }

    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const twimlPath = mode === 'ivr' ? '/api/v1/twilio/voice' : '/api/v1/twilio/voice/realtime';
    const call = await createOutboundCall({
      to,
      from,
      url: `${baseUrl}${twimlPath}`,
      statusCallback: `${baseUrl}/api/v1/twilio/voice/status`
    });

    Logger.info('[Twilio] Outbound call initiated', { to, callSid: call.sid, mode: mode || 'realtime' });

    res.json({
      success: true,
      callSid: call.sid,
      to,
      mode: mode || 'realtime'
    });
  } catch (error: any) {
    Logger.error('[Twilio] Failed to initiate outbound call:', { error: error?.message });
    res.status(500).json({ error: 'Failed to initiate outbound call' });
  }
});

// Voice Webhook - Handles incoming voice calls (traditional IVR-style)
router.post('/voice', async (req: Request, res: Response) => {
  try {
    const { From, CallSid, SpeechResult, Digits } = req.body;
    
    Logger.info(`[Twilio Voice] Call from ${From}, CallSid: ${CallSid}`);
    
    // Use CallSid as session ID
    const sessionId = `voice_${CallSid}`;
    
    // Check if this is a new call or continuation
    const session = voiceSessions.get(sessionId);
    
    if (!session) {
      // New call - greet the caller
      voiceSessions.set(sessionId, {
        conversationStarted: true,
        lastActivity: Date.now()
      });
      
      const greeting = "Thanks for calling Johnson Brothers Plumbing! I'm your AI assistant. How can I help you today?";
      
      res.type('text/xml').send(generateVoiceTwiML(greeting, {
        gather: true,
        action: '/api/v1/twilio/voice'
      }));
      return;
    }
    
    // Handle speech input
    if (SpeechResult) {
      Logger.info(`[Twilio Voice] Speech recognized: ${SpeechResult}`);
      
      // Process through AI chat with voice channel
      const response = await processChat(sessionId, SpeechResult, 'voice');
      
      // Update session
      voiceSessions.set(sessionId, {
        ...session,
        lastActivity: Date.now()
      });
      
      // Check if conversation should end
      const shouldEnd = response.message.toLowerCase().includes('goodbye') ||
                       response.message.toLowerCase().includes('have a great day');
      
      if (shouldEnd) {
        voiceSessions.delete(sessionId);
        res.type('text/xml').send(generateVoiceTwiML(response.message, { gather: false }));
      } else {
        res.type('text/xml').send(generateVoiceTwiML(response.message, {
          gather: true,
          action: '/api/v1/twilio/voice'
        }));
      }
    } else {
      // No speech detected
      res.type('text/xml').send(generateVoiceTwiML(
        "I didn't catch that. Could you please repeat?",
        { gather: true, action: '/api/v1/twilio/voice' }
      ));
    }
    
  } catch (error: any) {
    Logger.error('[Twilio Voice] Error processing call:', error);
    res.type('text/xml').send(generateVoiceTwiML(
      'Sorry, I\'m having technical difficulties. Please call back or try our number directly at 617-479-9911.'
    ));
  }
});

// Voice Status Callback - Track call status changes
router.post('/voice/status', async (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, From, Duration } = req.body;
    
    Logger.info(`[Twilio Voice] Call ${CallSid} status: ${CallStatus}, duration: ${Duration}s`);
    
    const sessionId = `voice_${CallSid}`;
    
    // End conversation on completion
    if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'no-answer') {
      voiceSessions.delete(sessionId);

      // Track voice usage if call was completed and has duration
      if (CallStatus === 'completed' && Duration) {
        const durationSeconds = parseInt(Duration);
        if (!isNaN(durationSeconds) && durationSeconds > 0) {
          trackTwilioVoice(durationSeconds, sessionId, {
            callSid: CallSid,
            from: From,
            status: CallStatus
          });
        }
      }

      // Mark conversation as ended
      try {
        const outcome = CallStatus === 'completed' ? 'completed' : 'abandoned';
        await agentTracing.endConversation(sessionId, outcome);
      } catch (e) {
        Logger.warn('[Twilio Voice] Error ending conversation tracing:', { error: e instanceof Error ? e.message : 'Unknown error' });
      }

      clearSession(sessionId);
    }
    
    res.status(200).send('OK');
    
  } catch (error: any) {
    Logger.error('[Twilio Voice] Status callback error:', { 
      error: error.message, 
      stack: error.stack,
      callSid: req.body?.CallSid 
    });
    // Still return 200 to prevent Twilio retry loops, but log the error properly
    res.status(200).send('OK');
  }
});

// Realtime Voice Webhook - Connects to OpenAI Realtime API via WebSocket
router.post('/voice/realtime', async (req: Request, res: Response) => {
  try {
    const { From, CallSid } = req.body;
    
    Logger.info(`[Twilio Realtime] Initiating realtime call for ${From}, CallSid: ${CallSid}`);
    
    // Get the WebSocket URL for this Repl
    const host = req.get('host') || 'localhost:5000';
    const wsProtocol = host.includes('localhost') ? 'ws' : 'wss';
    const wsUrl = `${wsProtocol}://${host}/api/v1/twilio/media-stream`;
    
    // TwiML to connect call to Media Streams
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to our AI assistant. Please hold.</Say>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="callSid" value="${CallSid}" />
      <Parameter name="from" value="${From}" />
    </Stream>
  </Connect>
</Response>`;
    
    res.type('text/xml').send(twiml);
    
  } catch (error: any) {
    Logger.error('[Twilio Realtime] Error initiating realtime call:', error);
    res.type('text/xml').send(generateVoiceTwiML(
      'Sorry, I couldn\'t connect you to our AI assistant. Please call 617-479-9911 directly.'
    ));
  }
});

// Store interval reference for cleanup
let voiceSessionCleanupInterval: NodeJS.Timeout | null = null;

// Start voice session cleanup
function startVoiceSessionCleanup() {
  if (!voiceSessionCleanupInterval) {
    voiceSessionCleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30 * 60 * 1000; // 30 minutes
      
      for (const [sessionId, session] of voiceSessions.entries()) {
        if (now - session.lastActivity > timeout) {
          voiceSessions.delete(sessionId);
          clearSession(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Stop voice session cleanup (for graceful shutdown)
export function stopTwilioCleanup(): void {
  if (voiceSessionCleanupInterval) {
    clearInterval(voiceSessionCleanupInterval);
    voiceSessionCleanupInterval = null;
    voiceSessions.clear();
  }
}

// Initialize cleanup on module load
startVoiceSessionCleanup();

export default router;
