import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Enhanced memoization utilities for React components

// Memoization hook for expensive calculations with dependency tracking
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Update callback ref if it changes
  if (callback !== callbackRef.current) {
    callbackRef.current = callback;
  }

  // Update deps ref if they change
  if (deps !== depsRef.current) {
    depsRef.current = deps;
  }

  // Return memoized callback
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
}

// Memoization hook for expensive computations with cache invalidation
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  key?: string
): T {
  const cacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map());
  
  return useMemo(() => {
    if (key) {
      const cache = cacheRef.current;
      const cached = cache.get(key);
      const now = Date.now();
      
      // Cache for 5 minutes
      if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
        return cached.value;
      }
      
      const value = factory();
      cache.set(key, { value, timestamp: now });
      return value;
    }
    
    return factory();
  }, deps);
}

// Debounced memoization for frequently changing values
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [value, setValue] = useState<T>();
  const depsRef = useRef(deps);

  useEffect(() => {
    depsRef.current = deps;
  }, [deps]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValue(factory());
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [deps, delay]);

  return value !== undefined ? value : factory();
}

// Throttled memoization for high-frequency updates
export function useThrottledMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  interval: number = 100
): T {
  const lastUpdateRef = useRef<number>(0);
  const [value, setValue] = useState<T>();
  const depsRef = useRef(deps);

  useEffect(() => {
    depsRef.current = deps;
  }, [deps]);

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdateRef.current >= interval) {
      lastUpdateRef.current = now;
      setValue(factory());
    }
  }, [deps, interval]);

  return value !== undefined ? value : factory();
}

// Memoization for array operations
export function useMemoizedArray<T>(
  items: T[],
  keyFn?: (item: T) => string | number
): T[] {
  return useMemo(() => {
    if (!keyFn) return [...items];
    
    // Create stable array with consistent order
    const mapped = items.map(item => ({
      item,
      key: keyFn(item)
    }));
    
    // Sort by key for consistency
    mapped.sort((a, b) => {
      const keyA = String(a.key);
      const keyB = String(b.key);
      return keyA.localeCompare(keyB);
    });
    
    return mapped.map(mapped => mapped.item);
  }, [items, keyFn]);
}

// Memoization for object operations
export function useMemoizedObject<T extends Record<string, unknown>>(
  obj: T,
  keys?: (keyof T)[]
): T {
  return useMemo(() => {
    if (!keys) return { ...obj };
    
    const result: Partial<T> = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    
    return result as T;
  }, [obj, keys]);
}

// Memoization for filtered data
export function useMemoizedFilter<T>(
  items: T[],
  predicate: (item: T) => boolean,
  deps: React.DependencyList = [items, predicate]
): T[] {
  return useMemo(() => {
    return items.filter(predicate);
  }, deps);
}

// Memoization for sorted data
export function useMemoizedSort<T>(
  items: T[],
  compareFn: (a: T, b: T) => number,
  deps: React.DependencyList = [items, compareFn]
): T[] {
  return useMemo(() => {
    return [...items].sort(compareFn);
  }, deps);
}

// Memoization for grouped data
export function useMemoizedGroup<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
  deps: React.DependencyList = [items, keyFn]
): Map<K, T[]> {
  return useMemo(() => {
    const groups = new Map<K, T[]>();
    
    items.forEach(item => {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });
    
    return groups;
  }, deps);
}

// Memoization for search operations
export function useMemoizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  deps: React.DependencyList = [items, searchTerm, searchFields]
): T[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(term);
      });
    });
  }, deps);
}

// Memoization for computed properties
export function useMemoizedComputed<T, R>(
  value: T,
  computeFn: (value: T) => R,
  deps: React.DependencyList = [value, computeFn]
): R {
  return useMemo(() => computeFn(value), deps);
}

// Memoization for event handlers
export function useMemoizedEventHandler<T extends Event>(
  handler: (event: T) => void,
  deps: React.DependencyList = []
): (event: T) => void {
  return useCallback(handler, deps);
}

