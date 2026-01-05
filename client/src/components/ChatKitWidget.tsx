import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { MessageCircle, X, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

interface ChatKitWidgetProps {
  className?: string;
}

export function ChatKitWidget({ className }: ChatKitWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClientSecret = useCallback(async (existingSecret?: string | null) => {
    try {
      if (existingSecret) {
        return existingSecret;
      }
      
      const response = await fetch('/api/v1/chatkit/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: `user_${Date.now()}`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      return data.client_secret;
    } catch (err) {
      console.error('Failed to get client secret:', err);
      setError('Unable to connect. Please call (617) 479-9911');
      throw err;
    }
  }, []);

  const { control, ref, sendUserMessage, focusComposer } = useChatKit({
    api: {
      getClientSecret
    },
    header: {
      enabled: true,
      title: {
        enabled: true,
        text: 'Johnson Bros. Plumbing'
      }
    },
    startScreen: {
      greeting: "Hi! I'm your plumbing assistant. How can I help you today?",
      prompts: [
        {
          label: "What services do you offer?",
          prompt: "What services do you offer?"
        },
        {
          label: "I need emergency help",
          prompt: "I need emergency help with my plumbing"
        },
        {
          label: "Get a price quote",
          prompt: "Can I get a price quote?"
        },
        {
          label: "Book an appointment",
          prompt: "I'd like to book an appointment"
        }
      ]
    },
    composer: {
      placeholder: "Type your plumbing question..."
    },
    disclaimer: {
      text: "For emergencies, call **(617) 479-9911**"
    },
    onReady: () => {
      setIsReady(true);
      setError(null);
    },
    onError: (event) => {
      console.error('ChatKit error:', event);
      setError('Connection issue. Please call (617) 479-9911');
    },
    onResponseStart: () => {
      console.log('Assistant is responding...');
    },
    onResponseEnd: () => {
      console.log('Response complete');
    }
  });

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
    if (isOpen && isReady) {
      focusComposer();
    }
  }, [isOpen, isReady, focusComposer]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 md:bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-testid="chatkit-widget-container"
          >
            {error ? (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Johnson Bros. Plumbing</h3>
                      <p className="text-xs text-blue-100">AI Assistant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    data-testid="chatkit-close-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <a 
                      href="tel:6174799911" 
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Call (617) 479-9911
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Johnson Bros. Plumbing</h3>
                      <p className="text-xs text-blue-100">AI Assistant - 24/7</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    data-testid="chatkit-close-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatKit
                    ref={ref as any}
                    control={control}
                    className="h-full w-full"
                    style={{
                      '--chatkit-primary': '#2563eb',
                      '--chatkit-background': 'white',
                      '--chatkit-text': '#1f2937',
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-center gap-1">
        <AnimatePresence>
          {scrollProgress > 0.5 && !isOpen && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
            >
              Chat Now
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
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
          data-testid="chatkit-toggle-button"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-8 h-8 text-gray-700" />
              </motion.div>
            ) : (
              <motion.div
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
                    width: `${56 + scrollProgress * 16}px`,
                    height: `${56 + scrollProgress * 16}px`,
                  }}
                  className="object-contain" 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

export default ChatKitWidget;
