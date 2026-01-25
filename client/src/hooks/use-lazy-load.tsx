import { useEffect, useRef, useState } from 'react';

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  placeholder?: string;
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.01,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="100%25" height="100%25" fill="%23f0f0f0"/%3E%3C/svg%3E'
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsIntersecting(true);
            setHasLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [rootMargin, threshold, hasLoaded]);

  return {
    ref,
    isIntersecting,
    hasLoaded,
    placeholder
  };
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  onLoad?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder,
  className = '',
  onLoad,
  ...props 
}: LazyImageProps) {
  const { ref, isIntersecting, placeholder: defaultPlaceholder } = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isIntersecting && !isLoaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoaded(true);
        onLoad?.();
      };
    }
  }, [isIntersecting, src, isLoaded, onLoad]);

  return (
    <div ref={ref as any} className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={isLoaded ? src : (placeholder || defaultPlaceholder)}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}