// Memoization for async operations
export function useMemoizedAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList
): {
  result: T | undefined;
  loading: boolean;
  error: Error | undefined;
  execute: () => Promise<T>;
} {
  const [state, setState] = useState<{
    result: T | undefined;
    loading: boolean;
    error: Error | undefined;
  }>({
    result: undefined,
    loading: false,
    error: undefined,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const result = await asyncFn();
      setState({ result, loading: false, error: undefined });
      return result;
    } catch (error) {
      setState({
        result: undefined,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      });
      throw error;
    }
  }, [asyncFn]);

  return {
    ...state,
    execute,
  };
}

// Performance monitoring for memoization
export class MemoizationMetrics {
  private static metrics = {
    memoHits: 0,
    memoMisses: 0,
    totalComputations: 0,
    cacheSize: 0,
  };

  static recordHit() {
    this.metrics.memoHits++;
  }

  static recordMiss() {
    this.metrics.memoMisses++;
  }

  static recordComputation() {
    this.metrics.totalComputations++;
  }

  static recordCacheSize(size: number) {
    this.metrics.cacheSize = size;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static getHitRate() {
    const total = this.metrics.memoHits + this.metrics.memoMisses;
    return total > 0 ? this.metrics.memoHits / total : 0;
  }

  static reset() {
    this.metrics = {
      memoHits: 0,
      memoMisses: 0,
      totalComputations: 0,
      cacheSize: 0,
    };
  }
}

// Enhanced useMemo with metrics tracking
export function useMemoWithMetrics<T>(
  factory: () => T,
  deps: React.DependencyList,
  key?: string
): T {
  const prevDepsRef = useRef(deps);
  const valueRef = useRef<T | undefined>(undefined);

  const depsChanged = deps.some((dep, i) => dep !== prevDepsRef.current[i]);
  
  if (depsChanged) {
    MemoizationMetrics.recordMiss();
    MemoizationMetrics.recordComputation();
    valueRef.current = factory();
    prevDepsRef.current = [...deps];
  } else {
    MemoizationMetrics.recordHit();
  }

  return valueRef.current as T;
}

// Enhanced useCallback with metrics tracking
export function useCallbackWithMetrics<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const prevDepsRef = useRef(deps);
  const callbackRef = useRef(callback);

  const depsChanged = deps.some((dep, i) => dep !== prevDepsRef.current[i]);
  
  if (depsChanged) {
    MemoizationMetrics.recordMiss();
    callbackRef.current = callback;
    prevDepsRef.current = [...deps];
  } else {
    MemoizationMetrics.recordHit();
  }

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, deps) as T;
}

// Advanced memoization for component props
export function useMemoizedProps<T extends Record<string, unknown>>(
  props: T,
  keys?: (keyof T)[]
): T {
  return useMemo(() => {
    if (!keys) return { ...props };
    
    const result: Partial<T> = {};
    keys.forEach(key => {
      if (key in props) {
        result[key] = props[key];
      }
    });
    
    return result as T;
  }, [props, keys]);
}

// Memoization for derived state
export function useMemoizedDerivedState<T, R>(
  state: T,
  deriveFn: (state: T) => R,
  deps: React.DependencyList = [state, deriveFn]
): R {
  return useMemo(() => deriveFn(state), deps);
}

// Memoization for conditional rendering
export function useMemoizedCondition<T>(
  condition: boolean,
  truthyValue: T,
  falsyValue: T,
  deps: React.DependencyList = [condition, truthyValue, falsyValue]
): T {
  return useMemo(() => condition ? truthyValue : falsyValue, deps);
}

// Memoization for list virtualization
export function useMemoizedVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5,
  deps: React.DependencyList = [items, itemHeight, containerHeight, overscan]
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
} {
  return useMemo(() => {
    const startIndex = Math.max(0, Math.floor(0 / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
    const totalHeight = items.length * itemHeight;
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight
    };
  }, deps);
}

// Memoization for pagination
export function useMemoizedPagination<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number,
  deps: React.DependencyList = [items, currentPage, itemsPerPage]
): {
  currentPageItems: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  return useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    return {
      currentPageItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, deps);
}

// Memoization for form validation
export function useMemoizedValidation<T>(
  values: T,
  validationRules: Record<keyof T, (value: T[keyof T]) => string | null>,
  deps: React.DependencyList = [values, validationRules]
): {
  errors: Partial<Record<keyof T, string | null>>;
  isValid: boolean;
} {
  return useMemo(() => {
    const errors: Partial<Record<keyof T, string | null>> = {};
    let isValid = true;
    
    Object.entries(validationRules).forEach(([key, rule]) => {
      const error = (rule as (value: T[keyof T]) => string | null)(values[key as keyof T]);
      if (error) {
        errors[key as keyof T] = error;
        isValid = false;
      }
    });
    
    return { errors, isValid };
  }, deps);
}

