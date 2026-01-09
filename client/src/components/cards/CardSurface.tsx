import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardRenderer } from './CardRenderer';
import type { CardIntent } from '@/lib/cardProtocol';

const MotionDiv = motion.div as any;

interface CardSurfaceProps {
  cards: CardIntent[];
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  onDismiss: (cardId: string) => void;
  isLoading?: boolean;
  loadingCardId?: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function RightSidePanel({ cards, onAction, onDismiss, isLoading, loadingCardId }: CardSurfaceProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (cards.length === 0) return null;

  return (
    <MotionDiv
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed right-4 top-20 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-[380px]'
      }`}
    >
      {isCollapsed ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="w-12 h-12 rounded-full bg-white shadow-lg border-blue-200 relative"
        >
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
            {cards.length}
          </span>
        </Button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[calc(100vh-120px)]">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Recommendations</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="text-white hover:bg-white/20 w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div className="p-4 space-y-4">
              {cards.map((card) => (
                <MotionDiv
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <CardRenderer
                    card={card}
                    onAction={onAction}
                    onDismiss={onDismiss}
                    isLoading={isLoading && loadingCardId === card.id}
                  />
                </MotionDiv>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </MotionDiv>
  );
}

function BottomDrawer({ cards, onAction, onDismiss, isLoading, loadingCardId }: CardSurfaceProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (cards.length > 0) {
      setIsExpanded(true);
      setCurrentIndex(cards.length - 1);
    }
  }, [cards.length]);

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  return (
    <MotionDiv
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex flex-col items-center gap-1"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Sparkles className="w-4 h-4 text-blue-600" />
            {isExpanded ? 'Recommended' : `${cards.length} recommendation${cards.length > 1 ? 's' : ''}`}
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && currentCard && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-6 pt-2 max-h-[60vh] overflow-y-auto">
                {cards.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {cards.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <CardRenderer
                  card={currentCard}
                  onAction={onAction}
                  onDismiss={onDismiss}
                  isLoading={isLoading && loadingCardId === currentCard.id}
                />
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionDiv>
  );
}

export function CardSurface(props: CardSurfaceProps) {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {props.cards.length > 0 && (
        isMobile ? <BottomDrawer {...props} /> : <RightSidePanel {...props} />
      )}
    </AnimatePresence>
  );
}
