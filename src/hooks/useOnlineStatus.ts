"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ToastNotification";

interface OnlineStatusOptions {
  showToast?: boolean;
  debounceMs?: number;
  checkInterval?: number;
  onOnline?: () => void;
  onOffline?: () => void;
}

interface OnlineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  lastOnlineTime?: Date;
  recheckConnection: () => Promise<boolean>;
}

export function useOnlineStatus(options: OnlineStatusOptions = {}): OnlineStatusReturn {
  const {
    showToast = true,
    debounceMs = 1000,
    checkInterval = 30000,
    onOnline,
    onOffline
  } = options;

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | undefined>(
    typeof navigator !== "undefined" && navigator.onLine ? new Date() : undefined
  );
  const [connectionInfo, setConnectionInfo] = useState({
    connectionType: undefined as string | undefined,
    effectiveType: undefined as string | undefined,
    downlink: undefined as number | undefined,
    rtt: undefined as number | undefined,
    saveData: undefined as boolean | undefined
  });

  const { addToast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get network connection information
  const getConnectionInfo = useCallback(() => {
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      return {
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      };
    }
    return {
      connectionType: undefined,
      effectiveType: undefined,
      downlink: undefined,
      rtt: undefined,
      saveData: undefined
    };
  }, []);

  // Check if actually online by making a request
  const recheckConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const actuallyOnline = response.ok;
      
      if (actuallyOnline !== isOnline) {
        setIsOnline(actuallyOnline);
        if (actuallyOnline) {
          setLastOnlineTime(new Date());
          onOnline?.();
          if (showToast) {
            addToast({
              message: "Connection restored",
              type: "success",
              duration: 3000
            });
          }
        } else {
          onOffline?.();
          if (showToast) {
            addToast({
              message: "Connection lost",
              type: "warning",
              duration: 5000
            });
          }
        }
      }
      
      return actuallyOnline;
    } catch {
      if (isOnline) {
        setIsOnline(false);
        onOffline?.();
        if (showToast) {
          addToast({
            message: "Connection lost",
            type: "warning",
            duration: 5000
          });
        }
      }
      return false;
    }
  }, [isOnline, onOnline, onOffline, showToast, addToast]);

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    // Debounce to prevent rapid toggling
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
      onOnline?.();
      
      if (showToast) {
        addToast({
          message: "Connection restored",
          type: "success",
          duration: 3000
        });
      }
    }, debounceMs);
  }, [onOnline, showToast, addToast, debounceMs]);

  const handleOffline = useCallback(() => {
    // Debounce to prevent rapid toggling
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsOnline(false);
      onOffline?.();
      
      if (showToast) {
        addToast({
          message: "Connection lost. Some features may be unavailable.",
          type: "warning",
          duration: 5000
        });
      }
    }, debounceMs);
  }, [onOffline, showToast, addToast, debounceMs]);

  // Handle connection changes
  const handleConnectionChange = useCallback(() => {
    const newConnectionInfo = getConnectionInfo();
    setConnectionInfo(newConnectionInfo);
    
    // Show toast for significant connection changes
    if (showToast && newConnectionInfo.effectiveType) {
      const effectiveTypeMap: Record<string, string> = {
        'slow-2g': 'Very slow connection',
        '2g': 'Slow connection',
        '3g': 'Moderate connection',
        '4g': 'Fast connection',
        '5g': 'Very fast connection'
      };
      
      const message = effectiveTypeMap[newConnectionInfo.effectiveType];
      if (message) {
        addToast({
          message,
          type: "info",
          duration: 3000
        });
      }
    }
  }, [getConnectionInfo, showToast, addToast]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial connection info
    setConnectionInfo(getConnectionInfo());

    // Online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network connection events (if supported)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", handleConnectionChange);
    }

    // Periodic connection check
    if (checkInterval > 0) {
      checkIntervalRef.current = setInterval(recheckConnection, checkInterval);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener("change", handleConnectionChange);
      }
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, recheckConnection, getConnectionInfo, checkInterval]);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType: connectionInfo.connectionType,
    effectiveType: connectionInfo.effectiveType,
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
    saveData: connectionInfo.saveData,
    lastOnlineTime,
    recheckConnection
  };
}

// Hook for offline-aware operations
export function useOfflineAwareOperation() {
  const { isOnline, recheckConnection } = useOnlineStatus();
  const { addToast } = useToast();

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      offlineMessage?: string;
      retryOnReconnect?: boolean;
      fallback?: () => T | Promise<T>;
    }
  ): Promise<T> => {
    const { offlineMessage = "This operation requires an internet connection", retryOnReconnect = false, fallback } = options || {};

    if (!isOnline) {
      if (fallback) {
        return await fallback();
      }
      
      addToast({
        message: offlineMessage,
        type: "warning",
        duration: 5000
      });
      
      throw new Error("Operation failed: No internet connection");
    }

    try {
      return await operation();
    } catch (error) {
      // Check if it's a network error
      if (error instanceof Error && (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      )) {
        // Try to recheck connection
        const actuallyOnline = await recheckConnection();
        
        if (!actuallyOnline && fallback) {
          return await fallback();
        }
        
        if (!actuallyOnline) {
          addToast({
            message: "Connection lost during operation",
            type: "error",
            duration: 5000
          });
        }
      }
      
      throw error;
    }
  }, [isOnline, recheckConnection, addToast]);

  return { execute };
}


// Hook for queueing operations when offline
export function useOfflineQueue<T>() {
  const { isOnline, isOffline } = useOnlineStatus();
  const [queue, setQueue] = useState<Array<{ id: string; operation: T; timestamp: Date }>>([]);
  const { addToast } = useToast();

  const addToQueue = useCallback((operation: T) => {
    const id = crypto.randomUUID();
    setQueue(prev => [...prev, { id, operation, timestamp: new Date() }]);
    
    addToast({
      message: "Operation queued. Will sync when connection is restored.",
      type: "info",
      duration: 3000
    });
    
    return id;
  }, [addToast]);

  const processQueue = useCallback(async (processor: (operation: T) => Promise<void>) => {
    if (queue.length === 0) return;
    
    const operationsToProcess = [...queue];
    setQueue([]);
    
    for (const { operation } of operationsToProcess) {
      try {
        await processor(operation);
      } catch (error) {
        console.error("Failed to process queued operation:", error);
        // Re-add to queue if it fails
        setQueue(prev => [...prev, { id: crypto.randomUUID(), operation, timestamp: new Date() }]);
      }
    }
    
    if (operationsToProcess.length > 0) {
      addToast({
        message: `Synced ${operationsToProcess.length} operation${operationsToProcess.length > 1 ? 's' : ''}`,
        type: "success",
        duration: 3000
      });
    }
  }, [queue, addToast]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      // Note: In a real app, you'd pass the actual processor function
      // This is just a placeholder to show the concept
      console.log("Would process queue with", queue.length, "operations");
    }
  }, [isOnline, queue.length]);

  return {
    queue,
    addToQueue,
    processQueue,
    queueLength: queue.length,
    isOffline
  };
}