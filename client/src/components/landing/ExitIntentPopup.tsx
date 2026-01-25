import { X, Gift, Clock, Phone, Calendar, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";

const MotionDiv = motion.div as React.FC<HTMLMotionProps<'div'> & React.HTMLAttributes<HTMLDivElement>>;

interface ExitIntentPopupProps {
  onBookService: () => void;
  onClose?: () => void;
  triggerDelay?: number;
  offer?: {
    type: 'discount' | 'free-service' | 'waived-fee';
    value?: string;
    headline?: string;
    description?: string;
  };
  showEmailCapture?: boolean;
}

export function ExitIntentPopup({
  onBookService,
  onClose,
  triggerDelay = 0,
  offer = {
    type: 'waived-fee',
    value: '$99',
    headline: "WAIT! Don't Leave Yet!",
    description: "Book now and we'll waive the $99 service fee"
  },
  showEmailCapture = false
}: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [hasTriggered, setHasTriggered] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });

  useEffect(() => {
    let exitTimer: NodeJS.Timeout;
    let hasShown = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves the top of the viewport
      if (e.clientY <= 0 && !hasShown && !hasTriggered) {
        if (triggerDelay > 0) {
          exitTimer = setTimeout(() => {
            setIsOpen(true);
            setHasTriggered(true);
            hasShown = true;
          }, triggerDelay);
        } else {
          setIsOpen(true);
          setHasTriggered(true);
          hasShown = true;
        }
      }
    };

    // Mobile detection - show after scroll up
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY < lastScrollY && window.scrollY < 100 && !hasShown && !hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
        hasShown = true;
      }
      lastScrollY = window.scrollY;
    };

    // Add listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [triggerDelay, hasTriggered]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Store email and book service
      sessionStorage.setItem('exit_intent_email', email);
      onBookService();
      handleClose();
    }
  };

  const getOfferIcon = () => {
    switch (offer.type) {
      case 'discount':
        return <Gift className="h-12 w-12 text-yellow-500" />;
      case 'free-service':
        return <AlertCircle className="h-12 w-12 text-green-500" />;
      case 'waived-fee':
      default:
        return <Gift className="h-12 w-12 text-green-500" />;
    }
  };

  const getOfferBadge = () => {
    switch (offer.type) {
      case 'discount':
        return `${offer.value || '20%'} OFF`;
      case 'free-service':
        return 'FREE SERVICE';
      case 'waived-fee':
      default:
        return `${offer.value || '$99'} WAIVED`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-0" hideCloseButton aria-describedby={undefined}>
            <DialogTitle className="sr-only">Special Offer</DialogTitle>
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with Offer */}
              <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white p-6 relative">
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="text-center">
                  <MotionDiv
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="inline-block mb-4"
                  >
                    {getOfferIcon()}
                  </MotionDiv>

                  <h2 className="text-3xl font-black mb-2">
                    {offer.headline || "WAIT! Special Offer"}
                  </h2>

                  <div className="inline-block">
                    <Badge className="bg-yellow-400 text-red-900 text-xl px-4 py-2 font-black animate-pulse">
                      {getOfferBadge()}
                    </Badge>
                  </div>

                  <p className="mt-3 text-white/90">
                    {offer.description || "Don't miss out on this limited-time offer!"}
                  </p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="bg-gray-900 text-white py-3 px-6">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Offer expires in:</span>
                  <span className="font-bold text-yellow-400 tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-white">
                {showEmailCapture ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Enter your email to claim this offer and book your service:
                      </p>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mb-3"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-johnson-orange hover:bg-orange-600 text-white font-bold py-3 shadow-lg transform hover:scale-105 transition-all"
                    >
                      <Gift className="mr-2 h-5 w-5" />
                      Claim Offer & Book Now
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      No spam, ever. Your email is safe with us.
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-900">
                        ✓ Valid for all services
                      </p>
                      <p className="text-sm font-medium text-green-900">
                        ✓ No hidden fees
                      </p>
                      <p className="text-sm font-medium text-green-900">
                        ✓ Same-day service available
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          sessionStorage.setItem('exit_intent_offer', JSON.stringify(offer));
                          onBookService();
                          handleClose();
                        }}
                        className="w-full bg-johnson-orange hover:bg-orange-600 text-white font-bold py-3 shadow-lg transform hover:scale-105 transition-all"
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        Yes! Book With Discount
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-gray-500">or call now</span>
                        </div>
                      </div>

                      <a
                        href="tel:6174799911"
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-lg transition-colors"
                      >
                        <Phone className="h-5 w-5" />
                        (617) 479-9911
                      </a>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      No thanks, I'll pay full price
                    </button>
                  </div>
                )}

                {/* Trust Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                    <span>🔒 Secure Booking</span>
                    <span>⭐ 4.9 Rating</span>
                    <span>✓ Licensed & Insured</span>
                  </div>
                </div>
              </div>
            </MotionDiv>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}