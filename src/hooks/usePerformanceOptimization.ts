// Performance optimization hooks for NovaTask

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { debounce, throttle } from '../utils/rendering-optimizations';
import {
  useStableMemo,
  useDebouncedMemo,
  useThrottledMemo,
  useConditionalMemo,
  useDeepCompareMemo,
  useShallowCompareMemo,
  useLazyMemo,
  useMemoWithCache,
  useMemoWithTimeout,
  useMemoWithRetry
} from '../utils/react-memoization';
import {
  usePerformanceMonitoring,
  useRenderTracker,
  useMemoryMonitor
} from '../utils/performance-monitoring';

// Hook for debounced values
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled values
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      const now = Date.now();
      if (now - lastExecuted.current >= delay) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

// Hook for debounced callbacks
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }) as T, [delay, ...deps]) as T;
}

// Hook for throttled callbacks
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecuted.current >= delay) {
      lastExecuted.current = now;
      callbackRef.current(...args);
    }
  }) as T, [delay, ...deps]) as T;
}

// Hook for intersection observer
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): [boolean, IntersectionObserverEntry | null] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return [isIntersecting, entry];
}

// Hook for resize observer
export function useResizeObserver(
  elementRef: React.RefObject<Element>
): [ResizeObserverEntry | null, DOMRectReadOnly | null] {
  const [entry, setEntry] = useState<ResizeObserverEntry | null>(null);
  const [rect, setRect] = useState<DOMRectReadOnly | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setEntry(entry);
      setRect(entry.contentRect);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return [entry, rect];
}

// Hook for mutation observer
export function useMutationObserver(
  elementRef: React.RefObject<Element>,
  options: MutationObserverInit = {}
): MutationRecord[] {
  const [mutations, setMutations] = useState<MutationRecord[]>([]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new MutationObserver((mutations) => {
      setMutations(mutations);
    });

    observer.observe(element, options);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return mutations;
}

// Hook for performance-optimized event listeners
export function useOptimizedEventListener<T extends keyof WindowEventMap>(
  target: EventTarget,
  eventType: T,
  handler: (event: WindowEventMap[T]) => void,
  options: AddEventListenerOptions & { throttle?: number; debounce?: number } = {}
): void {
  const { throttle: throttleDelay, debounce: debounceDelay, ...eventOptions } = options;

  const optimizedHandler = useMemo(() => {
    if (throttleDelay) {
      return throttle(handler, throttleDelay);
    }
    if (debounceDelay) {
      return debounce(handler, debounceDelay);
    }
    return handler;
  }, [handler, throttleDelay, debounceDelay]);

  useEffect(() => {
    target.addEventListener(eventType, optimizedHandler as EventListener, eventOptions);

    return () => {
      target.removeEventListener(eventType, optimizedHandler as EventListener, eventOptions);
    };
  }, [target, eventType, optimizedHandler, eventOptions]);
}

// Hook for performance-optimized scroll handling
export function useOptimizedScroll(
  handler: (event: Event) => void,
  options: { throttle?: number; debounce?: number; passive?: boolean } = {}
): void {
  const { throttle: throttleDelay, debounce: debounceDelay, passive = true } = options;

  const optimizedHandler = useMemo(() => {
    if (throttleDelay) {
      return throttle(handler, throttleDelay);
    }
    if (debounceDelay) {
      return debounce(handler, debounceDelay);
    }
    return handler;
  }, [handler, throttleDelay, debounceDelay]);

  useEffect(() => {
    window.addEventListener('scroll', optimizedHandler, { passive });

    return () => {
      window.removeEventListener('scroll', optimizedHandler);
    };
  }, [optimizedHandler, passive]);
}

// Hook for performance-optimized resize handling
export function useOptimizedResize(
  handler: (event: Event) => void,
  options: { throttle?: number; debounce?: number; passive?: boolean } = {}
): void {
  const { throttle: throttleDelay, debounce: debounceDelay, passive = true } = options;

  const optimizedHandler = useMemo(() => {
    if (throttleDelay) {
      return throttle(handler, throttleDelay);
    }
    if (debounceDelay) {
      return debounce(handler, debounceDelay);
    }
    return handler;
  }, [handler, throttleDelay, debounceDelay]);

  useEffect(() => {
    window.addEventListener('resize', optimizedHandler, { passive });

    return () => {
      window.removeEventListener('resize', optimizedHandler);
    };
  }, [optimizedHandler, passive]);
}

// Hook for performance-optimized animation frame
export function useOptimizedAnimationFrame(
  callback: () => void,
  deps: React.DependencyList = []
): void {
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
  }, deps);
}

// Hook for performance-optimized idle callback
export function useOptimizedIdleCallback(
  callback: () => void,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleIdle = () => {
      callbackRef.current();
    };

    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(handleIdle);
      return () => cancelIdleCallback(idleId);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timeoutId = setTimeout(handleIdle, 1);
      return () => clearTimeout(timeoutId);
    }
  }, deps);
}

