"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  preventDefault?: boolean;
  hapticFeedback?: boolean;
}

interface SwipeState {
  isSwiping: boolean;
  startX: number;
  currentX: number;
  direction: "left" | "right" | null;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    preventDefault = true,
    hapticFeedback = true
  } = options;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    startX: 0,
    currentX: 0,
    direction: null
  });

  const elementRef = useRef<HTMLElement>(null);
  const startTimeRef = useRef<number>(0);

  const triggerHapticFeedback = useCallback(() => {
    if (!hapticFeedback) return;
    
    // Simulate haptic feedback using vibration API if available
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    startTimeRef.current = Date.now();
    
    setSwipeState({
      isSwiping: true,
      startX: touch.clientX,
      currentX: touch.clientX,
      direction: null
    });
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping || preventDefault) {
      if (preventDefault) e.preventDefault();
    }
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      direction: deltaX > 0 ? "right" : "left"
    }));
  }, [swipeState.isSwiping, swipeState.startX, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping) return;
    
    if (preventDefault) {
      e.preventDefault();
    }
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Check if swipe meets threshold or has sufficient velocity
    const isSwipe = Math.abs(deltaX) > threshold || (Math.abs(deltaX) > 20 && velocity > 0.3);
    
    if (isSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        triggerHapticFeedback();
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        triggerHapticFeedback();
        onSwipeLeft();
      }
    }
    
    setSwipeState({
      isSwiping: false,
      startX: 0,
      currentX: 0,
      direction: null
    });
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, preventDefault, triggerHapticFeedback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: !preventDefault });
    element.addEventListener("touchmove", handleTouchMove, { passive: !preventDefault });
    element.addEventListener("touchend", handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  // Calculate swipe progress for visual feedback
  const swipeProgress = swipeState.isSwiping 
    ? Math.abs(swipeState.currentX - swipeState.startX) / threshold 
    : 0;

  // Cap progress at 1 for visual feedback
  const cappedProgress = Math.min(swipeProgress, 1);

  return {
    elementRef,
    isSwiping: swipeState.isSwiping,
    swipeDirection: swipeState.direction,
    swipeProgress: cappedProgress,
    translateX: swipeState.isSwiping ? swipeState.currentX - swipeState.startX : 0
  };
}