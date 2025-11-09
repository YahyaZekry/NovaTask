// Error handling utilities for NovaTask application

// Error types for classification
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  SYSTEM = 'system',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  QUOTA = 'quota',
  PARSE = 'parse',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Standard error interface
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
  userMessage: string;
  technicalDetails?: string;
  stack?: string;
}

// Error context for additional information
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  additionalData?: Record<string, unknown>;
}

// Error classification utility
export function classifyError(error: Error | string, context?: ErrorContext): AppError {
  const id = crypto.randomUUID();
  const timestamp = new Date();
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  
  // Determine error type
  let type = ErrorType.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let retryable = false;
  
  // Network errors
  if (errorMessage.includes('fetch') || 
      errorMessage.includes('network') || 
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND')) {
    type = ErrorType.NETWORK;
    severity = ErrorSeverity.MEDIUM;
    retryable = true;
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('Timeout') ||
      errorMessage.includes('ABORT_ERR')) {
    type = ErrorType.TIMEOUT;
    severity = ErrorSeverity.MEDIUM;
    retryable = true;
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || 
      errorMessage.includes('required') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('format')) {
    type = ErrorType.VALIDATION;
    severity = ErrorSeverity.LOW;
    retryable = false;
  }
  
  // Permission errors
  if (errorMessage.includes('permission') || 
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')) {
    type = ErrorType.PERMISSION;
    severity = ErrorSeverity.HIGH;
    retryable = false;
  }
  
  // Quota errors
  if (errorMessage.includes('quota') || 
      errorMessage.includes('storage') ||
      errorMessage.includes('QuotaExceededError')) {
    type = ErrorType.QUOTA;
    severity = ErrorSeverity.HIGH;
    retryable = false;
  }
  
  // Parse errors
  if (errorMessage.includes('parse') || 
      errorMessage.includes('JSON') ||
      errorMessage.includes('SyntaxError')) {
    type = ErrorType.PARSE;
    severity = ErrorSeverity.MEDIUM;
    retryable = false;
  }
  
  // Authentication errors
  if (errorMessage.includes('authentication') || 
      errorMessage.includes('auth') ||
      errorMessage.includes('token')) {
    type = ErrorType.AUTHENTICATION;
    severity = ErrorSeverity.HIGH;
    retryable = false;
  }
  
  // System errors
  if (errorMessage.includes('system') || 
      errorMessage.includes('internal') ||
      errorMessage.includes('500') ||
      errorMessage.includes('Internal Server Error')) {
    type = ErrorType.SYSTEM;
    severity = ErrorSeverity.HIGH;
    retryable = true;
  }
  
  // Generate user-friendly message
  const userMessage = generateUserMessage(type, errorMessage);
  
  // Generate technical details
  const technicalDetails = typeof error === 'string' ? error : error.stack || error.message;
  
  return {
    id,
    type,
    severity,
    message: errorMessage,
    originalError: typeof error === 'string' ? new Error(errorMessage) : error,
    context: context as Record<string, unknown>,
    timestamp,
    retryable,
    userMessage,
    technicalDetails,
    stack
  };
}

