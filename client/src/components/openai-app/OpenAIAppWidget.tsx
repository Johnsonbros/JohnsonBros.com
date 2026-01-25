import { useState, useEffect } from 'react';
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { PlumbingAssistantApp } from './PlumbingAssistantApp';
import logoIcon from '@assets/JBros_Wrench_Logo_WP.png';

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionSpan = motion.span as React.FC<HTMLMotionProps<'span'> & React.HTMLAttributes<HTMLSpanElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;

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
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed z-50 overflow-hidden rounded-2xl shadow-2xl bg-card text-card-foreground border border-border ${
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
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {hasNewMessage && !isOpen && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="bg-card text-card-foreground rounded-2xl shadow-lg border border-border p-3 max-w-[200px]"
            >
              <p className="text-sm text-muted-foreground">
                Need plumbing help? Chat with our AI assistant!
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-2 text-xs font-medium text-primary hover:underline"
                data-testid="start-chatting-button"
              >
                Start chatting →
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scrollProgress > 0.3 && !isOpen && (
            <MotionSpan
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-xs font-medium text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm border border-border"
            >
              AI Assistant
            </MotionSpan>
          )}
        </AnimatePresence>

        <MotionButton
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 flex items-center justify-center transition-all ring-1 ring-primary/30"
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
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background animate-pulse" />
          )}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <MotionDiv
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-7 h-7 text-white" />
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
                  className="w-10 h-10 object-contain"
                />
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionButton>
      </div>
    </>
  );
}

export default OpenAIAppWidget;
