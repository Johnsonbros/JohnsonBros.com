import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Phone, Wrench, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionSpan = motion.span as React.FC<HTMLMotionProps<'span'> & React.HTMLAttributes<HTMLSpanElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;
import ReactMarkdown from 'react-markdown';
import { extractCardIntents, type CardIntent } from '@/lib/cardProtocol';
import { CardRenderer } from '@/components/cards/CardRenderer';
import { dispatchCardAction } from '@/lib/dispatchCardAction';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
  cards?: CardIntent[];
}

interface StarterPrompt {
  icon: typeof Wrench;
  label: string;
  prompt: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  { icon: Wrench, label: "What services do you offer?", prompt: "What services do you offer?" },
  { icon: AlertTriangle, label: "I need emergency help", prompt: "I have a plumbing emergency and need help right away" },
  { icon: DollarSign, label: "Get a price quote", prompt: "Can I get a price quote for plumbing service?" },
  { icon: Calendar, label: "Book an appointment", prompt: "I'd like to book a plumbing appointment" },
];

export function BookingAgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardActionLoading, setCardActionLoading] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / 300, 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const streamingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText.trim(),
          ...(sessionId && { sessionId }),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);

        // Extract card intents from the message
        const { cleanText, cards } = extractCardIntents(data.message);

        setMessages(prev => prev.map(msg =>
          msg.id === streamingMessage.id
            ? {
                ...msg,
                content: cleanText,
                toolsUsed: data.toolsUsed,
                isStreaming: false,
                cards: cards.length > 0 ? cards : undefined,
              }
            : msg
        ));
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => prev.filter(msg => msg.id !== streamingMessage.id));
        return;
      }
      
      console.error('Chat error:', error?.message || error);
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? {
              ...msg,
              content: "I'm having trouble connecting. Please call us at **(617) 479-9911** for immediate assistance.",
              isStreaming: false,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsOpen(false);
  };

  const formatToolName = (tool: string): string => {
    const toolNames: Record<string, string> = {
      'lookup_customer': 'Looking up customer...',
      'get_services': 'Checking services...',
      'get_quote': 'Generating quote...',
      'search_availability': 'Checking availability...',
      'book_service_call': 'Booking appointment...',
      'emergency_help': 'Getting emergency info...',
    };
    return toolNames[tool] || tool;
  };

  const handleCardAction = async (action: string, payload?: Record<string, unknown>) => {
    if (!sessionId) {
      console.error('No session ID available for card action');
      return;
    }

    const cardId = payload?.cardId as string;
    setCardActionLoading(cardId || 'unknown');

    try {
      const result = await dispatchCardAction(action, payload || {}, {
        threadId: sessionId,
        sessionId,
      });

      if (result.ok && result.result?.message) {
        // Add the action result as a new assistant message
        const { cleanText, cards } = extractCardIntents(result.result.message);

        const newMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cleanText,
          timestamp: new Date(),
          cards: cards.length > 0 ? cards : undefined,
        };

        setMessages(prev => [...prev, newMessage]);
      } else if (!result.ok) {
        // Show error message
        const errorMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, there was an issue: ${result.error?.details || 'Unknown error'}. Please try again or call us at (617) 479-9911.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Card action error:', error);
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing that. Please call us at **(617) 479-9911** for immediate assistance.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setCardActionLoading(null);
    }
  };

  const handleCardDismiss = (cardId: string) => {
    // Remove the card from the message
    setMessages(prev => prev.map(msg => ({
      ...msg,
      cards: msg.cards?.filter(card => card.id !== cardId),
    })));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 md:bottom-24 left-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-testid="booking-agent-container"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Johnson Bros. Plumbing</h3>
                    <p className="text-xs text-blue-100">Booking Agent - Available 24/7</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleClose}
                  data-testid="booking-agent-close-button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px]" ref={scrollRef}>
              <div className="p-4">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Hi! I'm your plumbing booking assistant. I can help you:
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Book service appointments
                        </li>
                        <li className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          Get instant price quotes
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-600" />
                          Emergency plumbing guidance
                        </li>
                        <li className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          Learn about our services
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Quick Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {STARTER_PROMPTS.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleStarterPrompt(item.prompt)}
                            className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group"
                            data-testid={`starter-prompt-${index}`}
                          >
                            <item.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        <div
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                            }`}
                            data-testid={`message-${message.role}-${message.id}`}
                          >
                            {message.isStreaming ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-500">Thinking...</span>
                              </div>
                            ) : (
                              <>
                                {message.toolsUsed && message.toolsUsed.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {message.toolsUsed.map((tool, i) => (
                                      <span 
                                        key={i}
                                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                                      >
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        {formatToolName(tool)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                                  <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {message.cards && message.cards.length > 0 && (
                          <div className="space-y-3">
                            {message.cards.map((card) => (
                              <MotionDiv
                                key={card.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <CardRenderer
                                  card={card}
                                  onAction={handleCardAction}
                                  onDismiss={handleCardDismiss}
                                  isLoading={cardActionLoading === card.id}
                                />
                              </MotionDiv>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  data-testid="booking-agent-input"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  data-testid="booking-agent-send-button"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-2 text-center">
                For emergencies, call <a href="tel:6174799911" className="text-blue-600 font-medium hover:underline">(617) 479-9911</a>
              </p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 left-6 z-50 flex flex-col items-center gap-1">
        <AnimatePresence>
          {scrollProgress > 0.5 && !isOpen && (
            <MotionSpan
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
            >
              Chat with us
            </MotionSpan>
          )}
        </AnimatePresence>
        <MotionButton
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full bg-white hover:bg-gray-50 shadow-xl border border-gray-200 flex items-center justify-center transition-colors"
          style={{
            width: `${64 + scrollProgress * 16}px`,
            height: `${64 + scrollProgress * 16}px`,
          }}
          animate={{
            scale: isOpen ? 1 : [1, 1.05, 1],
          }}
          transition={{
            scale: {
              duration: 2,
              repeat: isOpen ? 0 : Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            },
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          data-testid="booking-agent-toggle-button"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <MotionDiv
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-8 h-8 text-gray-700" />
              </MotionDiv>
            ) : (
              <MotionDiv
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <img 
                  src={logoIcon} 
                  alt="Chat with us" 
                  style={{
                    width: `${80 + scrollProgress * 20}px`,
                    height: `${80 + scrollProgress * 20}px`,
                  }}
                  className="object-contain" 
                />
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionButton>
      </div>
    </>
  );
}

export default BookingAgentChat;
