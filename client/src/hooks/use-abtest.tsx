import React, { useEffect, useState, useCallback } from 'react';
import { useABTesting } from '@/contexts/ABTestingContext';
import { ABTestVariant } from '@/lib/abTesting';

interface UseABTestResult {
  variant: ABTestVariant | null;
  isControl: boolean;
  changes: Record<string, any>;
  trackConversion: (conversionType: string, value?: number) => void;
  trackClick: () => void;
  trackView: () => void;
  trackEngagement: (action: string, value?: any) => void;
  isLoading: boolean;
}

export function useABTest(testId: string): UseABTestResult {
  const { getVariant, trackConversion, trackEngagement } = useABTesting();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testVariant = getVariant(testId);
    setVariant(testVariant);
    setIsLoading(false);

    if (testVariant) {
      trackEngagement(testId, 'view', { timestamp: Date.now() });
    }
  }, [testId, getVariant, trackEngagement]);

  const handleTrackConversion = useCallback((conversionType: string, value?: number) => {
    trackConversion(testId, conversionType, value);
  }, [testId, trackConversion]);

  const handleTrackClick = useCallback(() => {
    trackEngagement(testId, 'click', { timestamp: Date.now() });
  }, [testId, trackEngagement]);

  const handleTrackView = useCallback(() => {
    trackEngagement(testId, 'view', { timestamp: Date.now() });
  }, [testId, trackEngagement]);

  const handleTrackEngagement = useCallback((action: string, value?: any) => {
    trackEngagement(testId, action, value);
  }, [testId, trackEngagement]);

  return {
    variant,
    isControl: variant?.isControl || false,
    changes: variant?.changes || {},
    trackConversion: handleTrackConversion,
    trackClick: handleTrackClick,
    trackView: handleTrackView,
    trackEngagement: handleTrackEngagement,
    isLoading
  };
}

interface ABTestProps {
  testId: string;
  children: (props: UseABTestResult) => React.ReactNode;
}

export function ABTest({ testId, children }: ABTestProps) {
  const abTestResult = useABTest(testId);
  return <>{children(abTestResult)}</>;
}

interface ABTestButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  testId: string;
  defaultText: string;
  variants?: Record<string, string>;
  onConversion?: () => void;
}

export function ABTestButton({
  testId,
  defaultText,
  variants = {},
  onConversion,
  onClick,
  ...props
}: ABTestButtonProps) {
  const { variant, trackClick, trackConversion } = useABTest(testId);

  const buttonText = variant?.changes?.buttonText || variants[variant?.id || ''] || defaultText;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackClick();
    if (onConversion) {
      trackConversion('button_click');
      onConversion();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button {...props} onClick={handleClick}>
      {buttonText}
    </button>
  );
}

interface ABTestTextProps {
  testId: string;
  field: string;
  defaultValue: string;
  as?: React.ElementType;
  className?: string;
}

export function ABTestText({
  testId,
  field,
  defaultValue,
  as: Component = 'span',
  className
}: ABTestTextProps) {
  const { changes } = useABTest(testId);
  const text = changes[field] || defaultValue;

  return <Component className={className}>{text}</Component>;
}