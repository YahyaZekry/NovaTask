"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  onError?: (error: Error) => void;
  syncAcrossTabs?: boolean;
}

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  isLoaded: boolean;
  error: Error | null;
  isPersisting: boolean;
}

export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError,
    syncAcrossTabs = true
  } = options;

  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  
  const isSettingValue = useRef(false);
  const lastKnownValue = useRef<T>(defaultValue);

  // Load value from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsedValue = deserialize(item);
        setValueState(parsedValue);
        lastKnownValue.current = parsedValue;
      }
    } catch (err) {
      const error = new Error(`Failed to load localStorage key "${key}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      setError(error);
      onError?.(error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, deserialize, onError]);

  // Save value to localStorage whenever it changes
  const persistValue = useCallback(async (newValue: T) => {
    if (isSettingValue.current) return; // Skip if we're just syncing from another tab
    
    setIsPersisting(true);
    setError(null);
    
    try {
      const serializedValue = serialize(newValue);
      localStorage.setItem(key, serializedValue);
      lastKnownValue.current = newValue;
    } catch (err) {
      const error = new Error(`Failed to save localStorage key "${key}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      setError(error);
      onError?.(error);
      
      // If localStorage is full, try to clear some space
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        try {
          // Clear old items (simple strategy: remove items older than 30 days)
          const keys = Object.keys(localStorage);
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
          
          for (const k of keys) {
            if (k.startsWith('novatask-') && k !== key) {
              try {
                const item = localStorage.getItem(k);
                if (item) {
                  const parsed = JSON.parse(item);
                  if (parsed.timestamp && parsed.timestamp < thirtyDaysAgo) {
                    localStorage.removeItem(k);
                  }
                }
              } catch {
                // If we can't parse, just remove it
                localStorage.removeItem(k);
              }
            }
          }
          
          // Try saving again
          localStorage.setItem(key, serialize(newValue));
          lastKnownValue.current = newValue;
          setError(null);
        } catch (retryErr) {
          const retryError = new Error(`Failed to save localStorage key "${key}" after cleanup: ${retryErr instanceof Error ? retryErr.message : 'Unknown error'}`);
          setError(retryError);
          onError?.(retryError);
        }
      }
    } finally {
      setIsPersisting(false);
    }
  }, [key, serialize, onError]);

  // Update state and persist to localStorage
  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueState(prev => {
      const resolvedValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
      persistValue(resolvedValue);
      return resolvedValue;
    });
  }, [persistValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValueState(defaultValue);
      lastKnownValue.current = defaultValue;
      setError(null);
    } catch (err) {
      const error = new Error(`Failed to remove localStorage key "${key}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      setError(error);
      onError?.(error);
    }
  }, [key, defaultValue, onError]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          isSettingValue.current = true;
          const newValue = deserialize(e.newValue);
          setValueState(newValue);
          lastKnownValue.current = newValue;
          setError(null);
        } catch (err) {
          const error = new Error(`Failed to sync localStorage key "${key}" from another tab: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setError(error);
          onError?.(error);
        } finally {
          isSettingValue.current = false;
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed in another tab
        isSettingValue.current = true;
        setValueState(defaultValue);
        lastKnownValue.current = defaultValue;
        isSettingValue.current = false;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, defaultValue, onError, syncAcrossTabs]);

  return {
    value,
    setValue,
    removeValue,
    isLoaded,
    error,
    isPersisting
  };
}

// Hook for managing localStorage with automatic cleanup
export function useLocalStorageWithCleanup<T>(
  key: string,
  options: UseLocalStorageOptions<T> & {
    maxAge?: number; // in milliseconds
    version?: string;
  }
): UseLocalStorageReturn<T> {
  const { maxAge, version, ...localStorageOptions } = options;
  
  const result = useLocalStorage(key, localStorageOptions);

  // Add timestamp and version to stored data
  const enhancedSetValue = (newValue: T | ((prev: T) => T)) => {
    const enhancedValue = typeof newValue === 'function' 
      ? (prev: T) => {
          const resolved = (newValue as (prev: T) => T)(prev);
          return {
            data: resolved,
            timestamp: Date.now(),
            version: version || '1.0.0'
          };
        }
      : {
          data: newValue,
          timestamp: Date.now(),
          version: version || '1.0.0'
        };
    
    result.setValue(enhancedValue as any);
  };

  // Extract data from enhanced value
  const extractData = (storedValue: any): T => {
    if (storedValue && typeof storedValue === 'object' && 'data' in storedValue) {
      // Check if data is expired
      if (maxAge && storedValue.timestamp && Date.now() - storedValue.timestamp > maxAge) {
        result.removeValue();
        return localStorageOptions.defaultValue;
      }
      
      // Check version compatibility
      if (version && storedValue.version !== version) {
        result.removeValue();
        return localStorageOptions.defaultValue;
      }
      
      return storedValue.data;
    }
    return storedValue;
  };

  return {
    ...result,
    value: extractData(result.value),
    setValue: enhancedSetValue
  };
}

// Utility functions for localStorage management
export const localStorageUtils = {
  // Clear all NovaTask-related items
  clearNovaTaskData: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('novatask-')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Get storage usage information
  getStorageInfo: () => {
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });

    return {
      totalKeys: keys.length,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      keys: keys.map(key => ({
        key,
        sizeBytes: (key.length + (localStorage.getItem(key)?.length || 0)),
        sizeKB: Math.round((key.length + (localStorage.getItem(key)?.length || 0)) / 1024 * 100) / 100
      }))
    };
  },

  // Check if localStorage is available
  isAvailable: (): boolean => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Get available storage space (approximation)
  getAvailableSpace: (): number => {
    try {
      const test = 'test';
      let size = 0;
      const data = new Array(1024).join('x');
      
      try {
        while (true) {
          localStorage.setItem(test + size, data);
          size += data.length;
        }
      } catch (e) {
        // Clean up
        for (let i = 0; i < size; i += data.length) {
          localStorage.removeItem(test + i);
        }
        return size;
      }
    } catch {
      return 0;
    }
  }
};

// Hook for localStorage quota management
export function useLocalStorageQuota() {
  const [quotaInfo, setQuotaInfo] = useState(() => localStorageUtils.getStorageInfo());
  const [isNearLimit, setIsNearLimit] = useState(false);

  useEffect(() => {
    const updateQuotaInfo = () => {
      const info = localStorageUtils.getStorageInfo();
      setQuotaInfo(info);
      
      // Consider near limit if using more than 4MB (typical localStorage limit is 5-10MB)
      setIsNearLimit(info.totalSizeKB > 4096);
    };

    // Update quota info periodically
    const interval = setInterval(updateQuotaInfo, 30000); // Every 30 seconds
    
    // Listen for storage changes
    const handleStorageChange = () => {
      updateQuotaInfo();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    quotaInfo,
    isNearLimit,
    clearOldData: () => {
      // Clear items older than 30 days
      const keys = Object.keys(localStorage);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      keys.forEach(key => {
        if (key.startsWith('novatask-')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.timestamp && parsed.timestamp < thirtyDaysAgo) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // If we can't parse, just remove it
            localStorage.removeItem(key);
          }
        }
      });
    }
  };
}