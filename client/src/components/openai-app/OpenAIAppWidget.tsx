import { useState, useEffect } from 'react';
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlumbingAssistantApp } from './PlumbingAssistantApp';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

interface OpenAIAppWidgetProps {
  className?: string;
}

export function OpenAIAppWidget({ className }: OpenAIAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);

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
    if (!isOpen) {
      const timer = setTimeout(() => setHasNewMessage(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed z-50 overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
              isExpanded 
                ? 'inset-4 md:inset-8' 
                : 'bottom-24 md:bottom-24 right-4 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100dvh-120px)]'
            }`}
            data-testid="openai-app-container"
          >
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                data-testid="app-expand-button"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                data-testid="app-close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PlumbingAssistantApp />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {hasNewMessage && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-[200px]"
            >
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Need plumbing help? Chat with our AI assistant!
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                data-testid="start-chatting-button"
              >
                Start chatting →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scrollProgress > 0.3 && !isOpen && (
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
            >
              AI Assistant
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl shadow-blue-500/25 flex items-center justify-center transition-all"
          style={{
            width: `${64 + scrollProgress * 12}px`,
            height: `${64 + scrollProgress * 12}px`,
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
          data-testid="openai-app-toggle"
        >
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          )}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-7 h-7 text-white" />
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
                  className="w-10 h-10 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

export default OpenAIAppWidget;
