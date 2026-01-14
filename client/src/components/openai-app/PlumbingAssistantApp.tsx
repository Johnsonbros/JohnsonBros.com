import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Loader2,
  Phone,
  Wrench,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, HTMLMotionProps } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';
import { AppointmentCard, QuoteCard, EmergencyCard, type AppointmentCardData, type QuoteCardData } from '@/components/chat/SharedChatCards';
import { dispatchCardAction } from '@/lib/dispatchCardAction';
import { extractCardIntents, stripEmergencyHelpCard, type CardIntent } from '@/lib/cardProtocol';

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;

const APP_STATE_STORAGE_KEY = 'openai-app-state-v1';
const MAX_STORED_MESSAGES = 50;

type CardData = AppointmentCardData | QuoteCardData | null;
type CardType = 'appointment' | 'quote' | 'emergency' | null;

interface ToolResult {
  tool: string;
  result?: {
    scheduledDate?: string;
    serviceName?: string;
    address?: string;
    jobId?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative' | null;
  card?: CardType;
  cardData?: CardData;
  cards?: CardIntent[];
}

type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string };

type StoredAppState = {
  sessionId: string | null;
  messages: StoredMessage[];
};

const serializeMessages = (messages: Message[]): StoredMessage[] =>
  messages.slice(-MAX_STORED_MESSAGES).map((message) => ({
    ...message,
    timestamp: message.timestamp.toISOString(),
  }));

const deserializeMessages = (messages: StoredMessage[]): Message[] =>
  messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp),
  }));

const loadStoredState = (): StoredAppState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const rawState = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!rawState) return null;
    const parsed = JSON.parse(rawState) as StoredAppState;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch (error) {
    console.warn('Unable to read stored app state', error);
    return null;
  }
};

const saveStoredState = (state: StoredAppState): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to persist app state', error);
  }
};

interface QuickAction {
  icon: typeof Wrench;
  label: string;
  prompt: string;
  color: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { 
    icon: AlertTriangle, 
    label: "Emergency Help", 
    prompt: "I have a plumbing emergency! I need help right away.", 
    color: "from-emergency-red to-red-600",
    iconColor: "text-emergency-red"
  },
  { 
    icon: Calendar, 
    label: "Book Appointment", 
    prompt: "I'd like to schedule a plumbing appointment", 
    color: "from-johnson-blue to-johnson-teal",
    iconColor: "text-johnson-blue"
  },
  { 
    icon: Wrench, 
    label: "Get Quote", 
    prompt: "Can I get a price estimate for plumbing service?", 
    color: "from-service-green to-emerald-500",
    iconColor: "text-service-green"
  },
  { 
    icon: Wrench, 
    label: "Our Services", 
    prompt: "What plumbing services do you offer?", 
    color: "from-johnson-orange to-orange-500",
    iconColor: "text-johnson-orange"
  },
];

const SERVICE_CARDS = [
  { title: "Drain Cleaning", desc: "Clogged drains & pipes" },
  { title: "Water Heaters", desc: "Repair & installation" },
  { title: "Pipe Repair", desc: "Leaks & replacements" },
  { title: "24/7 Emergency", desc: "Always available" },
];

