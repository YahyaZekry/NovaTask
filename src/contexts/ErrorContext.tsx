"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AppError, ErrorType, ErrorSeverity, classifyError, logError, RecoveryStrategies } from '@/utils/error-handling';

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Error | string, context?: Record<string, unknown>) => AppError;
  removeError: (id: string) => void;
  clearErrors: () => void;
  retryError: (id: string) => Promise<boolean>;
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  errorCount: number;
  getErrorsByType: (type: ErrorType) => AppError[];
  getErrorsBySeverity: (severity: ErrorSeverity) => AppError[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  enableAutoRecovery?: boolean;
}

export function ErrorProvider({ 
  children, 
  maxErrors = 50, 
  enableAutoRecovery = true 
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isRecovering, setIsRecovering] = useState<Set<string>>(new Set());

  // Load errors from localStorage on mount
  useEffect(() => {
    try {
      const savedErrors = localStorage.getItem('novatask-errors');
      if (savedErrors) {
        const parsedErrors = JSON.parse(savedErrors).map((error: AppError) => ({
          ...error,
          timestamp: new Date(error.timestamp)
        }));
        setErrors(parsedErrors.slice(0, maxErrors));
      }
    } catch {
      // Silently fail if we can't load errors
    }
  }, [maxErrors]);

  // Save errors to localStorage whenever they change
  useEffect(() => {
    if (errors.length > 0) {
      try {
        localStorage.setItem('novatask-errors', JSON.stringify(errors));
      } catch {
        // Silently fail if we can't save errors
      }
    }
  }, [errors]);

  // Auto-recovery for retryable errors
  useEffect(() => {
    if (!enableAutoRecovery) return;

    const retryableErrors = errors.filter(error => error.retryable && !isRecovering.has(error.id));
    
    retryableErrors.forEach(error => {
      // Don't auto-retry immediately, give user a chance to see the error
      const timer = setTimeout(() => {
        retryError(error.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [errors, enableAutoRecovery]);

  const addError = useCallback((error: Error | string, context?: Record<string, unknown>): AppError => {
    const appError = classifyError(error, context);
    
    setErrors(prevErrors => {
      const newErrors = [appError, ...prevErrors];
      // Keep only the most recent errors
      return newErrors.slice(0, maxErrors);
    });

    // Log the error
    logError(appError, context);

    return appError;
  }, [maxErrors]);

  const removeError = useCallback((id: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    try {
      localStorage.removeItem('novatask-errors');
    } catch {
      // Silently fail if we can't clear errors
    }
  }, []);

  const retryError = useCallback(async (id: string): Promise<boolean> => {
    const error = errors.find(e => e.id === id);
    if (!error || !error.retryable) return false;

    // Mark as recovering
    setIsRecovering(prev => new Set(prev).add(id));

    try {
      // Find applicable recovery strategy
      const strategy = RecoveryStrategies.find(s => s.canRecover(error));
      
      if (strategy) {
        const recovered = await strategy.recover(error);
        
        if (recovered) {
          removeError(id);
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    } finally {
      // Remove from recovering set
      setIsRecovering(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [errors, removeError]);

  const getErrorsByType = useCallback((type: ErrorType): AppError[] => {
    return errors.filter(error => error.type === type);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity: ErrorSeverity): AppError[] => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasCriticalErrors = errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  const errorCount = errors.length;

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    retryError,
    hasErrors,
    hasCriticalErrors,
    errorCount,
    getErrorsByType,
    getErrorsBySeverity
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Hook for error handling in components
export function useErrorHandler() {
  const { addError } = useError();

  const handleError = useCallback((error: Error | string, context?: Record<string, unknown>) => {
    return addError(error, context);
  }, [addError]);

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<unknown>,
    context?: Record<string, unknown>
  ): Promise<unknown> => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}

// Hook for error monitoring
export function useErrorMonitor() {
  const { errors, getErrorsByType, getErrorsBySeverity } = useError();

  const networkErrors = getErrorsByType(ErrorType.NETWORK);
  const validationErrors = getErrorsByType(ErrorType.VALIDATION);
  const systemErrors = getErrorsByType(ErrorType.SYSTEM);
  const criticalErrors = getErrorsBySeverity(ErrorSeverity.CRITICAL);
  const highSeverityErrors = getErrorsBySeverity(ErrorSeverity.HIGH);

  const errorStats = {
    total: errors.length,
    network: networkErrors.length,
    validation: validationErrors.length,
    system: systemErrors.length,
    critical: criticalErrors.length,
    high: highSeverityErrors.length
  };

  const recentErrors = errors.slice(0, 10);
  const errorRate = errors.length > 0 ? errors.filter(e => 
    Date.now() - e.timestamp.getTime() < 60000 // Last minute
  ).length : 0;

  return {
    errors,
    errorStats,
    recentErrors,
    errorRate,
    networkErrors,
    validationErrors,
    systemErrors,
    criticalErrors,
    highSeverityErrors
  };
}