// Memoization for data transformation
export function useMemoizedTransform<T, R>(
  data: T[],
  transformFn: (item: T) => R,
  deps: React.DependencyList = [data, transformFn]
): R[] {
  return useMemo(() => {
    return data.map(transformFn);
  }, deps);
}

// Memoization for aggregation
export function useMemoizedAggregation<T, K extends string | number, R>(
  items: T[],
  keyFn: (item: T) => K,
  aggregateFn: (group: T[]) => R,
  deps: React.DependencyList = [items, keyFn, aggregateFn]
): Map<K, R> {
  return useMemo(() => {
    const groups = new Map<K, T[]>();
    
    items.forEach(item => {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });
    
    const result = new Map<K, R>();
    groups.forEach((group, key) => {
      result.set(key, aggregateFn(group));
    });
    
    return result;
  }, deps);
}

// Memoization for deep comparison
export function useMemoizedDeepEqual<T>(
  value: T,
  deps: React.DependencyList = [value]
): T {
  const prevValueRef = useRef<T | undefined>(undefined);
  const prevDepsRef = useRef(deps);
  
  const hasChanged = useMemo(() => {
    return !deps.every((dep, i) => dep === prevDepsRef.current[i]);
  }, deps);
  
  if (hasChanged) {
    prevValueRef.current = value;
    prevDepsRef.current = [...deps];
  }
  
  return prevValueRef.current as T;
}

// Performance-optimized event handler memoization
export function useMemoizedThrottledHandler<T extends Event>(
  handler: (event: T) => void,
  delay: number = 100,
  deps: React.DependencyList = []
): (event: T) => void {
  const lastExecutionRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  return useCallback((event: T) => {
    const now = Date.now();
    
    if (now - lastExecutionRef.current >= delay) {
      lastExecutionRef.current = now;
      handler(event);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutionRef.current = Date.now();
        handler(event);
      }, delay - (now - lastExecutionRef.current));
    }
  }, [handler, delay, ...deps]);
}

// Performance-optimized debounced handler memoization
export function useMemoizedDebouncedHandler<T extends Event>(
  handler: (event: T) => void,
  delay: number = 300,
  deps: React.DependencyList = []
): (event: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  return useCallback((event: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      handler(event);
    }, delay);
  }, [handler, delay, ...deps]);
}

// Memoization for component lifecycle optimization
export function useMemoizedLifecycle<T>(
  value: T,
  onMount?: (value: T) => void,
  onUnmount?: (value: T) => void,
  onUpdate?: (value: T, prevValue: T) => void,
  deps: React.DependencyList = [value]
): T {
  const prevValueRef = useRef<T | undefined>(undefined);
  const isMountedRef = useRef(false);
  
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      onMount?.(value);
    } else if (prevValueRef.current !== value) {
      onUpdate?.(value, prevValueRef.current as T);
    }
    
    prevValueRef.current = value;
    
    return () => {
      if (isMountedRef.current) {
        isMountedRef.current = false;
        onUnmount?.(value);
      }
    };
  }, deps);
  
  return value;
}

// Export all memoization utilities
export const MemoizationUtils = {
  useMemoizedCallback,
  useMemoizedValue,
  useDebouncedMemo,
  useThrottledMemo,
  useMemoizedArray,
  useMemoizedObject,
  useMemoizedFilter,
  useMemoizedSort,
  useMemoizedGroup,
  useMemoizedSearch,
  useMemoizedComputed,
  useMemoizedEventHandler,
  useMemoizedAsync,
  useMemoizedProps,
  useMemoizedDerivedState,
  useMemoizedCondition,
  useMemoizedVirtualList,
  useMemoizedPagination,
  useMemoizedValidation,
  useMemoizedTransform,
  useMemoizedAggregation,
  useMemoizedDeepEqual,
  useMemoizedThrottledHandler,
  useMemoizedDebouncedHandler,
  useMemoizedLifecycle,
  MemoizationMetrics,
  useMemoWithMetrics,
  useCallbackWithMetrics
};