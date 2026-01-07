// OpenAI Realtime API Integration for Voice Calls
// Bridges Twilio Media Streams with OpenAI's bidirectional voice API

import WebSocket from 'ws';
import { Logger } from '../src/logger';
import { agentTracing } from './agentTracing';
import { callMcpTool, listMcpTools } from './mcpClient';

interface TwilioStreamMessage {
  event: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    callSid: string;
    customParameters?: Record<string, string>;
  };
  media?: {
    payload: string; // Base64 encoded audio
    timestamp: string;
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
}

interface OpenAIRealtimeMessage {
  type: string;
  session?: any;
  response?: any;
  item?: any;
  delta?: {
    audio?: string;
  };
  error?: {
    type: string;
    message: string;
  };
}

const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

// System instructions for voice assistant
const VOICE_SYSTEM_INSTRUCTIONS = `You are Jenny, the AI assistant for Johnson Bros. Plumbing & Drain Cleaning.

## Your Role
You help customers schedule plumbing service appointments over the phone. Be warm, friendly, and efficient.

## Key Information
- Company: Johnson Bros. Plumbing & Drain Cleaning
- Phone: (617) 479-9911
- Service Area: South Shore Massachusetts (Quincy, Braintree, Weymouth, Plymouth, etc.)
- Service Call Fee: $99 (covers diagnostic visit, credited if work proceeds)

## Conversation Flow
1. Greet warmly: "Thanks for calling Johnson Bros. Plumbing! I'm Jenny, your AI assistant."
2. Ask how you can help today
3. Listen to their plumbing issue
4. For emergencies (burst pipes, flooding, gas smell) - tell them to hang up and call 617-479-9911 immediately
5. For regular service, collect: name, phone, address, and issue description
6. Offer available time slots (Morning 8-11, Midday 11-2, Afternoon 2-5)
7. Confirm booking details before finalizing
8. Thank them and wish them a great day

## Speaking Style
- Speak naturally and conversationally
- Be concise - this is a phone call, not a text chat
- Use simple language
- Pause appropriately to let them respond
- If you don't understand, ask them to repeat

## Pricing
Only quote the $99 service call fee. Never quote full job prices - say "Our technician will provide an estimate on-site."

## Emergencies
If they describe: burst pipe, flooding, gas smell, sewage backup, no water, or no heat in winter:
Say: "This sounds like an emergency. Please hang up and call our emergency line directly at 617-479-9911. They can dispatch a technician right away."`;

