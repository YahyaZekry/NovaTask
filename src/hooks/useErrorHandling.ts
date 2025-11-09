"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppError, ErrorType, ErrorSeverity, classifyError } from '@/utils/error-handling';
import { useError } from '@/contexts/ErrorContext';
import { useToast } from '@/components/ToastNotification';
import { fetchWithRetry, NetworkRequestConfig } from '@/utils/network-handling';

// Helper function to check if error is AppError instance
function isAppError(error: unknown): error is AppError {
  return error !== null && typeof error === 'object' && 'id' in error;
}

// Hook for handling async operations with error handling
export function useAsyncOperation<T = unknown>() {
  const { addError } = useError();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const operationRef = useRef<(() => Promise<T>) | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      showSuccessToast?: boolean;
      successMessage?: string;
      showErrorToast?: boolean;
      customErrorHandler?: (error: AppError) => void;
    }
  ): Promise<T | null> => {
    const {
      showSuccessToast = false,
      successMessage = 'Operation completed successfully',
      showErrorToast = true,
      customErrorHandler
    } = options || {};

    setIsLoading(true);
    setError(null);
    operationRef.current = operation;

    try {
      const result = await operation();
      setData(result);
      
      if (showSuccessToast) {
        addToast({
          message: successMessage,
          type: 'success',
          duration: 3000
        });
      }
      
      return result;
    } catch (err) {
      const appError = isAppError(err) ? err : classifyError(
        err instanceof Error ? err : new Error(String(err))
      );
      
      setError(appError);
      addError(appError.originalError || new Error(appError.message));
      
      if (customErrorHandler) {
        customErrorHandler(appError);
      } else if (showErrorToast) {
        addToast({
          message: appError.userMessage,
          type: 'error',
          duration: 5000
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addError, addToast]);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
    operationRef.current = null;
  }, []);

  const retry = useCallback(async () => {
    if (operationRef.current) {
      return await execute(operationRef.current);
    }
    return null;
  }, [execute]);

  return {
    execute,
    reset,
    retry,
    isLoading,
    error,
    data,
    hasError: error !== null
  };
}

// Hook for network operations with retry logic
export function useNetworkOperation<T = unknown>() {
  const { addError } = useError();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (
    config: NetworkRequestConfig,
    options?: {
      showSuccessToast?: boolean;
      successMessage?: string;
      showErrorToast?: boolean;
      onRetry?: (attempt: number) => void;
    }
  ): Promise<T | null> => {
    const {
      showSuccessToast = false,
      successMessage = 'Request completed successfully',
      showErrorToast = true,
      onRetry
    } = options || {};

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const response = await fetchWithRetry<T>(config, {
        onRetry: (error, attempt) => {
          setRetryCount(attempt);
          onRetry?.(attempt);
          
          addToast({
            message: `Retrying... (Attempt ${attempt})`,
            type: 'info',
            duration: 2000
          });
        }
      });

      setData(response.data);
      
      if (showSuccessToast) {
        addToast({
          message: successMessage,
          type: 'success',
          duration: 3000
        });
      }
      
      return response.data;
    } catch (err) {
      const appError = isAppError(err) ? err : classifyError(
        err instanceof Error ? err : new Error(String(err))
      );
      
      setError(appError);
      addError(appError.originalError || new Error(appError.message));
      
      if (showErrorToast) {
        addToast({
          message: appError.userMessage,
          type: 'error',
          duration: 5000
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addError, addToast]);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
    setRetryCount(0);
  }, []);

  return {
    execute,
    reset,
    isLoading,
    error,
    data,
    hasError: error !== null,
    retryCount
  };
}

