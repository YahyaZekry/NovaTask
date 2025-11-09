import { useCallback, useEffect } from 'react';
import { hapticFeedback, HapticPattern } from '@/utils/haptic-feedback';

export function useHapticFeedback() {
  // Check if haptic feedback is supported
  const isSupported = hapticFeedback.isHapticSupported();

  // Light feedback for subtle interactions
  const light = useCallback(() => {
    if (isSupported) {
      hapticFeedback.light();
    }
  }, [isSupported]);

  // Medium feedback for standard interactions
  const medium = useCallback(() => {
    if (isSupported) {
      hapticFeedback.medium();
    }
  }, [isSupported]);

  // Heavy feedback for important interactions
  const heavy = useCallback(() => {
    if (isSupported) {
      hapticFeedback.heavy();
    }
  }, [isSupported]);

  // Success feedback pattern
  const success = useCallback(() => {
    if (isSupported) {
      hapticFeedback.success();
    }
  }, [isSupported]);

  // Error feedback pattern
  const error = useCallback(() => {
    if (isSupported) {
      hapticFeedback.error();
    }
  }, [isSupported]);

  // Warning feedback pattern
  const warning = useCallback(() => {
    if (isSupported) {
      hapticFeedback.warning();
    }
  }, [isSupported]);

  // Selection feedback for list items
  const selection = useCallback(() => {
    if (isSupported) {
      hapticFeedback.selection();
    }
  }, [isSupported]);

  // Impact feedback for button presses
  const impact = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (isSupported) {
      hapticFeedback.impact(intensity);
    }
  }, [isSupported]);

  // Notification feedback
  const notification = useCallback((type: 'success' | 'warning' | 'error') => {
    if (isSupported) {
      hapticFeedback.notification(type);
    }
  }, [isSupported]);

  // Custom pattern feedback
  const custom = useCallback((pattern: HapticPattern[]) => {
    if (isSupported) {
      hapticFeedback.custom(pattern);
    }
  }, [isSupported]);

  // Stop any ongoing vibration
  const stop = useCallback(() => {
    if (isSupported) {
      hapticFeedback.stop();
    }
  }, [isSupported]);

  // Enable or disable haptic feedback
  const setEnabled = useCallback((enabled: boolean) => {
    hapticFeedback.setEnabled(enabled);
  }, []);

  return {
    isSupported,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    impact,
    notification,
    custom,
    stop,
    setEnabled
  };
}

// Hook for automatic haptic feedback on touch events
export function useTouchHaptic(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection' = 'medium',
  condition: boolean = true
) {
  const { isSupported, ...hapticMethods } = useHapticFeedback();

  const triggerHaptic = useCallback(() => {
    if (!condition || !isSupported) return;
    
    switch (type) {
      case 'light':
        hapticMethods.light();
        break;
      case 'medium':
        hapticMethods.medium();
        break;
      case 'heavy':
        hapticMethods.heavy();
        break;
      case 'success':
        hapticMethods.success();
        break;
      case 'error':
        hapticMethods.error();
        break;
      case 'warning':
        hapticMethods.warning();
        break;
      case 'selection':
        hapticMethods.selection();
        break;
    }
  }, [type, condition, isSupported, hapticMethods]);

  return {
    triggerHaptic,
    isSupported
  };
}

// Hook for haptic feedback on form interactions
export function useFormHaptic() {
  const { isSupported, light, medium, success, error, warning } = useHapticFeedback();

  const fieldFocus = useCallback(() => {
    if (isSupported) light();
  }, [isSupported, light]);

  const fieldChange = useCallback(() => {
    if (isSupported) light();
  }, [isSupported, light]);

  const formSubmit = useCallback(() => {
    if (isSupported) success();
  }, [isSupported, success]);

  const formError = useCallback(() => {
    if (isSupported) error();
  }, [isSupported, error]);

  const formWarning = useCallback(() => {
    if (isSupported) warning();
  }, [isSupported, warning]);

  return {
    isSupported,
    fieldFocus,
    fieldChange,
    formSubmit,
    formError,
    formWarning
  };
}

// Hook for haptic feedback on navigation
export function useNavigationHaptic() {
  const { isSupported, light, medium, heavy } = useHapticFeedback();

  const tabSwitch = useCallback(() => {
    if (isSupported) light();
  }, [isSupported, light]);

  const pageTransition = useCallback(() => {
    if (isSupported) medium();
  }, [isSupported, medium]);

  const modalOpen = useCallback(() => {
    if (isSupported) medium();
  }, [isSupported, medium]);

  const modalClose = useCallback(() => {
    if (isSupported) light();
  }, [isSupported, light]);

  const drawerOpen = useCallback(() => {
    if (isSupported) medium();
  }, [isSupported, medium]);

  const drawerClose = useCallback(() => {
    if (isSupported) light();
  }, [isSupported, light]);

  return {
    isSupported,
    tabSwitch,
    pageTransition,
    modalOpen,
    modalClose,
    drawerOpen,
    drawerClose
  };
}