// Generate user-friendly error messages
function generateUserMessage(type: ErrorType, originalMessage: string): string {
  switch (type) {
    case ErrorType.NETWORK:
      return "Connection issue. Please check your internet connection and try again.";
    case ErrorType.VALIDATION:
      return "Please check your input and try again.";
    case ErrorType.PERMISSION:
      return "You don't have permission to perform this action.";
    case ErrorType.TIMEOUT:
      return "The operation timed out. Please try again.";
    case ErrorType.QUOTA:
      return "Storage space is running low. Please clear some data and try again.";
    case ErrorType.PARSE:
      return "There was an issue processing the data. Please try again.";
    case ErrorType.AUTHENTICATION:
      return "Please sign in to continue.";
    case ErrorType.SYSTEM:
      return "A system error occurred. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

// Error message templates
export const ErrorMessages = {
  [ErrorType.NETWORK]: {
    title: "Connection Error",
    message: "Unable to connect to the server. Please check your internet connection.",
    actions: ["Retry", "Offline Mode"]
  },
  [ErrorType.VALIDATION]: {
    title: "Validation Error",
    message: "Please check your input and correct any errors.",
    actions: ["Fix Errors", "Reset Form"]
  },
  [ErrorType.PERMISSION]: {
    title: "Permission Denied",
    message: "You don't have permission to perform this action.",
    actions: ["Sign In", "Contact Support"]
  },
  [ErrorType.TIMEOUT]: {
    title: "Request Timeout",
    message: "The request took too long to complete. Please try again.",
    actions: ["Retry", "Increase Timeout"]
  },
  [ErrorType.QUOTA]: {
    title: "Storage Full",
    message: "Local storage is full. Please clear some data to continue.",
    actions: ["Clear Data", "Upgrade Storage"]
  },
  [ErrorType.PARSE]: {
    title: "Data Error",
    message: "There was an issue processing the data.",
    actions: ["Retry", "Report Issue"]
  },
  [ErrorType.AUTHENTICATION]: {
    title: "Authentication Required",
    message: "Please sign in to continue.",
    actions: ["Sign In", "Create Account"]
  },
  [ErrorType.SYSTEM]: {
    title: "System Error",
    message: "A system error occurred. Our team has been notified.",
    actions: ["Retry", "Contact Support"]
  },
  [ErrorType.UNKNOWN]: {
    title: "Unexpected Error",
    message: "An unexpected error occurred. Please try again.",
    actions: ["Retry", "Report Issue"]
  }
};

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<boolean>;
  description: string;
}

export const RecoveryStrategies: RecoveryStrategy[] = [
  {
    canRecover: (error) => error.type === ErrorType.NETWORK && error.retryable,
    recover: async (error) => {
      // Wait for connection to be restored
      await new Promise(resolve => setTimeout(resolve, 2000));
      return navigator.onLine;
    },
    description: "Waiting for connection to be restored"
  },
  {
    canRecover: (error) => error.type === ErrorType.QUOTA,
    recover: async (error) => {
      // Clear old data from localStorage
      const keys = Object.keys(localStorage);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const key of keys) {
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
            localStorage.removeItem(key);
          }
        }
      }
      
      return true;
    },
    description: "Clearing old data to free up space"
  },
  {
    canRecover: (error) => error.type === ErrorType.TIMEOUT,
    recover: async (error) => {
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    },
    description: "Retrying with extended timeout"
  }
];

// Error formatting utilities
export function formatErrorForDisplay(error: AppError): {
  title: string;
  message: string;
  actions: string[];
  severity: ErrorSeverity;
  canRetry: boolean;
} {
  const template = ErrorMessages[error.type];
  
  return {
    title: template.title,
    message: error.userMessage || template.message,
    actions: template.actions,
    severity: error.severity,
    canRetry: error.retryable
  };
}

// Error logging utilities
export function logError(error: AppError, additionalContext?: Record<string, unknown>) {
  const logEntry = {
    ...error,
    additionalContext,
    environment: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 ${error.type.toUpperCase()} Error: ${error.message}`);
    console.error('Error Details:', logEntry);
    console.error('Original Error:', error.originalError);
    console.groupEnd();
  }
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // This would integrate with services like Sentry, LogRocket, etc.
    reportErrorToService(logEntry);
  }
}

// Error reporting service (placeholder)
async function reportErrorToService(errorData: Record<string, unknown>) {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    });
  } catch {
    // Silently fail if error reporting fails
  }
}

// Error testing utilities
export function createTestError(type: ErrorType, message?: string): AppError {
  return classifyError(
    new Error(message || `Test ${type} error`),
    { component: 'TestComponent', action: 'test' }
  );
}

// Error boundary helpers
export function isReactError(error: unknown): error is Error {
  return error !== null && typeof error === 'object' && 'message' in error;
}

export function getErrorBoundaryInfo(error: Error, errorInfo: { componentStack?: string }): {
  error: AppError;
  componentStack: string;
} {
  const appError = classifyError(error, {
    component: 'ErrorBoundary',
    action: 'component-render'
  });
  
  return {
    error: appError,
    componentStack: errorInfo?.componentStack || ''
  };
}