import { useCallback, useRef, useEffect, useMemo, useState } from 'react';

// Rendering optimization utilities for NovaTask

// CSS containment for layout optimization
export function useContainment(options: {
  layout?: boolean;
  paint?: boolean;
  size?: boolean;
  style?: boolean;
} = {}) {
  const { layout = false, paint = false, size = false, style = false } = options;
  
  return useMemo(() => {
    const containment: string[] = [];
    
    if (layout) containment.push('layout');
    if (paint) containment.push('paint');
    if (size) containment.push('size');
    if (style) containment.push('style');
    
    return {
      style: {
        contain: containment.join(' ') || undefined,
      },
    };
  }, [layout, paint, size, style]);
}

// Efficient event handling
export function useThrottledEventHandler<T extends Event>(
  handler: (event: T) => void,
  delay: number = 16 // ~60fps
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventRef = useRef<T | null>(null);

  return useCallback((event: T) => {
    lastEventRef.current = event;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handler(lastEventRef.current as T);
    }, delay);
  }, [handler, delay]);
}

// Debounced event handling
export function useDebouncedEventHandler<T extends Event>(
  handler: (event: T) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((event: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handler(event);
    }, delay);
  }, [handler, delay]);
}

// Passive event listeners for better performance
export function usePassiveEventListener(
  element: HTMLElement | Window,
  event: string,
  handler: (event: Event) => void,
  options: AddEventListenerOptions = {}
) {
  useEffect(() => {
    const passiveOptions = { passive: true, ...options };
    
    element.addEventListener(event, handler, passiveOptions);
    
    return () => {
      element.removeEventListener(event, handler, passiveOptions);
    };
  }, [element, event, handler, options]);
}

// Intersection observer for viewport detection
export function useIntersectionObserver(
  elements: HTMLElement[],
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });

    elements.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [elements, callback, options]);
}

// Resize observer with debouncing
export function useResizeObserver(
  elements: HTMLElement[],
  callback: (entries: ResizeObserverEntry[]) => void,
  debounce: number = 100
) {
  const observerRef = useRef<ResizeObserver>();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!('ResizeObserver' in window)) return;

    const debouncedCallback = (entries: ResizeObserverEntry[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(entries);
      }, debounce);
    };

    observerRef.current = new ResizeObserver(debouncedCallback);

    elements.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [elements, callback, debounce]);
}

// Animation frame optimization
export function useAnimationFrame(callback: () => void) {
  const callbackRef = useRef(callback);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = () => {
      callbackRef.current();
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}

// Viewport size optimization
export function useViewportSize() {
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use passive event listener for better performance
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewportSize;
}

// Optimized scroll handling
export function useScrollHandler(
  onScroll: (scrollY: number, scrollX: number) => void,
  options: {
    throttle?: number;
    debounce?: number;
  } = {}
) {
  const { throttle = 16, debounce = 0 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollRef = useRef({ x: 0, y: 0 });

  const handleScroll = useCallback(() => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    if (scrollX !== lastScrollRef.current.x || scrollY !== lastScrollRef.current.y) {
      lastScrollRef.current = { x: scrollX, y: scrollY };
      onScroll(scrollY, scrollX);
    }
  }, [onScroll]);

  useEffect(() => {
    if (debounce > 0) {
      // Debounced version
      const debouncedHandler = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(handleScroll, debounce);
      };

      window.addEventListener('scroll', debouncedHandler, { passive: true });
    } else {
      // Throttled version
      let ticking = false;
      const throttledHandler = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', throttledHandler, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, debounce, throttle]);
}

// CSS-in-JS optimization
export function createOptimizedStyles(styles: Record<string, string | number>) {
  // Flatten and optimize styles
  const optimized: Record<string, string | number> = {};
  
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Remove unnecessary whitespace and optimize CSS
      optimized[key] = value.replace(/\s+/g, ' ').trim();
    } else {
      optimized[key] = value;
    }
  });

  return optimized;
}

// GPU acceleration hints
export function useGPUAcceleration() {
  return useMemo(() => ({
    style: {
      transform: 'translateZ(0)',
      willChange: 'transform',
      backfaceVisibility: 'hidden',
      perspective: 1000,
    },
  }), []);
}

// Composite layer optimization
export function useCompositeLayer() {
  const elementRef = useRef<HTMLElement>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Promote to composite layer
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    
    return () => {
      element.style.willChange = '';
      element.style.transform = '';
    };
  }, []);

  return elementRef;
}

// Memory-efficient rendering
export function useMemoryEfficientRendering<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  options: {
    batchSize?: number;
    threshold?: number;
  } = {}
) {
  const { batchSize = 50, threshold = 100 } = options;
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: batchSize });
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use Intersection Observer for efficient rendering
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Expand visible range
            setVisibleRange(prev => ({
              ...prev,
              end: Math.min(prev.end + batchSize, items.length),
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe container
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [items.length, batchSize]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  return {
    containerRef,
    visibleItems,
    visibleRange,
  };
}

// Optimized animation
export function useOptimizedAnimation(
  duration: number,
  easing: string = 'ease-out'
) {
  return useMemo(() => ({
    style: {
      transition: `all ${duration}ms ${easing}`,
      willChange: 'transform, opacity',
    },
    keyframes: {
      standard: {
        from: { opacity: 0, transform: 'translateY(20px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      slideIn: {
        from: { opacity: 0, transform: 'translateX(-100%)' },
        to: { opacity: 1, transform: 'translateX(0)' },
      },
      fadeOut: {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
    },
  }), [duration, easing]);
}

// Performance-optimized portal
export function useOptimizedPortal() {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Create portal container
    const portal = document.createElement('div');
    portal.style.position = 'fixed';
    portal.style.top = '0';
    portal.style.left = '0';
    portal.style.pointerEvents = 'none';
    portal.style.zIndex = '9999';
    document.body.appendChild(portal);
    portalRef.current = portal;
    setMounted(true);

    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
        setMounted(false);
      }
    };
  }, []);

  return {
    portalRef,
    mounted,
  };
}

// Layout thrashing prevention
export function useLayoutStability() {
  const rafRef = useRef<number | null>(null);
  const measurementsRef = useRef<Map<string, DOMRect>>(new Map());

  const measureLayout = useCallback((element: HTMLElement, id: string) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      measurementsRef.current.set(id, rect);
    });
  }, []);

  const getMeasurement = useCallback((id: string) => {
    return measurementsRef.current.get(id);
  }, []);

  return {
    measureLayout,
    getMeasurement,
  };
}

// Export all utilities
export default {
  useContainment,
  useThrottledEventHandler,
  useDebouncedEventHandler,
  usePassiveEventListener,
  useIntersectionObserver,
  useResizeObserver,
  useAnimationFrame,
  useViewportSize,
  useScrollHandler,
  createOptimizedStyles,
  useGPUAcceleration,
  useCompositeLayer,
  useMemoryEfficientRendering,
  useOptimizedAnimation,
  useOptimizedPortal,
  useLayoutStability,
};