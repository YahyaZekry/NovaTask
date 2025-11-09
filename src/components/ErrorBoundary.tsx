"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { useToast } from "./ToastNotification";
import { AppError, classifyError, ErrorType, ErrorSeverity, formatErrorForDisplay } from "@/utils/error-handling";
import { useError } from "@/contexts/ErrorContext";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackComponent?: React.ComponentType<{ error: AppError; errorInfo: ErrorInfo; retry: () => void }>;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showErrorDetails?: boolean;
  logErrors?: boolean;
  context?: Record<string, unknown>;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = classifyError(error);
    return {
      hasError: true,
      error: appError,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = classifyError(error, {
      component: 'ErrorBoundary',
      ...this.props.context
    });

    this.setState({
      error: appError,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Add to global error context
    const { addError } = this.context as { addError: (error: Error | string, context?: Record<string, unknown>) => AppError };
    if (addError && this.props.logErrors !== false) {
      addError(appError.originalError || new Error(appError.message));
    }

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(appError, errorInfo);
    }
  }

  reportError = (error: AppError, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to a service like Sentry, LogRocket, etc.
    try {
      // Example: Send to error reporting service
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch (e) {
      // Silently fail if error reporting fails
    }
  };

  handleRetry = async () => {
    const { enableRetry = true, maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (!enableRetry || retryCount >= maxRetries) {
      return;
    }

    this.setState({
      isRetrying: true,
      retryCount: retryCount + 1
    });

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Custom fallback component
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo!}
            retry={this.handleRetry}
          />
        );
      }

      return <ErrorFallback
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onRetry={this.handleRetry}
        retryCount={this.state.retryCount}
        maxRetries={this.props.maxRetries}
        enableRetry={this.props.enableRetry}
        showErrorDetails={this.props.showErrorDetails}
        isRetrying={this.state.isRetrying}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
  enableRetry?: boolean;
  showErrorDetails?: boolean;
  isRetrying?: boolean;
}

function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  enableRetry = true,
  showErrorDetails = false,
  isRetrying = false
}: ErrorFallbackProps) {
  const { addToast } = useToast();

  const handleReportError = () => {
    // Copy error details to clipboard
    const errorDetails = `
Error: ${error?.message}
Type: ${error?.type}
Severity: ${error?.severity}
Retryable: ${error?.retryable}
User Message: ${error?.userMessage}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      addToast({
        message: "Error details copied to clipboard",
        type: "success"
      });
    }).catch(() => {
      addToast({
        message: "Failed to copy error details",
        type: "error"
      });
    });
  };

  const errorDisplay = formatErrorForDisplay(error!);

  const canRetry = enableRetry && error?.retryable && retryCount < maxRetries;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-desktop border border-red-500/30 rounded-2xl p-6 max-w-lg w-full card-hover-enhanced micro-interaction">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse-once">
            <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="text-xl font-semibold text-white mb-2">
            {errorDisplay.title}
          </h2>

          {/* Error Message */}
          <p className="text-red-200 mb-6 text-sm">
            {errorDisplay.message}
          </p>

          {/* Retry Count */}
          {retryCount > 0 && (
            <p className="text-yellow-300 text-sm mb-4 animate-pulse">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="px-4 py-2 bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg touch-target button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
                aria-describedby={retryCount > 0 ? 'retry-count' : undefined}
              >
                {isRetrying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                    <span>Retrying...</span>
                  </div>
                ) : (
                  <span>Try Again</span>
                )}
              </button>
            )}
            
            <button
              onClick={handleReportError}
              className="px-4 py-2 bg-white/10 text-white rounded-lg touch-target button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
              aria-label="Copy error details to clipboard"
            >
              Copy Error Details
            </button>
          </div>

          {/* Error Details */}
          {(showErrorDetails || process.env.NODE_ENV === 'development') && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-white/70 hover:text-white transition-colors focus-enhanced keyboard-enhanced outline-none">
                Error Details
              </summary>
              <div className="mt-3 p-3 bg-black/30 rounded-lg overflow-x-auto">
                <div className="space-y-2">
                  <div>
                    <span className="text-purple-300 font-semibold">Type:</span>
                    <span className="text-white ml-2">{error?.type}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-semibold">Severity:</span>
                    <span className="text-white ml-2">{error?.severity}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-semibold">Retryable:</span>
                    <span className="text-white ml-2">{error?.retryable ? 'Yes' : 'No'}</span>
                  </div>
                  {error?.stack && (
                    <div>
                      <span className="text-purple-300 font-semibold">Stack:</span>
                      <pre className="text-xs text-red-300 whitespace-pre-wrap mt-1">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <span className="text-purple-300 font-semibold">Component Stack:</span>
                      <pre className="text-xs text-yellow-300 whitespace-pre-wrap mt-1">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Help Text */}
          <p className="text-white/60 text-sm mt-6">
            If this problem persists, please refresh the page or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for functional components to use ErrorBoundary
export function useErrorHandler() {
  const { addToast } = useToast();

  const handleError = (error: Error, context?: string) => {
    console.error('Error caught by useErrorHandler:', error, context);
    
    addToast({
      message: `${context ? `${context}: ` : ''}${error.message}`,
      type: "error",
      duration: 5000
    });

    // Report error in production
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {
          // Silently fail if error reporting fails
        });
      } catch (e) {
        // Silently fail if error reporting fails
      }
    }
  };

  return { handleError };
}

// Higher-order component for wrapping components with ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    fallbackComponent?: React.ComponentType<{ error: AppError; errorInfo: ErrorInfo; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    enableRetry?: boolean;
    maxRetries?: number;
    showErrorDetails?: boolean;
    logErrors?: boolean;
  }
) {
  const {
    fallback,
    fallbackComponent,
    onError,
    enableRetry,
    maxRetries,
    showErrorDetails,
    logErrors
  } = options || {};

  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={fallback}
      fallbackComponent={fallbackComponent}
      onError={onError}
      enableRetry={enableRetry}
      maxRetries={maxRetries}
      showErrorDetails={showErrorDetails}
      logErrors={logErrors}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}