export function PlumbingAssistantApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cardActionLoading, setCardActionLoading] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasHydratedStateRef = useRef(false);

  useEffect(() => {
    const storedState = loadStoredState();
    if (storedState) {
      setSessionId(storedState.sessionId);
      setMessages(deserializeMessages(storedState.messages));
    }
    hasHydratedStateRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedStateRef.current) return;
    saveStoredState({
      sessionId,
      messages: serializeMessages(messages),
    });
  }, [messages, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const detectCardType = (content: string, toolsUsed?: string[], hasEmergencyCard: boolean = false): CardType => {
    const normalizedContent = content.toLowerCase();
    if (toolsUsed?.includes('book_service_call')) return 'appointment';
    if (toolsUsed?.includes('get_quote')) return 'quote';
    if (toolsUsed?.includes('emergency_help') || hasEmergencyCard) return 'emergency';
    if (normalizedContent.includes('emergency') && normalizedContent.includes('call')) return 'emergency';
    return null;
  };

  const extractCardData = (content: string, cardType: CardType, toolResults?: ToolResult[]): CardData => {
    if (!cardType) return null;
    
    if (cardType === 'appointment' && toolResults) {
      const bookingResult = toolResults.find((result) => result.tool === 'book_service_call');
      if (bookingResult?.result) {
        return {
          date: bookingResult.result.scheduledDate || 'Tomorrow · 9:00 AM',
          service: bookingResult.result.serviceName || 'General Plumbing',
          address: bookingResult.result.address || 'Your address',
          confirmationNumber: bookingResult.result.jobId,
        };
      }
    }
    
    if (cardType === 'quote') {
      const priceMatch = content.match(/\$(\d+)/);
      const serviceMatch = content.match(/(drain cleaning|water heater|pipe repair|emergency|plumbing)/i);
      return {
        price: priceMatch ? priceMatch[1] : '99',
        service: serviceMatch ? serviceMatch[0] : 'Plumbing Service',
      };
    }
    
    return null;
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const trimmedMessage = messageText.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    };

    setInput('');
    setIsLoading(true);

    const streamingMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, streamingMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: trimmedMessage,
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
        const toolsUsed = Array.isArray(data.toolsUsed) ? data.toolsUsed : undefined;
        const toolResults = Array.isArray(data.toolResults) ? data.toolResults : undefined;
        const { cleanText, cards } = extractCardIntents(data.message);
        const { cleanText: strippedText, found } = stripEmergencyHelpCard(cleanText);
        const hasCards = cards.length > 0;
        const cardType = hasCards ? null : detectCardType(strippedText, toolsUsed, found);
        const cardData = hasCards ? null : extractCardData(strippedText, cardType, toolResults);
        
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessage.id 
            ? {
                ...msg,
                content: strippedText,
                toolsUsed,
                isStreaming: false,
                card: cardType,
                cardData,
                cards: hasCards ? cards : undefined,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  };

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;
    
    const userMessage = messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;

    setMessages(prev => prev.filter(m => m.id !== messageId));
    await sendMessage(userMessage.content);
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionId(null);
  };

  const formatToolName = (tool: string): string => {
    const toolNames: Record<string, string> = {
      'lookup_customer': 'Customer lookup',
      'get_services': 'Services info',
      'get_quote': 'Price quote',
      'search_availability': 'Availability',
      'book_service_call': 'Booking',
      'emergency_help': 'Emergency info',
    };
    return toolNames[tool] || tool;
  };

  const handleCardAction = async (action: string, payload?: Record<string, unknown>) => {
    if (!sessionId) {
      console.error('No session ID available for card action');
      return;
    }

    const cardId = payload?.cardId as string | undefined;
    setCardActionLoading(cardId || 'unknown');

    try {
      const result = await dispatchCardAction(action, payload || {}, {
        threadId: sessionId,
        sessionId,
      });

      if (result.ok && result.result?.message) {
        const { cleanText, cards } = extractCardIntents(result.result.message);
        const { cleanText: strippedText, found } = stripEmergencyHelpCard(cleanText);
        const cardType = cards.length > 0 ? null : detectCardType(strippedText, undefined, found);
        const cardData = cards.length > 0 ? null : extractCardData(strippedText, cardType);

        const newMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: strippedText,
          timestamp: new Date(),
          cards: cards.length > 0 ? cards : undefined,
          card: cardType,
          cardData,
        };

        setMessages(prev => [...prev, newMessage]);
      } else if (!result.ok) {
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
    setMessages(prev => prev.map(msg => ({
      ...msg,
      cards: msg.cards?.filter(card => card.id !== cardId),
    })));
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logoIcon} alt="Johnson Bros." className="w-10 h-10 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Johnson Bros. Plumbing
                <Sparkles className="w-4 h-4 text-johnson-orange" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Assistant • Available 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="tel:6174799911" 
              data-testid="app-call-button"
            >
              <Button variant="brand-outline" size="sm">
                <Phone className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">(617) 479-9911</span>
              </Button>
            </a>
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="app-clear-button"
                aria-label="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-johnson-blue to-johnson-teal text-white shadow-lg shadow-johnson-blue/25 mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  How can we help you today?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Get instant quotes, book appointments, or get help with plumbing emergencies
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action, index) => (
                  <MotionButton
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => sendMessage(action.prompt)}
                    className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    data-testid={`quick-action-${index}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <action.icon className={`w-5 h-5 ${action.iconColor} dark:text-slate-200 mb-2`} />
                      <span className="font-medium text-slate-900 dark:text-white block">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </MotionButton>
                ))}
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Our Services
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SERVICE_CARDS.map((service, index) => (
                    <MotionDiv
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <Wrench className="w-6 h-6 text-johnson-blue dark:text-johnson-teal mb-2" />
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">{service.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{service.desc}</p>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </MotionDiv>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MotionDiv
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-johnson-blue to-johnson-teal flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {message.toolsUsed.map((tool, i) => (
                          <Badge key={i} variant="secondary" className="text-xs bg-johnson-blue/10 text-johnson-blue dark:bg-johnson-blue/20 dark:text-johnson-teal">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1.5" />
                            {formatToolName(tool)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {(message.isStreaming || message.content) && (
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-johnson-blue text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-700'
                        }`}
                        data-testid={`message-${message.role}-${index}`}
                      >
                        {message.isStreaming ? (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-johnson-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-johnson-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-johnson-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
                          </div>
                        ) : (
                          <div className={`text-sm prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2`}>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {message.card === 'appointment' && <AppointmentCard data={message.cardData} variant="expanded" />}
                    {message.card === 'quote' && <QuoteCard data={message.cardData} variant="expanded" />}
                    {message.card === 'emergency' && <EmergencyCard variant="expanded" />}

                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          data-testid={`copy-${message.id}`}
                          aria-label="Copy response"
                        >
                          {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'positive' ? 'text-green-500 bg-green-50 dark:bg-green-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          data-testid={`thumbs-up-${message.id}`}
                          aria-label="Mark response as helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'negative' ? 'text-red-500 bg-red-50 dark:bg-red-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          data-testid={`thumbs-down-${message.id}`}
                          aria-label="Mark response as unhelpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => regenerateResponse(message.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          data-testid={`regenerate-${message.id}`}
                          aria-label="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">U</span>
                      </div>
                    </div>
                  )}
                </MotionDiv>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="p-4 max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Johnson Bros. Plumbing..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-0 px-3 py-2 max-h-32"
              style={{ minHeight: '40px' }}
              data-testid="app-input"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              variant="brand-primary"
              className="rounded-xl shrink-0 h-10 w-10 disabled:opacity-50"
              data-testid="app-send-button"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
            For emergencies, call <a href="tel:6174799911" className="text-johnson-blue dark:text-johnson-teal font-medium hover:underline">(617) 479-9911</a> • Powered by AI
          </p>
        </form>
      </div>
    </div>
  );
}

export default PlumbingAssistantApp;
