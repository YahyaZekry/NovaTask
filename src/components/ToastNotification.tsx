"use client";

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import { useLiveRegion } from "@/hooks/useAccessibility";
import { ariaUtils } from "@/utils/accessibility";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  persistent?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  category?: "network" | "validation" | "system" | "permission" | "timeout" | "quota" | "parse" | "authentication" | "unknown";
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { announce } = useLiveRegion();
  
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Announce toast to screen readers
    announce(`${toast.type}: ${toast.message}`, toast.type === 'error' ? 'assertive' : 'polite');
    
    // Auto-remove toast after duration (default 3 seconds)
    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 3000);
    }
  }, [announce]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, updateToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { removeToast, updateToast } = useToast();
  const { announce } = useLiveRegion();
  
  // Generate unique ID for this toast
  const toastId = ariaUtils.generateId(`toast-${toast.type}`);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    announce(`Toast dismissed: ${toast.message}`, 'polite');
    setTimeout(() => {
      removeToast(toast.id);
    }, 300); // Match exit animation duration
  }, [removeToast, announce, toast.message]);

  const handleRetry = useCallback(async () => {
    if (!toast.retryable || !toast.onRetry) return;
    
    setIsRetrying(true);
    updateToast(toast.id, {
      message: `Retrying... ${toast.message}`,
      type: 'info'
    });
    
    try {
      await toast.onRetry();
      // Success - remove toast
      removeToast(toast.id);
    } catch (error) {
      // Failed - update with error message
      updateToast(toast.id, {
        message: `Retry failed: ${toast.message}`,
        type: 'error'
      });
    } finally {
      setIsRetrying(false);
    }
  }, [toast.retryable, toast.onRetry, updateToast, removeToast, toast.message]);

  const handleAction = useCallback(async (action: { action: () => void; label: string }) => {
    try {
      await action.action();
      // Remove toast after successful action
      removeToast(toast.id);
    } catch (error) {
      // Update toast with error message
      updateToast(toast.id, {
        message: `Action failed: ${action.label}`,
        type: 'error'
      });
    }
  }, [updateToast, removeToast]);

  const getToastStyles = () => {
    const baseStyles = "glass-desktop border p-4 rounded-lg shadow-lg transition-all duration-300 transform pointer-events-auto hover-enhanced micro-interaction";
    
    const typeStyles = {
      success: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20",
      error: "border-red-500/50 bg-red-500/10 hover:bg-red-500/20",
      warning: "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20",
      info: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20"
    };

    const severityStyles = {
      low: "border-l-2 border-l-green-400",
      medium: "border-l-2 border-l-yellow-400",
      high: "border-l-2 border-l-orange-400",
      critical: "border-l-2 border-l-red-400"
    };

    const animationStyles = `
      ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      ${isExiting ? "translate-x-full opacity-0" : ""}
    `;

    return `${baseStyles} ${typeStyles[toast.type]} ${toast.severity ? severityStyles[toast.severity] : ''} ${animationStyles}`;
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (toast.type) {
      case "success":
        return (
          <svg className={`${iconClass} text-green-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "error":
        return (
          <svg className={`${iconClass} text-red-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L11.414 10l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "warning":
        return (
          <svg className={`${iconClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "info":
        return (
          <svg className={`${iconClass} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 000 2v3a1 1 0 002 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-labelledby={`${toastId}-message`}
      id={toastId}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !toast.persistent) {
          handleRemove();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="animate-pulse-once">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p
            id={`${toastId}-message`}
            className="text-white text-sm font-medium break-words"
          >
            {toast.message}
          </p>
          
          {/* Action buttons */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`text-xs px-2 py-1 rounded transition-all duration-200 focus-enhanced keyboard-enhanced ${
                    action.primary
                      ? 'bg-white/20 text-white hover:bg-white/30 button-hover-enhanced'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white button-hover-enhanced'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Retry button for retryable toasts */}
          {toast.retryable && toast.onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`mt-2 text-xs px-2 py-1 rounded transition-all duration-200 focus-enhanced keyboard-enhanced ${
                isRetrying
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30 button-hover-enhanced'
              }`}
              aria-label={`Retry: ${toast.message}`}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
        {!toast.persistent && (
          <button
            onClick={handleRemove}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1 rounded touch-target button-hover-enhanced focus-enhanced keyboard-enhanced"
            aria-label={`Dismiss ${toast.type} notification: ${toast.message}`}
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l4 4a1 1 0 011.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Progress bar for non-persistent toasts */}
      {!toast.persistent && (
        <div
          className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
          aria-hidden="true"
          aria-label="Notification progress indicator"
        >
          <div
            className="h-full bg-white/60 rounded-full transition-all ease-linear hover:bg-white/80"
            style={{
              width: "100%",
              animation: `shrink ${toast.duration || 3000}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

// Hook for programmatic toast access
export function useToastNotification() {
  const { addToast } = useToast();
  
  return {
    success: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => {
      addToast({ message, type: "success", severity: "low", ...options });
    },
    error: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => {
      addToast({ message, type: "error", severity: "high", ...options });
    },
    warning: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => {
      addToast({ message, type: "warning", severity: "medium", ...options });
    },
    info: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type">>) => {
      addToast({ message, type: "info", severity: "low", ...options });
    },
    network: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type" | "category">>) => {
      addToast({ message, type: "error", category: "network", severity: "high", retryable: true, ...options });
    },
    validation: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type" | "category">>) => {
      addToast({ message, type: "error", category: "validation", severity: "medium", ...options });
    },
    system: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "type" | "category">>) => {
      addToast({ message, type: "error", category: "system", severity: "critical", ...options });
    },
    withActions: (message: string, actions: Array<{ label: string; action: () => void; primary?: boolean }>, options?: Partial<Omit<Toast, "id" | "message" | "actions">>) => {
      addToast({ message, type: "info", actions, severity: "medium", ...options });
    }
  };
}
