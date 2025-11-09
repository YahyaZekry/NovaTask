/**
 * Haptic feedback utilities for touch devices
 * Provides vibration feedback for user interactions
 */

export interface HapticPattern {
  duration: number;
  intensity?: number;
  pause?: number;
}

export class HapticFeedback {
  private static instance: HapticFeedback;
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  private constructor() {
    this.checkSupport();
  }

  static getInstance(): HapticFeedback {
    if (!HapticFeedback.instance) {
      HapticFeedback.instance = new HapticFeedback();
    }
    return HapticFeedback.instance;
  }

  private checkSupport(): void {
    // Check for Vibration API support
    this.isSupported = 'vibrate' in navigator;
    
    // Check for iOS haptic feedback support
    if ('vibrate' in navigator) {
      this.isSupported = true;
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptic feedback is supported
   */
  isHapticSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Simple vibration for a single duration
   */
  vibrate(duration: number): void {
    if (!this.isEnabled || !this.isSupported) return;

    try {
      navigator.vibrate(duration);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Vibrate with a pattern of durations
   */
  vibratePattern(pattern: number[]): void {
    if (!this.isEnabled || !this.isSupported) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic pattern failed:', error);
    }
  }

  /**
   * Light feedback for subtle interactions
   */
  light(): void {
    this.vibrate(10);
  }

  /**
   * Medium feedback for standard interactions
   */
  medium(): void {
    this.vibrate(25);
  }

  /**
   * Heavy feedback for important interactions
   */
  heavy(): void {
    this.vibrate(50);
  }

  /**
   * Success feedback pattern
   */
  success(): void {
    this.vibratePattern([10, 50, 10]);
  }

  /**
   * Error feedback pattern
   */
  error(): void {
    this.vibratePattern([50, 30, 50, 30, 50]);
  }

  /**
   * Warning feedback pattern
   */
  warning(): void {
    this.vibratePattern([30, 20, 30]);
  }

  /**
   * Selection feedback for list items
   */
  selection(): void {
    this.vibrate(15);
  }

  /**
   * Impact feedback for button presses
   */
  impact(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
    const durations = {
      light: 10,
      medium: 25,
      heavy: 50
    };
    this.vibrate(durations[intensity]);
  }

  /**
   * Notification feedback
   */
  notification(type: 'success' | 'warning' | 'error'): void {
    switch (type) {
      case 'success':
        this.success();
        break;
      case 'warning':
        this.warning();
        break;
      case 'error':
        this.error();
        break;
    }
  }

  /**
   * Custom pattern feedback
   */
  custom(pattern: HapticPattern[]): void {
    const vibrationPattern: number[] = [];
    
    pattern.forEach((item, index) => {
      vibrationPattern.push(item.duration);
      if (item.pause && index < pattern.length - 1) {
        vibrationPattern.push(item.pause);
      }
    });

    this.vibratePattern(vibrationPattern);
  }

  /**
   * Stop any ongoing vibration
   */
  stop(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }
}

// Export singleton instance
export const hapticFeedback = HapticFeedback.getInstance();

// React hook for haptic feedback
export function useHapticFeedback() {
  return {
    isSupported: hapticFeedback.isHapticSupported(),
    light: () => hapticFeedback.light(),
    medium: () => hapticFeedback.medium(),
    heavy: () => hapticFeedback.heavy(),
    success: () => hapticFeedback.success(),
    error: () => hapticFeedback.error(),
    warning: () => hapticFeedback.warning(),
    selection: () => hapticFeedback.selection(),
    impact: (intensity?: 'light' | 'medium' | 'heavy') => hapticFeedback.impact(intensity),
    notification: (type: 'success' | 'warning' | 'error') => hapticFeedback.notification(type),
    custom: (pattern: HapticPattern[]) => hapticFeedback.custom(pattern),
    stop: () => hapticFeedback.stop(),
    setEnabled: (enabled: boolean) => hapticFeedback.setEnabled(enabled)
  };
}

// CSS class for haptic feedback integration
export const HAPTIC_CLASSES = {
  'haptic-light': 'data-haptic="light"',
  'haptic-medium': 'data-haptic="medium"',
  'haptic-heavy': 'data-haptic="heavy"',
  'haptic-success': 'data-haptic="success"',
  'haptic-error': 'data-haptic="error"',
  'haptic-warning': 'data-haptic="warning"',
  'haptic-selection': 'data-haptic="selection"'
} as const;

// Initialize haptic feedback for touch devices
if (typeof window !== 'undefined') {
  // Add global event listener for haptic feedback
  document.addEventListener('touchstart', (event) => {
    const target = event.target as HTMLElement;
    const hapticType = target.getAttribute('data-haptic');
    
    if (hapticType) {
      switch (hapticType) {
        case 'light':
          hapticFeedback.light();
          break;
        case 'medium':
          hapticFeedback.medium();
          break;
        case 'heavy':
          hapticFeedback.heavy();
          break;
        case 'success':
          hapticFeedback.success();
          break;
        case 'error':
          hapticFeedback.error();
          break;
        case 'warning':
          hapticFeedback.warning();
          break;
        case 'selection':
          hapticFeedback.selection();
          break;
      }
    }
  }, { passive: true });
}