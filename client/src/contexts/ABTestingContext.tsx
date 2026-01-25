import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  abTestingManager, 
  ABTest, 
  ABTestVariant, 
  predefinedTests 
} from '@/lib/abTesting';

interface ABTestingContextValue {
  getVariant: (testId: string) => ABTestVariant | null;
  trackConversion: (testId: string, conversionType: string, value?: number) => void;
  trackEngagement: (testId: string, action: string, value?: any) => void;
  activeTests: ABTest[];
  isTestActive: (testId: string) => boolean;
  getTestChanges: (testId: string) => Record<string, any>;
}

const ABTestingContext = createContext<ABTestingContextValue | undefined>(undefined);

interface ABTestingProviderProps {
  children: ReactNode;
  tests?: ABTest[];
  enableTesting?: boolean;
}

export function ABTestingProvider({ 
  children, 
  tests = predefinedTests,
  enableTesting = true 
}: ABTestingProviderProps) {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [variantCache, setVariantCache] = useState<Map<string, ABTestVariant>>(new Map());

  useEffect(() => {
    if (!enableTesting) return;

    // Register all tests
    tests.forEach(test => {
      abTestingManager.registerTest(test);
    });

    // Get active tests
    setActiveTests(abTestingManager.getActiveTests());

    // Pre-fetch variants for all active tests
    const cache = new Map<string, ABTestVariant>();
    tests.forEach(test => {
      if (test.status === 'active') {
        const variant = abTestingManager.getVariant(test.id);
        if (variant) {
          cache.set(test.id, variant);
        }
      }
    });
    setVariantCache(cache);
  }, [tests, enableTesting]);

  const getVariant = (testId: string): ABTestVariant | null => {
    if (!enableTesting) return null;
    
    // Check cache first
    const cached = variantCache.get(testId);
    if (cached) return cached;

    // Get from manager
    const variant = abTestingManager.getVariant(testId);
    if (variant) {
      setVariantCache(prev => new Map(prev).set(testId, variant));
    }
    return variant;
  };

  const trackConversion = (testId: string, conversionType: string, value?: number) => {
    if (!enableTesting) return;
    abTestingManager.trackConversion(testId, conversionType, value);
  };

  const trackEngagement = (testId: string, action: string, value?: any) => {
    if (!enableTesting) return;
    abTestingManager.trackEngagement(testId, action, value);
  };

  const isTestActive = (testId: string): boolean => {
    if (!enableTesting) return false;
    return activeTests.some(test => test.id === testId && test.status === 'active');
  };

  const getTestChanges = (testId: string): Record<string, any> => {
    if (!enableTesting) return {};
    
    const variant = getVariant(testId);
    return variant?.changes || {};
  };

  const contextValue: ABTestingContextValue = {
    getVariant,
    trackConversion,
    trackEngagement,
    activeTests,
    isTestActive,
    getTestChanges
  };

  return (
    <ABTestingContext.Provider value={contextValue}>
      {children}
    </ABTestingContext.Provider>
  );
}

export function useABTesting() {
  const context = useContext(ABTestingContext);
  if (context === undefined) {
    throw new Error('useABTesting must be used within an ABTestingProvider');
  }
  return context;
}