// Hook for form validation with error handling
export function useFormValidation<T extends Record<string, unknown>>(initialValues: T) {
  const { addError } = useError();
  const { addToast } = useToast();
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((validationRules: Record<keyof T, (value: unknown) => string | null>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    
    for (const field in validationRules) {
      const fieldValue = values[field];
      const error = validationRules[field](fieldValue);
      
      if (error) {
        newErrors[field] = error;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouchedField = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (
    validationRules: Record<keyof T, (value: unknown) => string | null>,
    onSubmit: (values: T) => Promise<void> | void,
    options?: {
      showErrorToast?: boolean;
    }
  ) => {
    const { showErrorToast = true } = options || {};
    
    // Mark all fields as touched
    const allFields = Object.keys(values) as Array<keyof T>;
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    // Validate form
    const isValid = validate(validationRules);
    
    if (!isValid) {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0 && showErrorToast) {
        addToast({
          message: errorMessages[0] || 'Please fix the errors in the form',
          type: 'error',
          duration: 5000
        });
      }
      return false;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
      return true;
    } catch (err) {
      const appError = isAppError(err) ? err : classifyError(
        err instanceof Error ? err : new Error(String(err))
      );
      
      addError(appError.originalError || new Error(appError.message));
      
      if (showErrorToast) {
        addToast({
          message: appError.userMessage,
          type: 'error',
          duration: 5000
        });
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, errors, validate, addError]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validate,
    reset,
    handleSubmit,
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0
  };
}

// Hook for error recovery
export function useErrorRecovery() {
  const { errors, retryError } = useError();
  const { addToast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);

  const recoverableErrors = errors.filter(error => error.retryable);
  const hasRecoverableErrors = recoverableErrors.length > 0;

  const retryAll = useCallback(async () => {
    if (recoverableErrors.length === 0) return;
    
    setIsRecovering(true);
    
    try {
      const results = await Promise.allSettled(
        recoverableErrors.map(error => retryError(error.id))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        addToast({
          message: `Successfully recovered ${successful} error${successful > 1 ? 's' : ''}`,
          type: 'success',
          duration: 3000
        });
      }
      
      if (failed > 0) {
        addToast({
          message: `Failed to recover ${failed} error${failed > 1 ? 's' : ''}`,
          type: 'warning',
          duration: 5000
        });
      }
    } catch (err) {
      addToast({
        message: 'Error recovery failed',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsRecovering(false);
    }
  }, [recoverableErrors, retryError, addToast]);

  const retrySingle = useCallback(async (errorId: string) => {
    setIsRecovering(true);
    
    try {
      const recovered = await retryError(errorId);
      
      if (recovered) {
        addToast({
          message: 'Error recovered successfully',
          type: 'success',
          duration: 3000
        });
      } else {
        addToast({
          message: 'Error recovery failed',
          type: 'error',
          duration: 5000
        });
      }
    } catch (err) {
      addToast({
        message: 'Error recovery failed',
        type: 'error',
        duration: 5000
      });
    } finally {
      setIsRecovering(false);
    }
  }, [retryError, addToast]);

  return {
    recoverableErrors,
    hasRecoverableErrors,
    retryAll,
    retrySingle,
    isRecovering
  };
}

// Hook for error monitoring and analytics
export function useErrorAnalytics() {
  const { errors, getErrorsByType, getErrorsBySeverity } = useError();
  const [analytics, setAnalytics] = useState({
    totalErrors: 0,
    errorsByType: {} as Record<ErrorType, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    errorRate: 0,
    recentErrors: [] as AppError[]
  });

  useEffect(() => {
    const errorsByType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = getErrorsByType(type).length;
      return acc;
    }, {} as Record<ErrorType, number>);

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = getErrorsBySeverity(severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const recentErrors = errors.filter(error => 
      Date.now() - error.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const errorRate = errors.length > 0 ? recentErrors.length / errors.length : 0;

    setAnalytics({
      totalErrors: errors.length,
      errorsByType,
      errorsBySeverity,
      errorRate,
      recentErrors
    });
  }, [errors, getErrorsByType, getErrorsBySeverity]);

  const getTopErrorTypes = useCallback((limit: number = 5) => {
    return Object.entries(analytics.errorsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([type, count]) => ({ type: type as ErrorType, count }));
  }, [analytics.errorsByType]);

  const getErrorTrend = useCallback(() => {
    const now = Date.now();
    const intervals = [
      { label: 'Last hour', start: now - 3600000 },
      { label: 'Last 6 hours', start: now - 21600000 },
      { label: 'Last 24 hours', start: now - 86400000 }
    ];

    return intervals.map(interval => ({
      label: interval.label,
      count: errors.filter(error => 
        error.timestamp.getTime() >= interval.start
      ).length
    }));
  }, [errors]);

  return {
    ...analytics,
    getTopErrorTypes,
    getErrorTrend
  };
}

// Hook for performance error tracking
export function usePerformanceTracking() {
  const { addError } = useError();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    slowOperations: [] as Array<{ name: string; duration: number; timestamp: Date }>,
    memoryUsage: 0,
    averageResponseTime: 0
  });

  const trackOperation = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    threshold: number = 5000 // 5 seconds
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (duration > threshold) {
        const slowOp = {
          name,
          duration,
          timestamp: new Date()
        };
        
        setPerformanceMetrics(prev => ({
          ...prev,
          slowOperations: [...prev.slowOperations.slice(-9), slowOp], // Keep last 10
          averageResponseTime: (prev.averageResponseTime + duration) / 2
        }));
        
        addError(
          new Error(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`),
          { 
            operation: name, 
            duration, 
            threshold,
            type: 'performance'
          }
        );
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      addError(
        error instanceof Error ? error : new Error(String(error)),
        { 
          operation: name, 
          duration,
          type: 'operation-failure'
        }
      );
      
      throw error;
    }
  }, [addError]);

  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const usedMemory = memory?.usedJSHeapSize ? memory.usedJSHeapSize / 1024 / 1024 : 0; // Convert to MB
      
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: usedMemory
      }));
      
      // Alert if memory usage is high
      if (usedMemory > 100) { // 100MB threshold
        addError(
          new Error(`High memory usage detected: ${usedMemory.toFixed(2)}MB`),
          { 
            memoryUsage: usedMemory,
            type: 'memory'
          }
        );
      }
    }
  }, [addError]);

  // Track memory usage periodically
  useEffect(() => {
    const interval = setInterval(trackMemoryUsage, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [trackMemoryUsage]);

  return {
    ...performanceMetrics,
    trackOperation,
    trackMemoryUsage
  };
}