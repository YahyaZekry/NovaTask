"use client";

import { forwardRef } from "react";

interface SkeletonLoaderProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animation?: "pulse" | "wave" | "shimmer";
  rounded?: boolean;
}

export const SkeletonLoader = forwardRef<HTMLDivElement, SkeletonLoaderProps>(
  ({ 
    variant = "text", 
    width, 
    height, 
    lines = 1, 
    className = "", 
    animation = "shimmer",
    rounded = false
  }, ref) => {
    const baseClasses = `
      glass-desktop relative overflow-hidden loading-enhanced micro-interaction
      ${animation === "pulse" ? "animate-pulse" : ""}
      ${animation === "shimmer" ? "skeleton-shimmer" : ""}
      ${animation === "wave" ? "skeleton-wave" : ""}
      ${rounded ? "rounded-full" : "rounded-lg"}
      ${className}
    `;

    const style: React.CSSProperties = {
      width: width || (variant === "text" ? "100%" : "40px"),
      height: height || (variant === "text" ? "1rem" : "40px"),
    };

    if (variant === "text" && lines > 1) {
      return (
        <div ref={ref} className={`space-y-2 ${className} performance-optimized`} role="status" aria-label="Loading content">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`
                ${baseClasses}
                ${index === lines - 1 ? "w-3/4" : "w-full"}
              `}
              style={{
                height: height || "1rem",
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={style}
        role="status"
        aria-label="Loading content"
      >
        {animation === "shimmer" && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
      </div>
    );
  }
);

SkeletonLoader.displayName = "SkeletonLoader";

// Predefined skeleton components for common use cases
export const TodoSkeleton = () => (
  <div className="glass-desktop rounded-xl border border-white/20 p-4 space-y-3 card-hover-enhanced micro-interaction" role="status" aria-label="Loading todo item">
    <div className="flex items-start gap-3">
      <SkeletonLoader variant="circular" width={24} height={24} />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" height={20} />
        <div className="flex gap-2">
          <SkeletonLoader variant="rectangular" width={80} height={24} rounded />
          <SkeletonLoader variant="rectangular" width={100} height={24} rounded />
        </div>
      </div>
    </div>
  </div>
);

export const TodoFormSkeleton = () => (
  <div className="glass-desktop p-6 space-y-4 card-hover-enhanced micro-interaction" role="status" aria-label="Loading todo form">
    <div className="space-y-2">
      <SkeletonLoader variant="text" width={120} height={16} />
      <SkeletonLoader variant="rectangular" height={48} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width={80} height={16} />
        <SkeletonLoader variant="rectangular" height={48} />
      </div>
      <div className="space-y-2">
        <SkeletonLoader variant="text" width={80} height={16} />
        <SkeletonLoader variant="rectangular" height={48} />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLoader variant="text" width={100} height={16} />
      <SkeletonLoader variant="rectangular" height={48} />
    </div>
    <SkeletonLoader variant="rectangular" height={48} />
  </div>
);

export const StatsSkeleton = () => (
  <div className="glass-desktop rounded-xl p-4 card-hover-enhanced micro-interaction" role="status" aria-label="Loading statistics">
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="text-center space-y-2">
          <SkeletonLoader variant="text" height={24} width={40} className="mx-auto" />
          <SkeletonLoader variant="text" height={16} width={60} className="mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const FilterSkeleton = () => (
  <div className="glass-desktop p-6 space-y-4 card-hover-enhanced micro-interaction" role="status" aria-label="Loading filters">
    <div className="space-y-2">
      <SkeletonLoader variant="text" width={120} height={16} />
      <SkeletonLoader variant="rectangular" height={48} />
    </div>
    <div className="space-y-2">
      <SkeletonLoader variant="text" width={120} height={16} />
      <SkeletonLoader variant="rectangular" height={48} />
    </div>
  </div>
);

// Loading state component for the entire todo list
export const TodoListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3" role="status" aria-label={`Loading ${count} todo items`}>
    {Array.from({ length: count }).map((_, index) => (
      <TodoSkeleton key={index} />
    ))}
  </div>
);

// Loading overlay component
export const LoadingOverlay = ({ 
  isVisible, 
  message = "Loading..." 
}: { 
  isVisible: boolean; 
  message?: string; 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 backdrop-overlay">
      <div className="glass-desktop rounded-xl p-6 max-w-sm mx-4 text-center card-hover-enhanced micro-interaction" role="status" aria-live="polite">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" aria-hidden="true"></div>
        </div>
        <p className="text-white text-responsive-base">{message}</p>
      </div>
    </div>
  );
};

// Pull-to-refresh skeleton
export const PullToRefreshSkeleton = ({ 
  progress, 
  isRefreshing 
}: { 
  progress: number; 
  isRefreshing: boolean; 
}) => (
  <div 
    className="h-16 flex items-center justify-center transition-all duration-300"
    style={{ 
      opacity: progress > 0 ? 1 : 0,
      transform: `translateY(${Math.min(progress * 20, 20)}px)`
    }}
  >
    <div className="flex items-center gap-2">
      <div 
        className={`
          w-6 h-6 border-2 border-white/30 rounded-full
          ${isRefreshing ? "border-t-purple-400 animate-spin" : ""}
        `}
        style={{ 
          transform: `rotate(${progress * 360}deg)`,
          borderTopColor: progress > 0.8 ? "#a855f7" : "rgba(255, 255, 255, 0.3)"
        }}
      />
      <span className="text-white/70 text-sm">
        {isRefreshing ? "Refreshing..." : progress > 0.8 ? "Release to refresh" : "Pull to refresh"}
      </span>
    </div>
  </div>
);