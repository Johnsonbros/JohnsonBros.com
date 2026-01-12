import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Phone, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionSpan = motion.span as React.FC<HTMLMotionProps<'span'> & React.HTMLAttributes<HTMLSpanElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  { icon: Wrench, text: "What services do you offer?" },
  { icon: Phone, text: "I need emergency help" },
  { icon: MessageCircle, text: "Get a price quote" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          ...(sessionId && { sessionId }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Chat error:', error?.message || error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please call us at (617) 479-9911 for immediate assistance.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleStarterPrompt = (prompt: string) => {
    sendMessage(prompt);
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
            className="fixed bottom-36 md:bottom-24 left-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-180px)] md:max-h-[500px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            data-testid="chat-widget-container"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Johnson Bros. Plumbing</h3>
                    <p className="text-xs text-blue-100">AI Assistant - Available 24/7</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                  data-testid="chat-close-button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Hi! I'm your plumbing assistant. I can help you:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                      <li>• Book service appointments</li>
                      <li>• Get instant price quotes</li>
                      <li>• Emergency plumbing guidance</li>
                      <li>• Answer questions about our services</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-medium">Quick Actions</p>
                    {STARTER_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleStarterPrompt(prompt.text)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        data-testid={`starter-prompt-${index}`}
                      >
                        <prompt.icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                        data-testid={`message-${message.role}-${message.id}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="chat-input"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="chat-send-button"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                For emergencies, call <a href="tel:6174799911" className="text-blue-600 font-medium">(617) 479-9911</a>
              </p>
            </form>
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
          data-testid="chat-toggle-button"
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
                  alt="Chat" 
                  style={{
                    width: `${60 + scrollProgress * 20}px`,
                    height: `${60 + scrollProgress * 20}px`,
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
