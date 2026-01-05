// ChatKit Routes - Session-based chat endpoint for OpenAI ChatKit
import { Router, Request, Response } from 'express';
import { processChat, clearSession, getSessionHistory } from '../lib/aiChat';
import { Logger } from './logger';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

const router = Router();

// Store active sessions with their client secrets
const activeSessions: Map<string, {
  sessionId: string;
  createdAt: Date;
  userId?: string;
}> = new Map();

// OpenAI client for ChatKit sessions
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Session cleanup interval (clean up sessions older than 24 hours)
setInterval(() => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [clientSecret, session] of activeSessions.entries()) {
    if (now.getTime() - session.createdAt.getTime() > maxAge) {
      activeSessions.delete(clientSecret);
      clearSession(session.sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Create a ChatKit session
// This endpoint is called by the ChatKit React component to get a client secret
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    // Generate a unique session ID and client secret
    const sessionId = randomUUID();
    const clientSecret = `ck_${randomUUID().replace(/-/g, '')}`;
    
    // Store the session
    activeSessions.set(clientSecret, {
      sessionId,
      createdAt: new Date(),
      userId
    });
    
    Logger.info('ChatKit session created', { sessionId, userId });
    
    res.json({
      client_secret: clientSecret,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    Logger.error('ChatKit session creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: 'Unable to create chat session. Please try again.'
    });
  }
});

// ChatKit message endpoint with streaming support
// This mimics the OpenAI ChatKit streaming format
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { client_secret, message } = req.body;
    
    if (!client_secret || !message) {
      return res.status(400).json({ error: 'Missing client_secret or message' });
    }
    
    const session = activeSessions.get(client_secret);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    Logger.info('ChatKit message received', { 
      sessionId: session.sessionId, 
      messageLength: message.length 
    });
    
    // Process through the existing AI chat system
    const response = await processChat(session.sessionId, message, 'web');
    
    // Return in ChatKit-compatible format
    res.json({
      id: randomUUID(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'jb-booking-agent',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.message
        },
        finish_reason: 'stop'
      }],
      tools_used: response.toolsUsed
    });
    
  } catch (error: any) {
    Logger.error('ChatKit message error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: "I'm having trouble right now. Please call us at (617) 479-9911 for immediate assistance."
    });
  }
});

// Streaming message endpoint for ChatKit
router.post('/message/stream', async (req: Request, res: Response) => {
  try {
    const { client_secret, message } = req.body;
    
    if (!client_secret || !message) {
      return res.status(400).json({ error: 'Missing client_secret or message' });
    }
    
    const session = activeSessions.get(client_secret);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    Logger.info('ChatKit streaming message received', { 
      sessionId: session.sessionId, 
      messageLength: message.length 
    });
    
    // Process through the existing AI chat system
    const response = await processChat(session.sessionId, message, 'web');
    
    // Simulate streaming by sending the response in chunks
    const chunks = response.message.split(/(?<=\. )|(?<=\! )|(?<=\? )/);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim()) {
        const event = {
          id: `msg_${i}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'jb-booking-agent',
          choices: [{
            index: 0,
            delta: {
              content: chunk
            },
            finish_reason: i === chunks.length - 1 ? 'stop' : null
          }]
        };
        
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        
        // Small delay between chunks for natural feel
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Send done signal
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error: any) {
    Logger.error('ChatKit streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
    res.end();
  }
});

// Get session history
router.get('/history/:clientSecret', (req: Request, res: Response) => {
  try {
    const { clientSecret } = req.params;
    const session = activeSessions.get(clientSecret);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    const history = getSessionHistory(session.sessionId);
    
    res.json({
      session_id: session.sessionId,
      messages: history.map((msg, index) => ({
        id: `msg_${index}`,
        role: msg.role,
        content: msg.content,
        created_at: session.createdAt.toISOString()
      }))
    });
  } catch (error: any) {
    Logger.error('ChatKit history error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// End session
router.delete('/session/:clientSecret', (req: Request, res: Response) => {
  try {
    const { clientSecret } = req.params;
    const session = activeSessions.get(clientSecret);
    
    if (session) {
      clearSession(session.sessionId);
      activeSessions.delete(clientSecret);
      Logger.info('ChatKit session ended', { sessionId: session.sessionId });
    }
    
    res.json({ success: true, message: 'Session ended' });
  } catch (error: any) {
    Logger.error('ChatKit end session error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

export default router;
