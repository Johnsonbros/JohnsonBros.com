// Chat Routes - Web chat, SMS, and Voice endpoints
import { Router, Request, Response } from 'express';
import { processChat, clearSession, getSessionHistory } from '../lib/aiChat';
import { sendSMS, generateTwiML, generateVoiceTwiML, getTwilioPhoneNumber } from '../lib/twilio';
import { Logger } from './logger';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { fineTuningTrainingData } from '@shared/schema';

const router = Router();

// ========== WEB CHAT ENDPOINTS ==========

// Send a message to the AI chat
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional()
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = chatMessageSchema.parse(req.body);
    const session = sessionId || `web_${randomUUID()}`;
    
    Logger.info('Web chat message received', { sessionId: session, messageLength: message.length });
    
    const response = await processChat(session, message, 'web');
    
    res.json({
      success: true,
      sessionId: session,
      message: response.message,
      toolsUsed: response.toolsUsed
    });
  } catch (error: any) {
    Logger.error('Chat endpoint error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid message format' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Unable to process message. Please try again.' 
    });
  }
});

// Get chat history for a session
router.get('/chat/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = getSessionHistory(sessionId);
    
    res.json({
      success: true,
      sessionId,
      messages: history
    });
  } catch (error: any) {
    Logger.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Unable to retrieve history' });
  }
});

// Clear chat session
router.delete('/chat/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    clearSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session cleared'
    });
  } catch (error: any) {
    Logger.error('Clear session error:', error);
    res.status(500).json({ success: false, error: 'Unable to clear session' });
  }
});

// ========== FEEDBACK FOR FINE-TUNING ==========

const feedbackSchema = z.object({
  sessionId: z.string(),
  channel: z.enum(['web', 'sms', 'voice']),
  userMessage: z.string(),
  assistantResponse: z.string(),
  feedbackType: z.enum(['positive', 'negative']),
  conversationContext: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional(),
  toolsUsed: z.array(z.string()).optional(),
  messageIndex: z.number().optional(),
  customerPhone: z.string().optional()
});

router.post('/chat/feedback', async (req: Request, res: Response) => {
  try {
    const data = feedbackSchema.parse(req.body);
    
    Logger.info('Feedback received for fine-tuning', { 
      sessionId: data.sessionId, 
      feedbackType: data.feedbackType,
      channel: data.channel
    });
    
    await db.insert(fineTuningTrainingData).values({
      sessionId: data.sessionId,
      channel: data.channel,
      userMessage: data.userMessage,
      assistantResponse: data.assistantResponse,
      feedbackType: data.feedbackType,
      conversationContext: data.conversationContext || [],
      toolsUsed: data.toolsUsed || [],
      messageIndex: data.messageIndex,
      customerPhone: data.customerPhone
    });
    
    Logger.info('Feedback saved to training database', { 
      sessionId: data.sessionId, 
      feedbackType: data.feedbackType 
    });
    
    res.json({
      success: true,
      message: 'Feedback saved for training'
    });
  } catch (error: any) {
    Logger.error('Feedback save error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid feedback format' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Unable to save feedback' 
    });
  }
});

// ========== TWILIO SMS WEBHOOK ==========

router.post('/twilio/sms', async (req: Request, res: Response) => {
  try {
    const { Body, From, MessageSid } = req.body;
    
    Logger.info('SMS received', { from: From, messageSid: MessageSid });
    
    if (!Body || !From) {
      res.type('text/xml');
      return res.send(generateTwiML('Sorry, we could not process your message. Please try again.'));
    }
    
    // Use phone number as session ID for SMS continuity
    const sessionId = `sms_${From.replace(/\D/g, '')}`;
    
    // Process through AI chat
    const response = await processChat(sessionId, Body, 'sms');
    
    Logger.info('SMS response generated', { 
      from: From, 
      responseLength: response.message.length,
      toolsUsed: response.toolsUsed 
    });
    
    // Return TwiML response
    res.type('text/xml');
    res.send(generateTwiML(response.message));
    
  } catch (error: any) {
    Logger.error('Twilio SMS webhook error:', error);
    
    res.type('text/xml');
    res.send(generateTwiML('Sorry, we\'re experiencing technical difficulties. Please call (617) 479-9911 for assistance.'));
  }
});

