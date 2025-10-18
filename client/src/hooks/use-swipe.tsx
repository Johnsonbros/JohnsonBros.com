import { useState, useEffect, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe(options: SwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50
  } = options;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isSwipingX, setIsSwipingX] = useState(false);
  const [isSwipingY, setIsSwipingY] = useState(false);

  const elementRef = useRef<HTMLElement | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };

    const diffX = Math.abs(touchStart.x - currentTouch.x);
    const diffY = Math.abs(touchStart.y - currentTouch.y);

    // Determine swipe direction (horizontal vs vertical)
    if (diffX > diffY && diffX > 10) {
      setIsSwipingX(true);
      setIsSwipingY(false);
    } else if (diffY > diffX && diffY > 10) {
      setIsSwipingY(true);
      setIsSwipingX(false);
    }

    setTouchEnd(currentTouch);

    // Prevent default scrolling if swiping horizontally
    if (isSwipingX) {
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwipingX(false);
      setIsSwipingY(false);
      return;
    }

    const diffX = touchStart.x - touchEnd.x;
    const diffY = touchStart.y - touchEnd.y;
    const isLeftSwipe = diffX > threshold;
    const isRightSwipe = diffX < -threshold;
    const isUpSwipe = diffY > threshold;
    const isDownSwipe = diffY < -threshold;

    if (isSwipingX) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    }

    if (isSwipingY) {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }

    setIsSwipingX(false);
    setIsSwipingY(false);
  };

  // Return ref and handlers to be attached to elements
  return {
    ref: (element: HTMLElement | null) => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('touchstart', onTouchStart);
        elementRef.current.removeEventListener('touchmove', onTouchMove);
        elementRef.current.removeEventListener('touchend', onTouchEnd);
      }

      if (element) {
        element.addEventListener('touchstart', onTouchStart);
        element.addEventListener('touchmove', onTouchMove);
        element.addEventListener('touchend', onTouchEnd);
      }

      elementRef.current = element;
    },
    handlers: {
      onTouchStart: (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        });
      },
      onTouchMove: (e: React.TouchEvent) => {
        if (!touchStart) return;

        const currentTouch = {
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        };

        const diffX = Math.abs(touchStart.x - currentTouch.x);
        const diffY = Math.abs(touchStart.y - currentTouch.y);

        if (diffX > diffY && diffX > 10) {
          setIsSwipingX(true);
          setIsSwipingY(false);
        } else if (diffY > diffX && diffY > 10) {
          setIsSwipingY(true);
          setIsSwipingX(false);
        }

        setTouchEnd(currentTouch);

        if (isSwipingX) {
          e.preventDefault();
        }
      },
      onTouchEnd: () => {
        if (!touchStart || !touchEnd) {
          setIsSwipingX(false);
          setIsSwipingY(false);
          return;
        }

        const diffX = touchStart.x - touchEnd.x;
        const diffY = touchStart.y - touchEnd.y;
        const isLeftSwipe = diffX > threshold;
        const isRightSwipe = diffX < -threshold;
        const isUpSwipe = diffY > threshold;
        const isDownSwipe = diffY < -threshold;

        if (isSwipingX) {
          if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
          }
          if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
          }
        }

        if (isSwipingY) {
          if (isUpSwipe && onSwipeUp) {
            onSwipeUp();
          }
          if (isDownSwipe && onSwipeDown) {
            onSwipeDown();
          }
        }

        setIsSwipingX(false);
        setIsSwipingY(false);
      }
    }
  };
}