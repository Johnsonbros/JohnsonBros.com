  import { useEffect, useState } from 'react';
  import { AnimatePresence, motion } from 'framer-motion';
  import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import { ScrollArea } from '@/components/ui/scroll-area';
  import { CardRenderer } from './CardRenderer';
  import type { CardIntent } from '@/lib/cardProtocol';

  const MotionDiv = motion.div as React.ElementType;

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
            className="h-12 w-12 rounded-full border-blue-200 bg-white shadow-lg relative"
          >
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {cards.length}
            </span>
          </Button>
        ) : (
          <div className="max-h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Recommendations</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {cards.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="max-h-[calc(100vh-200px)]">
              <div className="space-y-4 p-4">
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
        <div className="rounded-t-3xl border-t border-gray-200 bg-white shadow-2xl">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full flex-col items-center gap-1 py-3"
          >
            <div className="h-1 w-10 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Sparkles className="h-4 w-4 text-blue-600" />
              {isExpanded ? 'Recommended' : `${cards.length} recommendation${cards.length > 1 ? 's' : ''}`}
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
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
                <div className="max-h-[60vh] overflow-y-auto px-4 pb-6 pt-2">
                  {cards.length > 1 && (
                    <div className="mb-4 flex items-center justify-center gap-2">
                      {cards.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            idx === currentIndex ? 'w-6 bg-blue-600' : 'bg-gray-300'
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
        {props.cards.length > 0 && (isMobile ? <BottomDrawer {...props} /> : <RightSidePanel {...props} />)}
      </AnimatePresence>
    );
  }