import { useCallback, useMemo, useRef, useEffect, useState, createContext, useContext } from 'react';

// State management optimization utilities

// Optimized state selector with memoization
export function useMemoizedSelector<T, R>(
  state: T,
  selector: (state: T) => R,
  deps: React.DependencyList = [state, selector]
): R {
  return useMemo(() => selector(state), deps);
}

// Batch state updates to prevent multiple re-renders
export function useBatchedUpdates<T>(
  initialState: T
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Array<Partial<T> | ((prev: T) => Partial<T>)>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchedSetState = useCallback((
    updates: Partial<T> | ((prev: T) => Partial<T>)
  ) => {
    pendingUpdates.current.push(updates);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = { ...prevState };
        
        pendingUpdates.current.forEach(update => {
          if (typeof update === 'function') {
            const updateFn = update as (prev: T) => Partial<T>;
            newState = { ...newState, ...updateFn(prevState) };
          } else {
            newState = { ...newState, ...update };
          }
        });

        pendingUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  return [state, batchedSetState];
}

// Optimized state with shallow comparison
export function useShallowState<T>(
  initialState: T
): [T, (state: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  const prevStateRef = useRef<T>(initialState);

  const optimizedSetState = useCallback((
    newState: T | ((prev: T) => T)
  ) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      // Shallow comparison to prevent unnecessary re-renders
      const hasChanged = Object.keys(resolvedState).some(key =>
        resolvedState[key as keyof T] !== (prev as Record<string, unknown>)[key]
      );
      
      if (hasChanged) {
        prevStateRef.current = resolvedState;
        return resolvedState;
      }
      
      return prev;
    });
  }, []);

  return [state, optimizedSetState];
}

// State normalization utilities
export class StateNormalizer {
  static normalize<T extends { id: string | number }>(
    items: T[]
  ): Record<string | number, T> {
    return items.reduce((normalized, item) => {
      normalized[item.id] = item;
      return normalized;
    }, {} as Record<string | number, T>);
  }

  static denormalize<T extends { id: string | number }>(
    normalized: Record<string | number, T>
  ): T[] {
    return Object.values(normalized);
  }

  static updateNormalized<T extends { id: string | number }>(
    normalized: Record<string | number, T>,
    item: T
  ): Record<string | number, T> {
    return {
      ...normalized,
      [item.id]: item,
    };
  }

  static removeFromNormalized<T extends { id: string | number }>(
    normalized: Record<string | number, T>,
    id: string | number
  ): Record<string | number, T> {
    const { [id]: removed, ...rest } = normalized;
    return rest;
  }
}

// Optimized reducer with action batching
export function useOptimizedReducer<T, A>(
  reducer: (state: T, action: A) => T,
  initialState: T,
  options: {
    batch?: boolean;
    batchDelay?: number;
  } = {}
): [T, (action: A) => void] {
  const [state, setState] = useState(initialState);
  const actionQueue = useRef<A[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { batch = true, batchDelay = 0 } = options;

  const dispatch = useCallback((action: A) => {
    if (!batch) {
      setState(prev => reducer(prev, action));
      return;
    }

    actionQueue.current.push(action);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => {
        let newState = prev;
        actionQueue.current.forEach(action => {
          newState = reducer(newState, action);
        });
        actionQueue.current = [];
        return newState;
      });
    }, batchDelay);
  }, [reducer, batch, batchDelay]);

  return [state, dispatch];
}

// State persistence with optimization
export function useOptimizedPersistence<T>(
  key: string,
  initialState: T,
  options: {
    serialize?: (state: T) => string;
    deserialize?: (value: string) => T;
    debounce?: number;
    compress?: boolean;
  } = {}
): [T, (state: T | ((prev: T) => T)) => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounce = 300,
    compress = false,
  } = options;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return deserialize(stored);
      }
    } catch (error) {
      console.error(`Error loading state from localStorage:`, error);
    }
    return initialState;
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const optimizedSetState = useCallback((
    newState: T | ((prev: T) => T)
  ) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      // Debounce persistence
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        try {
          const serialized = compress 
            ? compressData(serialize(resolvedState))
            : serialize(resolvedState);
          localStorage.setItem(key, serialized);
        } catch (error) {
          console.error(`Error saving state to localStorage:`, error);
        }
      }, debounce);

      return resolvedState;
    });
  }, [key, serialize, deserialize, debounce, compress]);

  return [state, optimizedSetState];
}

