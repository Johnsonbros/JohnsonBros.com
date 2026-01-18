import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface WidgetStateContextType {
  isBookingOpen: boolean;
  isChatOpen: boolean;
  setBookingOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  isAnyWidgetOpen: boolean;
}

const WidgetStateContext = createContext<WidgetStateContextType | null>(null);

export function WidgetStateProvider({ children }: { children: ReactNode }) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const setBookingOpen = useCallback((open: boolean) => {
    setIsBookingOpen(open);
  }, []);

  const setChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
  }, []);

  const isAnyWidgetOpen = isBookingOpen || isChatOpen;

  return (
    <WidgetStateContext.Provider
      value={{
        isBookingOpen,
        isChatOpen,
        setBookingOpen,
        setChatOpen,
        isAnyWidgetOpen,
      }}
    >
      {children}
    </WidgetStateContext.Provider>
  );
}

export function useWidgetState() {
  const context = useContext(WidgetStateContext);
  if (!context) {
    throw new Error("useWidgetState must be used within a WidgetStateProvider");
  }
  return context;
}