// ========== TWILIO VOICE WEBHOOK ==========

router.post('/twilio/voice', async (req: Request, res: Response) => {
  try {
    const { SpeechResult, From, CallSid, CallStatus } = req.body;
    
    Logger.info('Voice webhook triggered', { from: From, callSid: CallSid, callStatus: CallStatus });
    
    // Initial call - greet and gather speech
    if (!SpeechResult) {
      res.type('text/xml');
      return res.send(generateVoiceTwiML(
        'Hello! Thank you for calling Johnson Brothers Plumbing. How can I help you today? ' +
        'You can ask about our services, get a quote, or schedule an appointment.',
        { gather: true, action: '/api/v1/twilio/voice' }
      ));
    }
    
    // Use phone number as session ID for call continuity
    const sessionId = CallSid ? `voice_${CallSid}` : `voice_${From.replace(/\D/g, '')}`;
    
    // Process speech through AI chat
    const response = await processChat(sessionId, SpeechResult, 'voice');
    
    Logger.info('Voice response generated', { 
      from: From, 
      speechInput: SpeechResult,
      responseLength: response.message.length
    });
    
    // Check if we should end the call or continue conversation
    const lowerResponse = response.message.toLowerCase();
    const shouldEnd = lowerResponse.includes('goodbye') || 
                      lowerResponse.includes('thank you for calling') ||
                      lowerResponse.includes('have a great day');
    
    res.type('text/xml');
    
    if (shouldEnd) {
      res.send(generateVoiceTwiML(response.message, { gather: false }));
    } else {
      // Continue conversation
      res.send(generateVoiceTwiML(
        response.message + ' Is there anything else I can help you with?',
        { gather: true, action: '/api/v1/twilio/voice' }
      ));
    }
    
  } catch (error: any) {
    Logger.error('Twilio Voice webhook error:', error);
    
    res.type('text/xml');
    res.send(generateVoiceTwiML(
      'I apologize, but I\'m having trouble understanding. For immediate assistance, please call back or press 0 to speak with a representative. Thank you for calling Johnson Brothers Plumbing.',
      { gather: false }
    ));
  }
});

// Voice status callback (for logging)
router.post('/twilio/voice/status', (req: Request, res: Response) => {
  const { CallSid, CallStatus, From } = req.body;
  Logger.info('Voice call status update', { callSid: CallSid, status: CallStatus, from: From });
  res.sendStatus(200);
});

// ========== SEND SMS (Outbound) ==========

const sendSmsSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  message: z.string().min(1).max(1600)
});

router.post('/sms/send', async (req: Request, res: Response) => {
  try {
    const { to, message } = sendSmsSchema.parse(req.body);
    
    const result = await sendSMS(to, message);
    
    Logger.info('SMS sent', { to, messageSid: result.sid });
    
    res.json({
      success: true,
      messageSid: result.sid,
      to: result.to
    });
  } catch (error: any) {
    Logger.error('Send SMS error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Invalid phone number or message' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Unable to send SMS. Please try again.' 
    });
  }
});

// ========== CHAT INFO ENDPOINT ==========

router.get('/chat/info', async (req: Request, res: Response) => {
  try {
    let twilioPhone = '';
    try {
      twilioPhone = await getTwilioPhoneNumber();
    } catch (e) {
      // Twilio not configured
    }
    
    res.json({
      success: true,
      channels: {
        web: { enabled: true, endpoint: '/api/v1/chat' },
        sms: { enabled: !!twilioPhone, phone: twilioPhone || 'Not configured' },
        voice: { enabled: !!twilioPhone, phone: twilioPhone || 'Not configured' }
      },
      capabilities: [
        'Book plumbing appointments',
        'Get instant price quotes',
        'Check service availability',
        'Emergency plumbing guidance',
        'Browse available services'
      ],
      business: {
        name: 'Johnson Bros. Plumbing & Drain Cleaning',
        emergencyPhone: '(617) 479-9911',
        serviceArea: 'South Shore Massachusetts'
      }
    });
  } catch (error: any) {
    Logger.error('Chat info error:', error);
    res.status(500).json({ success: false, error: 'Unable to get chat info' });
  }
});

export default router;
