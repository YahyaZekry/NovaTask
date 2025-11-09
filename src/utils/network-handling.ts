// Network error handling utilities for NovaTask application

import { useState, useEffect, useCallback } from 'react';
import { AppError, ErrorType, classifyError, ErrorContext } from './error-handling';

// Network request configuration
export interface NetworkRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  maxRetryDelay?: number;
  retryCondition?: (error: AppError) => boolean;
  cache?: RequestCache;
  signal?: AbortSignal;
}

// Network response interface
export interface NetworkResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  redirected: boolean;
  url: string;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: AppError, attempt: number) => boolean;
  onRetry?: (error: AppError, attempt: number) => void;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error, attempt) => {
    // Retry on network errors and 5xx server errors
    return (
      error.type === ErrorType.NETWORK ||
      error.type === ErrorType.TIMEOUT ||
      (error.technicalDetails?.includes('500') ?? false) ||
      (error.technicalDetails?.includes('502') ?? false) ||
      (error.technicalDetails?.includes('503') ?? false) ||
      (error.technicalDetails?.includes('504') ?? false)
    ) && attempt < 3;
  }
};

// Exponential backoff calculation
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffFactor: number = 2
): number {
  const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, maxDelay);
}

// Network request with retry logic
export async function fetchWithRetry<T = unknown>(
  config: NetworkRequestConfig,
  retryConfig: Partial<RetryConfig> = {}
): Promise<NetworkResponse<T>> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    maxRetryDelay = 10000,
    retryCondition,
    cache = 'default',
    signal
  } = config;

  const finalRetryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: retries,
    baseDelay: retryDelay,
    maxDelay: maxRetryDelay,
    retryCondition: (error, attempt) => {
      if (retryCondition) {
        return retryCondition(error) && attempt < retries;
      }
      return DEFAULT_RETRY_CONFIG.retryCondition!(error, attempt);
    }
  };

  let lastError: AppError | null = null;

  for (let attempt = 1; attempt <= finalRetryConfig.maxAttempts; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      const combinedSignal = signal ? 
        AbortSignal.any([controller.signal, signal]) : 
        controller.signal;

      const response = await fetch(url, {
        method,
        headers,
        body,
        cache,
        signal: combinedSignal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        const appError = classifyError(error, {
          url,
          requestMethod: method,
          status: response.status,
          attempt
        } as ErrorContext);

        // Check if we should retry this error
        if (attempt < finalRetryConfig.maxAttempts && 
            finalRetryConfig.retryCondition!(appError, attempt)) {
          lastError = appError;
          finalRetryConfig.onRetry?.(appError, attempt);
          
          // Calculate delay for next attempt
          const delay = exponentialBackoff
            ? calculateBackoffDelay(attempt, finalRetryConfig.baseDelay, finalRetryConfig.maxDelay, finalRetryConfig.backoffFactor)
            : finalRetryConfig.baseDelay;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw appError;
      }

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json() as T;
      } else if (contentType?.includes('text/')) {
        data = await response.text() as T;
      } else {
        data = await response.blob() as T;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok,
        redirected: response.redirected,
        url: response.url
      };

    } catch (error) {
      const appError = (error as AppError)?.id ? error as AppError : classifyError(
        error instanceof Error ? error : new Error(String(error)),
        { url, requestMethod: method, attempt } as ErrorContext
      );

      // Check if we should retry this error
      if (attempt < finalRetryConfig.maxAttempts && 
          finalRetryConfig.retryCondition!(appError, attempt)) {
        lastError = appError;
        finalRetryConfig.onRetry?.(appError, attempt);
        
        // Calculate delay for next attempt
        const delay = exponentialBackoff
          ? calculateBackoffDelay(attempt, finalRetryConfig.baseDelay, finalRetryConfig.maxDelay, finalRetryConfig.backoffFactor)
          : finalRetryConfig.baseDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw appError;
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('Max retry attempts exceeded');
}

// Network status monitoring
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = {
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    lastChecked: new Date()
  };

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
      this.updateConnectionInfo();
    }
  }

  private initializeEventListeners() {
    window.addEventListener('online', () => this.updateStatus({ online: true }));
    window.addEventListener('offline', () => this.updateStatus({ online: false }));

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const nav = navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; addEventListener?: (event: string, handler: () => void) => void } };
      if (nav.connection?.addEventListener) {
        nav.connection.addEventListener('change', () => this.updateConnectionInfo());
      }
    }
  }

  private updateConnectionInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean; addEventListener?: (event: string, handler: () => void) => void } }).connection;
      this.updateStatus({
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      });
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>) {
    this.currentStatus = {
      ...this.currentStatus,
      ...updates,
      lastChecked: new Date()
    };

    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus); // Immediately notify with current status

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      this.updateStatus({ online: response.ok });
      return response.ok;
    } catch {
      this.updateStatus({ online: false });
      return false;
    }
  }
}