export function handleMediaStream(twilioWs: WebSocket, request: any) {
  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let callSid: string | null = null;
  let sessionId: string | null = null;
  let mcpToolNames = new Set<string>();
  
  Logger.info('[Realtime] New media stream connection');
  
  // Connect to OpenAI Realtime API
  function connectToOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      Logger.error('[Realtime] Missing OPENAI_API_KEY');
      twilioWs.close();
      return;
    }
    
    openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });
    
    openaiWs.on('open', () => {
      Logger.info('[Realtime] Connected to OpenAI Realtime API');

      listMcpTools()
        .then((tools) => {
          const mcpTools = tools.map((tool) => {
            mcpToolNames.add(tool.name);
            return {
              type: 'function',
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema || { type: 'object', properties: {} }
            };
          });

          // Configure the session
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: VOICE_SYSTEM_INSTRUCTIONS,
              voice: 'alloy',
              input_audio_format: 'g711_ulaw',
              output_audio_format: 'g711_ulaw',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              },
              tools: [
                {
                  type: 'function',
                  name: 'transfer_to_human',
                  description: 'Transfer the call to a human agent when the customer requests it or the issue is too complex',
                  parameters: {
                    type: 'object',
                    properties: {
                      reason: {
                        type: 'string',
                        description: 'Reason for the transfer'
                      }
                    }
                  }
                },
                {
                  type: 'function',
                  name: 'end_call',
                  description: 'End the call politely after booking is complete or customer is done',
                  parameters: {
                    type: 'object',
                    properties: {
                      summary: {
                        type: 'string',
                        description: 'Brief summary of the call outcome'
                      }
                    }
                  }
                },
                ...mcpTools
              ]
            }
          };

          openaiWs!.send(JSON.stringify(sessionConfig));
        })
        .catch((error: any) => {
          Logger.error('[Realtime] Failed to load MCP tools:', { error: error?.message });
        });
      
      // Send initial greeting
      setTimeout(() => {
        const greetingEvent = {
          type: 'response.create',
          response: {
            modalities: ['audio', 'text'],
            instructions: 'Greet the caller warmly. Say: "Thanks for calling Johnson Bros. Plumbing! I\'m Jenny, your AI assistant. How can I help you today?"'
          }
        };
        openaiWs!.send(JSON.stringify(greetingEvent));
      }, 500);
    });
    
    openaiWs.on('message', (data: WebSocket.Data) => {
      try {
        const message: OpenAIRealtimeMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'session.created':
            Logger.debug('[Realtime] Session created');
            break;
            
          case 'session.updated':
            Logger.debug('[Realtime] Session updated');
            break;
            
          case 'response.audio.delta':
            // Send audio back to Twilio
            if (message.delta?.audio && streamSid) {
              const audioMessage = {
                event: 'media',
                streamSid: streamSid,
                media: {
                  payload: message.delta.audio
                }
              };
              twilioWs.send(JSON.stringify(audioMessage));
            }
            break;
            
          case 'response.audio_transcript.delta':
            // Log assistant speech for tracing
            Logger.debug('[Realtime] Assistant transcript delta received');
            break;
            
          case 'conversation.item.input_audio_transcription.completed':
            // Log user speech for tracing
            const userText = (message as any).transcript;
            if (userText && sessionId) {
              Logger.info(`[Realtime] User said: ${userText}`);
              agentTracing.addMessage(sessionId, {
                role: 'user',
                content: userText
              }).catch(() => {});
            }
            break;
            
          case 'response.done':
            // Log completed response
            const outputItems = message.response?.output || [];
            for (const item of outputItems) {
              if (item.type === 'message' && item.content) {
                for (const content of item.content) {
                  if (content.transcript && sessionId) {
                    Logger.info(`[Realtime] Assistant said: ${content.transcript}`);
                    agentTracing.addMessage(sessionId, {
                      role: 'assistant',
                      content: content.transcript
                    }).catch(() => {});
                  }
                }
              }
            }
            break;
            
          case 'response.function_call_arguments.done':
            // Handle function calls
            const functionName = (message as any).name;
            const args = JSON.parse((message as any).arguments || '{}');
            const callId = (message as any).call_id;
            
            Logger.info(`[Realtime] Function call: ${functionName}`, args);
            
            if (functionName === 'end_call') {
              // End the call after a brief pause
              setTimeout(() => {
                twilioWs.close();
              }, 2000);
              break;
            }

            if (mcpToolNames.has(functionName) && callId) {
              callMcpTool(functionName, args)
                .then((result) => {
                  if (!openaiWs) return;
                  openaiWs.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: callId,
                      output: result.raw
                    }
                  }));
                  openaiWs.send(JSON.stringify({
                    type: 'response.create',
                    response: {
                      modalities: ['audio', 'text'],
                      instructions: 'Confirm the booking details or next steps with the caller.'
                    }
                  }));
                })
                .catch((error: any) => {
                  Logger.error('[Realtime] MCP tool call failed:', { error: error?.message, functionName });
                });
            }
            break;
            
          case 'error':
            Logger.error('[Realtime] OpenAI error:', { errorType: message.error?.type, errorMessage: message.error?.message });
            break;
            
          default:
            Logger.debug(`[Realtime] Event: ${message.type}`);
        }
      } catch (error) {
        Logger.error('[Realtime] Error parsing OpenAI message:', { error: String(error) });
      }
    });
    
    openaiWs.on('close', () => {
      Logger.info('[Realtime] OpenAI connection closed');
      openaiWs = null;
    });
    
    openaiWs.on('error', (error) => {
      Logger.error('[Realtime] OpenAI WebSocket error:', error);
    });
  }
  
  // Handle messages from Twilio
  twilioWs.on('message', (data: WebSocket.Data) => {
    try {
      const message: TwilioStreamMessage = JSON.parse(data.toString());
      
      switch (message.event) {
        case 'connected':
          Logger.info('[Realtime] Twilio stream connected');
          break;
          
        case 'start':
          streamSid = message.start?.streamSid || null;
          callSid = message.start?.callSid || null;
          sessionId = `realtime_${callSid}`;
          
          Logger.info(`[Realtime] Stream started - SID: ${streamSid}, CallSid: ${callSid}`);
          
          // Start conversation tracking
          agentTracing.getOrCreateConversation(sessionId!, 'voice', VOICE_SYSTEM_INSTRUCTIONS)
            .catch(() => {});
          
          // Connect to OpenAI
          connectToOpenAI();
          break;
          
        case 'media':
          // Forward audio to OpenAI
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN && message.media) {
            const audioEvent = {
              type: 'input_audio_buffer.append',
              audio: message.media.payload
            };
            openaiWs.send(JSON.stringify(audioEvent));
          }
          break;
          
        case 'stop':
          Logger.info('[Realtime] Stream stopped');
          
          // End conversation tracking
          if (sessionId) {
            agentTracing.endConversation(sessionId, 'completed').catch(() => {});
          }
          
          // Close OpenAI connection
          if (openaiWs) {
            openaiWs.close();
          }
          break;
          
        default:
          Logger.debug(`[Realtime] Twilio event: ${message.event}`);
      }
    } catch (error) {
      Logger.error('[Realtime] Error parsing Twilio message:', { error: String(error) });
    }
  });
  
  twilioWs.on('close', () => {
    Logger.info('[Realtime] Twilio connection closed');
    
    if (sessionId) {
      agentTracing.endConversation(sessionId, 'completed').catch(() => {});
    }
    
    if (openaiWs) {
      openaiWs.close();
    }
  });
  
  twilioWs.on('error', (error) => {
    Logger.error('[Realtime] Twilio WebSocket error:', error);
  });
}
