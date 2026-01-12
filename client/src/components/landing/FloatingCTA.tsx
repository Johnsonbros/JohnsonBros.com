import { Calendar, Phone, MessageCircle, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;
const MotionButton = motion.button as React.FC<HTMLMotionProps<'button'> & React.ButtonHTMLAttributes<HTMLButtonElement>>;

interface FloatingCTAProps {
  onBookService: () => void;
  showAfterScroll?: number;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: 'minimal' | 'expanded' | 'mobile';
  showBackToTop?: boolean;
  primaryAction?: {
    text: string;
    icon?: React.ReactNode;
    highlight?: boolean;
  };
  secondaryActions?: Array<{
    text: string;
    icon?: React.ReactNode;
    action: () => void;
  }>;
}

export function FloatingCTA({
  onBookService,
  showAfterScroll = 200,
  position = 'bottom-right',
  style = 'expanded',
  showBackToTop = true,
  primaryAction = {
    text: "Book Service Now",
    icon: <Calendar className="h-4 w-4" />,
    highlight: true
  },
  secondaryActions = [
    { text: "Call", icon: <Phone className="h-4 w-4" />, action: () => window.location.href = "tel:6174799911" }
  ]
}: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Show tooltip after delay
    const timer = setTimeout(() => {
      if (isVisible && !isMinimized) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000);
      }
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [showAfterScroll, isVisible, isMinimized]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 sm:bottom-8 sm:right-8',
    'bottom-left': 'bottom-4 left-4 sm:bottom-8 sm:left-8',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Mobile style - bottom bar
  if (style === 'mobile') {
    return (
      <AnimatePresence>
        {isVisible && (
          <MotionDiv
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl sm:hidden"
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex-1 pr-2">
                <p className="text-xs font-medium text-gray-900">Need service?</p>
                <p className="text-xs text-gray-600">Book online or call</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = "tel:6174799911"}
                  className="px-3"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={onBookService}
                  className="bg-johnson-orange hover:bg-orange-600 px-4"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    );
  }

  // Minimal style - single floating button
  if (style === 'minimal') {
    return (
      <AnimatePresence>
        {isVisible && (
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed ${positionClasses[position]} z-40`}
          >
            {!isMinimized ? (
              <div className="relative">
                {showTooltip && (
                  <MotionDiv
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 whitespace-nowrap"
                  >
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                      Need help? Book service now!
                      <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-gray-900 border-y-4 border-y-transparent" />
                    </div>
                  </MotionDiv>
                )}
                <Button
                  onClick={onBookService}
                  size="lg"
                  className="bg-johnson-orange hover:bg-orange-600 rounded-full shadow-2xl h-16 w-16 p-0 relative group"
                >
                  <Calendar className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsMinimized(false)}
                size="sm"
                variant="outline"
                className="bg-white shadow-lg"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>
    );
  }

  // Expanded style (default)
  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${positionClasses[position]} z-40`}
        >
          {!isMinimized ? (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-johnson-blue to-johnson-teal text-white px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Available Now
                </span>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Minimize"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Need plumbing service? We're ready to help!
                </p>

                {/* Primary Action */}
                <Button
                  onClick={onBookService}
                  className={`w-full mb-2 ${
                    primaryAction.highlight 
                      ? 'bg-johnson-orange hover:bg-orange-600 shadow-lg transform hover:scale-105 transition-all animate-pulse-slow'
                      : 'bg-johnson-blue hover:bg-blue-700'
                  }`}
                >
                  {primaryAction.icon}
                  <span className="ml-2">{primaryAction.text}</span>
                </Button>

                {/* Secondary Actions */}
                {secondaryActions.length > 0 && (
                  <div className="flex gap-2">
                    {secondaryActions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={action.action}
                        className="flex-1"
                      >
                        {action.icon}
                        <span className="ml-1 text-xs">{action.text}</span>
                      </Button>
                    ))}
                    {showBackToTop && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={scrollToTop}
                        className="px-2"
                        aria-label="Back to top"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Urgency Badge */}
                <div className="mt-3 flex items-center justify-center">
                  <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                    🔥 2 slots left today
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            // Minimized State
            <MotionButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(false)}
              className="bg-johnson-orange text-white rounded-full p-4 shadow-2xl hover:bg-orange-600 transition-colors relative"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                !
              </span>
            </MotionButton>
          )}
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}