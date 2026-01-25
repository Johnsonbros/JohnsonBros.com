import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { CardIntent } from '@/lib/cardProtocol';

interface CardStoreState {
  cardsByThreadId: Record<string, CardIntent[]>;
  activeThreadId: string | null;
  formData: Record<string, Record<string, unknown>>;
}

interface CardStoreActions {
  setActiveThread: (threadId: string) => void;
  addCards: (threadId: string, cards: CardIntent[]) => void;
  updateCard: (threadId: string, card: CardIntent) => void;
  dismissCard: (threadId: string, cardId: string) => void;
  clearThread: (threadId: string) => void;
  updateFormData: (cardId: string, data: Record<string, unknown>) => void;
  getFormData: (cardId: string) => Record<string, unknown>;
  getCardsForThread: (threadId: string) => CardIntent[];
}

type CardStore = CardStoreState & CardStoreActions;

const CardStoreContext = createContext<CardStore | null>(null);

export function CardStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CardStoreState>({
    cardsByThreadId: {},
    activeThreadId: null,
    formData: {},
  });

  const setActiveThread = useCallback((threadId: string) => {
    setState(prev => ({ ...prev, activeThreadId: threadId }));
  }, []);

  const addCards = useCallback((threadId: string, cards: CardIntent[]) => {
    setState(prev => {
      const existingCards = prev.cardsByThreadId[threadId] || [];
      const newCards = cards.filter(
        newCard => !existingCards.some(existing => existing.id === newCard.id)
      );
      
      return {
        ...prev,
        cardsByThreadId: {
          ...prev.cardsByThreadId,
          [threadId]: [...existingCards, ...newCards],
        },
      };
    });
  }, []);

  const updateCard = useCallback((threadId: string, card: CardIntent) => {
    setState(prev => {
      const existingCards = prev.cardsByThreadId[threadId] || [];
      const updatedCards = existingCards.map(c => 
        c.id === card.id ? card : c
      );
      
      if (!existingCards.some(c => c.id === card.id)) {
        updatedCards.push(card);
      }
      
      return {
        ...prev,
        cardsByThreadId: {
          ...prev.cardsByThreadId,
          [threadId]: updatedCards,
        },
      };
    });
  }, []);

  const dismissCard = useCallback((threadId: string, cardId: string) => {
    setState(prev => {
      const existingCards = prev.cardsByThreadId[threadId] || [];
      return {
        ...prev,
        cardsByThreadId: {
          ...prev.cardsByThreadId,
          [threadId]: existingCards.filter(c => c.id !== cardId),
        },
      };
    });
  }, []);

  const clearThread = useCallback((threadId: string) => {
    setState(prev => {
      const { [threadId]: _, ...rest } = prev.cardsByThreadId;
      return {
        ...prev,
        cardsByThreadId: rest,
      };
    });
  }, []);

  const updateFormData = useCallback((cardId: string, data: Record<string, unknown>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [cardId]: { ...prev.formData[cardId], ...data },
      },
    }));
  }, []);

  const getFormData = useCallback((cardId: string) => {
    return state.formData[cardId] || {};
  }, [state.formData]);

  const getCardsForThread = useCallback((threadId: string) => {
    return state.cardsByThreadId[threadId] || [];
  }, [state.cardsByThreadId]);

  const store: CardStore = {
    ...state,
    setActiveThread,
    addCards,
    updateCard,
    dismissCard,
    clearThread,
    updateFormData,
    getFormData,
    getCardsForThread,
  };

  return (
    <CardStoreContext.Provider value={store}>
      {children}
    </CardStoreContext.Provider>
  );
}

export function useCardStore(): CardStore {
  const context = useContext(CardStoreContext);
  if (!context) {
    throw new Error('useCardStore must be used within a CardStoreProvider');
  }
  return context;
}

export function useActiveCards(): CardIntent[] {
  const store = useCardStore();
  if (!store.activeThreadId) return [];
  return store.getCardsForThread(store.activeThreadId);
}
