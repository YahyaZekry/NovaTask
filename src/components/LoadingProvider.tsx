"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  type: "full" | "partial" | "inline";
}

interface LoadingContextType {
  loading: LoadingState;
  setLoading: (loading: Partial<LoadingState>) => void;
  startLoading: (message?: string, type?: LoadingState["type"]) => void;
  stopLoading: () => void;
  setProgress: (progress: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loading, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    type: "full"
  });

  const setLoading = (newLoading: Partial<LoadingState>) => {
    setLoadingState(prev => ({ ...prev, ...newLoading }));
  };

  const startLoading = (message?: string, type: LoadingState["type"] = "full") => {
    setLoadingState({
      isLoading: true,
      message,
      type,
      progress: undefined
    });
  };

  const stopLoading = () => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined,
      type: "full"
    });
  };

  const setProgress = (progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  };

  return (
    <LoadingContext.Provider value={{ loading, setLoading, startLoading, stopLoading, setProgress }}>
      {children}
      <LoadingOverlay />
    </LoadingContext.Provider>
  );
}

function LoadingOverlay() {
  const { loading } = useLoading();

  if (!loading.isLoading) return null;

  return (
    <>
      {loading.type === "full" && <FullScreenLoader message={loading.message} progress={loading.progress} />}
      {loading.type === "partial" && <PartialLoader message={loading.message} progress={loading.progress} />}
      {loading.type === "inline" && <InlineLoader message={loading.message} progress={loading.progress} />}
    </>
  );
}

interface LoaderProps {
  message?: string;
  progress?: number;
}

function FullScreenLoader({ message, progress }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="status" aria-live="polite">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-overlay" aria-hidden="true" />
      
      {/* Loading Content */}
      <div className="relative glass-desktop border border-white/20 rounded-2xl p-8 max-w-sm w-full mx-4 card-hover-enhanced micro-interaction">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="relative w-16 h-16" aria-hidden="true">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          {/* Message */}
          {message && (
            <p className="text-white text-center text-sm font-medium">
              {message}
            </p>
          )}
          
          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Loading</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Loading progress: ${Math.round(progress)}%`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PartialLoader({ message, progress }: LoaderProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-4" role="status" aria-live="polite">
      <div className="glass-desktop border border-white/20 rounded-full px-6 py-3 flex items-center space-x-3 card-hover-enhanced micro-interaction">
        {/* Spinner */}
        <div className="relative w-5 h-5" aria-hidden="true">
          <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Message */}
        {message && (
          <p className="text-white text-sm font-medium">
            {message}
          </p>
        )}
        
        {/* Progress */}
        {progress !== undefined && (
          <span className="text-white/60 text-sm" aria-label={`Loading progress: ${Math.round(progress)}%`}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
}

function InlineLoader({ message, progress }: LoaderProps) {
  return (
    <div className="flex items-center space-x-3 p-4" role="status" aria-live="polite">
      {/* Spinner */}
      <div className="relative w-5 h-5" aria-hidden="true">
        <div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      {/* Message */}
      {message && (
        <p className="text-white/80 text-sm">
          {message}
        </p>
      )}
      
      {/* Progress */}
      {progress !== undefined && (
        <div className="flex-1 max-w-xs">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Loading progress: ${Math.round(progress)}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton loader components for different content types
export function SkeletonLoader({ type = "default", className = "" }: { type?: "default" | "todo" | "stats" | "form"; className?: string }) {
  const baseClass = "animate-pulse skeleton-shimmer loading-enhanced micro-interaction";
  
  switch (type) {
    case "todo":
      return (
        <div className={`${baseClass} glass-desktop rounded-xl p-4 ${className} card-hover-enhanced`} role="status" aria-label="Loading todo item">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white/20" aria-hidden="true"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded w-3/4" aria-hidden="true"></div>
              <div className="h-3 bg-white/20 rounded w-1/2" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      );
      
    case "stats":
      return (
        <div className={`${baseClass} glass-desktop rounded-xl p-4 ${className} card-hover-enhanced`} role="status" aria-label="Loading statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="text-center">
                <div className="h-8 bg-white/20 rounded w-12 mx-auto mb-2" aria-hidden="true"></div>
                <div className="h-3 bg-white/20 rounded w-16 mx-auto" aria-hidden="true"></div>
              </div>
            ))}
          </div>
        </div>
      );
      
    case "form":
      return (
        <div className={`${baseClass} glass-desktop rounded-2xl p-6 ${className} card-hover-enhanced`} role="status" aria-label="Loading form">
          <div className="space-y-4">
            <div className="h-6 bg-white/20 rounded w-1/3" aria-hidden="true"></div>
            <div className="h-10 bg-white/20 rounded" aria-hidden="true"></div>
            <div className="h-10 bg-white/20 rounded" aria-hidden="true"></div>
            <div className="h-10 bg-white/20 rounded" aria-hidden="true"></div>
            <div className="h-10 bg-white/20 rounded w-1/2" aria-hidden="true"></div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className={`${baseClass} bg-white/10 rounded ${className}`} role="status" aria-label="Loading content">
          <div className="h-4 bg-white/20 rounded" aria-hidden="true"></div>
        </div>
      );
  }
}

// Hook for async operations with loading states
export function useAsyncOperation() {
  const { startLoading, stopLoading, setProgress } = useLoading();

  const execute = async <T,>(
    operation: (progressCallback?: (progress: number) => void) => Promise<T>,
    message?: string,
    type: LoadingState["type"] = "full"
  ): Promise<T> => {
    try {
      startLoading(message, type);
      
      const result = await operation((progress) => {
        setProgress(progress);
      });
      
      return result;
    } finally {
      stopLoading();
    }
  };

  return { execute };
}

// Component for wrapping async operations
export function AsyncOperation({
  operation,
  message,
  type,
  children,
  fallback
}: {
  operation: () => Promise<any>;
  message?: string;
  type?: LoadingState["type"];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { loading } = useLoading();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const runOperation = async () => {
      try {
        const result = await operation();
        setData(result);
      } catch (err) {
        setError(err as Error);
      }
    };

    runOperation();
  }, [operation]);

  if (error) {
    return fallback || <div>Error: {error.message}</div>;
  }

  if (loading.isLoading && loading.type === type) {
    return <SkeletonLoader type="default" />;
  }

  return <>{children}</>;
}