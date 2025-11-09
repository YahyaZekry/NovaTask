"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  resistance?: number;
  hapticFeedback?: boolean;
}

interface PullState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  shouldRefresh: boolean;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    resistance = 2.5,
    hapticFeedback = true
  } = options;

  const [pullState, setPullState] = useState<PullState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    shouldRefresh: false
  });

  const elementRef = useRef<HTMLElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  const triggerHapticFeedback = useCallback((type: "light" | "medium" | "heavy" = "light") => {
    if (!hapticFeedback) return;
    
    // Simulate haptic feedback using vibration API if available
    if ("vibrate" in navigator) {
      const vibrationPattern = {
        light: 10,
        medium: 25,
        heavy: 50
      };
      navigator.vibrate(vibrationPattern[type]);
    }
  }, [hapticFeedback]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only allow pull-to-refresh when at the top of the scrollable element
    const element = elementRef.current;
    if (!element) return;
    
    // Check if we're at the top of the scrollable content
    if (element.scrollTop > 0) return;
    
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    
    setPullState(prev => ({
      ...prev,
      isPulling: true,
      pullDistance: 0,
      shouldRefresh: false
    }));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullState.isPulling) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;
    
    // Only allow pulling down (negative deltaY)
    if (deltaY <= 0) return;
    
    // Apply resistance to make the pull feel more natural
    const resistedDistance = Math.pow(deltaY, resistance) / Math.pow(maxPullDistance, resistance - 1);
    const clampedDistance = Math.min(resistedDistance, maxPullDistance);
    
    currentYRef.current = touch.clientY;
    
    const shouldRefresh = clampedDistance >= threshold;
    
    // Trigger haptic feedback when crossing the threshold
    if (shouldRefresh !== pullState.shouldRefresh) {
      triggerHapticFeedback("medium");
    }
    
    setPullState(prev => ({
      ...prev,
      pullDistance: clampedDistance,
      shouldRefresh
    }));
    
    // Prevent default to avoid page scroll
    e.preventDefault();
  }, [pullState.isPulling, pullState.shouldRefresh, threshold, maxPullDistance, resistance, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullState.isPulling) return;
    
    if (pullState.shouldRefresh && !pullState.isRefreshing) {
      // Trigger refresh
      setPullState(prev => ({
        ...prev,
        isRefreshing: true,
        shouldRefresh: false
      }));
      
      triggerHapticFeedback("heavy");
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error during refresh:", error);
      } finally {
        // Reset state after refresh
        setPullState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          shouldRefresh: false
        });
      }
    } else {
      // Reset state without refreshing
      setPullState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        shouldRefresh: false
      });
    }
    
    startYRef.current = 0;
    currentYRef.current = 0;
  }, [pullState.isPulling, pullState.shouldRefresh, pullState.isRefreshing, onRefresh, triggerHapticFeedback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: false });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate progress for visual feedback (0 to 1)
  const progress = pullState.isPulling 
    ? Math.min(pullState.pullDistance / threshold, 1) 
    : 0;

  // Calculate rotation for the refresh indicator
  const rotation = pullState.isPulling 
    ? Math.min(pullState.pullDistance / threshold, 1) * 360 
    : 0;

  return {
    elementRef,
    isPulling: pullState.isPulling,
    isRefreshing: pullState.isRefreshing,
    pullDistance: pullState.pullDistance,
    progress,
    rotation,
    shouldRefresh: pullState.shouldRefresh
  };
}