// Hook for performance-optimized media query
export function useOptimizedMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Hook for performance-optimized visibility
export function useOptimizedVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Hook for performance-optimized network status
export function useOptimizedNetworkStatus(): {
  online: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
} {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, online: true }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, online: false }));
    };

    const handleConnectionChange = () => {
      const connection = (navigator as unknown as {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
        mozConnection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
        webkitConnection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
      }).connection ||
                        (navigator as unknown as {
                          mozConnection?: {
                            effectiveType?: string;
                            downlink?: number;
                            rtt?: number;
                          };
                        }).mozConnection ||
                        (navigator as unknown as {
                          webkitConnection?: {
                            effectiveType?: string;
                            downlink?: number;
                            rtt?: number;
                          };
                        }).webkitConnection;
      
      if (connection) {
        setNetworkStatus(prev => ({
          ...prev,
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as unknown as {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
      mozConnection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
      webkitConnection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
      };
    }).connection ||
                      (navigator as unknown as {
                        mozConnection?: {
                          effectiveType?: string;
                          downlink?: number;
                          rtt?: number;
                        };
                      }).mozConnection ||
                      (navigator as unknown as {
                        webkitConnection?: {
                          effectiveType?: string;
                          downlink?: number;
                          rtt?: number;
                        };
                      }).webkitConnection;
    
    if (connection) {
      const connectionWithEvents = connection as {
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
      
      connectionWithEvents.addEventListener?.('change', handleConnectionChange);
      handleConnectionChange(); // Initial call
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        const connectionWithEvents = connection as {
          removeEventListener?: (type: string, listener: () => void) => void;
        };
        connectionWithEvents.removeEventListener?.('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
}

// Hook for performance-optimized device memory
export function useOptimizedDeviceMemory(): number {
  const [memory, setMemory] = useState(4); // Default to 4GB

  useEffect(() => {
    if ('deviceMemory' in navigator) {
      setMemory((navigator as unknown as { deviceMemory?: number }).deviceMemory || 4);
    }
  }, []);

  return memory;
}

// Hook for performance-optimized hardware concurrency
export function useOptimizedHardwareConcurrency(): number {
  const [concurrency, setConcurrency] = useState(4); // Default to 4 cores

  useEffect(() => {
    if ('hardwareConcurrency' in navigator) {
      setConcurrency(navigator.hardwareConcurrency);
    }
  }, []);

  return concurrency;
}

// Hook for performance-optimized battery status
export function useOptimizedBatteryStatus(): {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
} | null {
  const [batteryStatus, setBatteryStatus] = useState<{
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
  } | null>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery?: () => Promise<{
        charging: boolean;
        level: number;
        chargingTime: number;
        dischargingTime: number;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      }> }).getBattery?.().then((battery) => {
        const updateBatteryStatus = () => {
          setBatteryStatus({
            charging: battery.charging,
            level: battery.level,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
          });
        };

        updateBatteryStatus();

        battery.addEventListener('chargingchange', updateBatteryStatus);
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingtimechange', updateBatteryStatus);
        battery.addEventListener('dischargingtimechange', updateBatteryStatus);

        return () => {
          battery.removeEventListener('chargingchange', updateBatteryStatus);
          battery.removeEventListener('levelchange', updateBatteryStatus);
          battery.removeEventListener('chargingtimechange', updateBatteryStatus);
          battery.removeEventListener('dischargingtimechange', updateBatteryStatus);
        };
      });
    }
  }, []);

  return batteryStatus;
}

// Hook for performance-optimized web vitals
export function useOptimizedWebVitals(): {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
} {
  const [vitals, setVitals] = useState({
    fcp: null as number | null,
    lcp: null as number | null,
    fid: null as number | null,
    cls: null as number | null,
    ttfb: null as number | null,
  });

  useEffect(() => {
    const measureWebVitals = async () => {
      try {
        // First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
        if (fcpEntry) {
          setVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }

        // Largest Contentful Paint
        if ('LargestContentfulPaint' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // First Input Delay
        if ('PerformanceEventTiming' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              const eventEntry = entry as PerformanceEventTiming;
              if (eventEntry.processingStart && eventEntry.startTime) {
                setVitals(prev => ({ ...prev, fid: eventEntry.processingStart - eventEntry.startTime }));
              }
            });
          }).observe({ entryTypes: ['first-input'] });
        }

        // Cumulative Layout Shift
        if ('LayoutShift' in window) {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              const layoutEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
              if (!layoutEntry.hadRecentInput && layoutEntry.value) {
                clsValue += layoutEntry.value;
                setVitals(prev => ({ ...prev, cls: clsValue }));
              }
            });
          }).observe({ entryTypes: ['layout-shift'] });
        }

        // Time to First Byte
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry) {
          setVitals(prev => ({ ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart }));
        }
      } catch (error) {
        console.warn('Error measuring web vitals:', error);
      }
    };

    measureWebVitals();
  }, []);

  return vitals;
}

// Export all hooks
export default {
  useDebouncedValue,
  useThrottledValue,
  useDebouncedCallback,
  useThrottledCallback,
  useIntersectionObserver,
  useResizeObserver,
  useMutationObserver,
  useOptimizedEventListener,
  useOptimizedScroll,
  useOptimizedResize,
  useOptimizedAnimationFrame,
  useOptimizedIdleCallback,
  useOptimizedMediaQuery,
  useOptimizedVisibility,
  useOptimizedNetworkStatus,
  useOptimizedDeviceMemory,
  useOptimizedHardwareConcurrency,
  useOptimizedBatteryStatus,
  useOptimizedWebVitals,
  // Memoization hooks
  useStableMemo,
  useDebouncedMemo,
  useThrottledMemo,
  useConditionalMemo,
  useDeepCompareMemo,
  useShallowCompareMemo,
  useLazyMemo,
  useMemoWithCache,
  useMemoWithTimeout,
  useMemoWithRetry,
  // Performance monitoring hooks
  usePerformanceMonitoring,
  useRenderTracker,
  useMemoryMonitor,
};