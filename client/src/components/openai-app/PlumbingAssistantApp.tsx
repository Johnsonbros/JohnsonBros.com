import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Loader2, 
  Phone, 
  Wrench, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Droplets,
  Flame,
  Clock,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RotateCcw,
  Settings,
  X,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative' | null;
}

interface QuickAction {
  icon: typeof Wrench;
  label: string;
  prompt: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { 
    icon: AlertTriangle, 
    label: "Emergency Help", 
    prompt: "I have a plumbing emergency! I need help right away.", 
    color: "from-red-500 to-red-600" 
  },
  { 
    icon: Calendar, 
    label: "Book Appointment", 
    prompt: "I'd like to schedule a plumbing appointment", 
    color: "from-blue-500 to-blue-600" 
  },
  { 
    icon: DollarSign, 
    label: "Get Quote", 
    prompt: "Can I get a price estimate for plumbing service?", 
    color: "from-green-500 to-green-600" 
  },
  { 
    icon: Wrench, 
    label: "Our Services", 
    prompt: "What plumbing services do you offer?", 
    color: "from-purple-500 to-purple-600" 
  },
];

const SERVICE_CARDS = [
  { icon: Droplets, title: "Drain Cleaning", desc: "Clogged drains & pipes" },
  { icon: Flame, title: "Water Heaters", desc: "Repair & installation" },
  { icon: Wrench, title: "Pipe Repair", desc: "Leaks & replacements" },
  { icon: Clock, title: "24/7 Emergency", desc: "Always available" },
];

export function PlumbingAssistantApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

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
        
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessage.id 
            ? {
                ...msg,
                content: data.message,
                toolsUsed: data.toolsUsed,
                isStreaming: false,
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
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                <Sparkles className="w-4 h-4 text-blue-500" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Assistant • Available 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="tel:6174799911" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
              data-testid="app-call-button"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">(617) 479-9911</span>
            </a>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConversation}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                data-testid="app-clear-button"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
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
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => sendMessage(action.prompt)}
                    className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    data-testid={`quick-action-${index}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <action.icon className="w-5 h-5 text-slate-700 dark:text-slate-300 mb-2" />
                      <span className="font-medium text-slate-900 dark:text-white block">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Our Services
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SERVICE_CARDS.map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <service.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <h4 className="font-medium text-slate-900 dark:text-white text-sm">{service.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{service.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {message.toolsUsed.map((tool, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                          >
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {formatToolName(tool)}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-700'
                      }`}
                      data-testid={`message-${message.role}-${index}`}
                    >
                      {message.isStreaming ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
                        </div>
                      ) : (
                        <div className={`text-sm prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2`}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          data-testid={`copy-${message.id}`}
                        >
                          {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'positive' ? 'text-green-500 bg-green-50 dark:bg-green-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          data-testid={`thumbs-up-${message.id}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className={`p-1.5 rounded-lg transition-colors ${message.feedback === 'negative' ? 'text-red-500 bg-red-50 dark:bg-red-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          data-testid={`thumbs-down-${message.id}`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => regenerateResponse(message.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          data-testid={`regenerate-${message.id}`}
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
                </motion.div>
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
              className="bg-blue-600 hover:bg-blue-700 rounded-xl shrink-0 h-10 w-10 disabled:opacity-50"
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
            For emergencies, call <a href="tel:6174799911" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">(617) 479-9911</a> • Powered by AI
          </p>
        </form>
      </div>
    </div>
  );
}

export default PlumbingAssistantApp;