// Network status interface
export interface NetworkStatus {
  online: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastChecked: Date;
}

// Hook for network monitoring
export function useNetworkMonitor() {
  const [status, setStatus] = useState<NetworkStatus>(() => 
    NetworkMonitor.getInstance().getStatus()
  );

  useEffect(() => {
    const unsubscribe = NetworkMonitor.getInstance().subscribe(setStatus);
    return unsubscribe;
  }, []);

  const checkConnection = useCallback(async () => {
    return await NetworkMonitor.getInstance().checkConnection();
  }, []);

  return {
    ...status,
    checkConnection,
    isSlow: status.effectiveType === 'slow-2g' || status.effectiveType === '2g',
    isFast: status.effectiveType === '4g' || status.effectiveType === '5g'
  };
}

// Queue for offline operations
export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: Array<{
    id: string;
    operation: () => Promise<unknown>;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
  }> = [];
  private processing = false;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem('novatask-offline-queue');
      if (saved) {
        this.queue = JSON.parse(saved).map((item: { id: string; timestamp: string; retryCount: number; maxRetries: number }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          operation: null // Operations can't be serialized
        }));
      }
    } catch {
      // Silently fail
    }
  }

  private saveQueue() {
    try {
      const serializableQueue = this.queue.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        retryCount: item.retryCount,
        maxRetries: item.maxRetries
      }));
      localStorage.setItem('novatask-offline-queue', JSON.stringify(serializableQueue));
    } catch {
      // Silently fail
    }
  }

  public add<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): string {
    const id = crypto.randomUUID();
    this.queue.push({
      id,
      operation,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries
    });
    this.saveQueue();
    return id;
  }

  public async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      const operationsToProcess = [...this.queue];
      this.queue = [];
      this.saveQueue();

      for (const item of operationsToProcess) {
        try {
          if (item.operation) {
            await item.operation();
          }
        } catch (error) {
          item.retryCount++;
          
          if (item.retryCount < item.maxRetries) {
            this.queue.push(item);
          }
        }
      }

      this.saveQueue();
    } finally {
      this.processing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
  }
}

// Hook for offline queue
export function useOfflineQueue() {
  const [queueLength, setQueueLength] = useState(0);
  const queue = OfflineQueue.getInstance();

  useEffect(() => {
    const updateQueueLength = () => setQueueLength(queue.getQueueLength());
    const interval = setInterval(updateQueueLength, 1000);
    return () => clearInterval(interval);
  }, [queue]);

  const addToQueue = useCallback(<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ) => {
    return queue.add(operation, maxRetries);
  }, [queue]);

  const processQueue = useCallback(async () => {
    await queue.processQueue();
  }, [queue]);

  const clearQueue = useCallback(() => {
    queue.clearQueue();
  }, [queue]);

  return {
    queueLength,
    addToQueue,
    processQueue,
    clearQueue
  };
}