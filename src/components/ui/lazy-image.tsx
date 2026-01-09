import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Optional low-res blur placeholder (data URI or tiny image URL) */
  blurSrc?: string;
  /** Aspect ratio for placeholder (e.g., "16/9", "1/1") */
  aspectRatio?: string;
  /** Container className */
  containerClassName?: string;
  /** Whether to disable lazy loading (for above-fold images) */
  eager?: boolean;
}

/**
 * LazyImage component with blur placeholder and smooth fade-in
 * Uses native lazy loading with Intersection Observer fallback
 */
export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({ 
    src, 
    alt, 
    blurSrc,
    aspectRatio = "16/9",
    className, 
    containerClassName,
    eager = false,
    onLoad,
    ...props 
  }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(eager);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for triggering load
    useEffect(() => {
      if (eager || isInView) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        { 
          rootMargin: '50px 0px', // Start loading slightly before in view
          threshold: 0.01 
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [eager, isInView]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoad?.(e);
    };

    // Generate a simple blur placeholder if none provided
    const placeholderStyle = blurSrc 
      ? { backgroundImage: `url(${blurSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {};

    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative overflow-hidden bg-muted/30",
          containerClassName
        )}
        style={{ aspectRatio }}
      >
        {/* Blur placeholder background */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            isLoaded ? "opacity-0" : "opacity-100"
          )}
          style={placeholderStyle}
        >
          {/* Shimmer effect when no blur src */}
          {!blurSrc && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Actual image - only rendered when in view */}
        {isInView && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={handleLoad}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              isLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            {...props}
          />
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

export default LazyImage;