// Simple compression for localStorage
function compressData(data: string): string {
  try {
    // Simple compression - in production, use a proper compression library
    return btoa(data);
  } catch {
    return data;
  }
}

// State validation utilities
export function useValidatedState<T>(
  initialState: T,
  validator: (state: T) => boolean,
  onInvalid?: (invalidState: T) => T
): [T, (state: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);

  const validatedSetState = useCallback((
    newState: T | ((prev: T) => T)
  ) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      if (!validator(resolvedState)) {
        console.warn('Invalid state detected:', resolvedState);
        return onInvalid ? onInvalid(resolvedState) : prev;
      }
      
      return resolvedState;
    });
  }, [validator, onInvalid]);

  return [state, validatedSetState];
}

// State history for undo/redo functionality
export function useStateHistory<T>(
  initialState: T,
  maxHistory: number = 50
): [T, (state: T | ((prev: T) => T)) => void, () => void, () => void, () => T[]] {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateState = useCallback((
    newState: T | ((prev: T) => T)
  ) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      
      if (resolvedState !== prev) {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(resolvedState);
        
        // Limit history size
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        } else {
          setCurrentIndex(newHistory.length - 1);
        }
        
        setHistory(newHistory);
      }
      
      return resolvedState;
    });
  }, [history, currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [currentIndex, history]);

  const getHistory = useCallback(() => [...history], [history]);

  return [state, updateState, undo, redo, getHistory];
}

// Optimized context state management
export function createOptimizedContext<T>(
  defaultValue: T,
  options: {
    selector?: (state: T) => unknown;
    equalityFn?: (a: unknown, b: unknown) => boolean;
  } = {}
) {
  const { selector = state => state, equalityFn = Object.is } = options;

  const Context = createContext<{
    state: T;
    setState: (state: T | ((prev: T) => T)) => void;
  }>({
    state: defaultValue,
    setState: () => {},
  });

  const Provider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState(defaultValue);

    const contextValue = useMemo(() => ({
      state,
      setState,
    }), [state]);

    return React.createElement(Context.Provider, { value: contextValue }, children);
  };

  const useContextValue = () => {
    const context = useContext(Context);
    const selectedValue = useMemo(() => selector(context.state), [context.state, selector]);
    
    return {
      ...context,
      state: selectedValue,
    };
  };

  return {
    Context,
    Provider,
    useContext: useContextValue,
  };
}

// State performance monitoring
export class StatePerformanceMonitor {
  private static metrics = {
    setStateCalls: 0,
    stateChanges: 0,
    renderCount: 0,
    averageStateSize: 0,
  };

  static recordSetState() {
    this.metrics.setStateCalls++;
  }

  static recordStateChange(prevSize: number, newSize: number) {
    if (prevSize !== newSize) {
      this.metrics.stateChanges++;
      this.metrics.averageStateSize = 
        (this.metrics.averageStateSize + newSize) / 2;
    }
  }

  static recordRender() {
    this.metrics.renderCount++;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    this.metrics = {
      setStateCalls: 0,
      stateChanges: 0,
      renderCount: 0,
      averageStateSize: 0,
    };
  }
}

// Enhanced useState with performance monitoring
export function useMonitoredState<T>(
  initialState: T,
  name: string
): [T, (state: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);

  const monitoredSetState = useCallback((
    newState: T | ((prev: T) => T)
  ) => {
    StatePerformanceMonitor.recordSetState();
    
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      StatePerformanceMonitor.recordStateChange(
        JSON.stringify(prev).length,
        JSON.stringify(resolvedState).length
      );
      return resolvedState;
    });
  }, []);

  useEffect(() => {
    StatePerformanceMonitor.recordRender();
    console.log(`State "${name}" rendered:`, {
      size: JSON.stringify(state).length,
      setStateCalls: StatePerformanceMonitor.getMetrics().setStateCalls,
      stateChanges: StatePerformanceMonitor.getMetrics().stateChanges,
    });
  });

  return [state, monitoredSetState];
}