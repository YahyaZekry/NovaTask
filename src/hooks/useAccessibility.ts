/**
 * Custom hooks for accessibility features
 * Provides reusable accessibility patterns for NovaTask components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { focusManagement, ariaUtils, keyboardNavigation } from '@/utils/accessibility';

// Hook for managing focus trap in modals and panels
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Store current focus element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Set up focus trap
      cleanupRef.current = focusManagement.trapFocus(containerRef.current);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Clean up focus trap
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previous element
      if (previousFocusRef.current && !isActive) {
        focusManagement.restoreFocus(previousFocusRef.current);
      }
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      document.body.style.overflow = '';
    };
  }, [isActive]);

  return containerRef;
}

// Hook for managing ARIA live regions
export function useLiveRegion() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ariaUtils.announce(message, priority);
    
    // Also update internal state for testing
    setAnnouncements(prev => [...prev, message]);
    
    // Clean up old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  }, []);

  return {
    announce,
    announcements,
    liveRegionRef
  };
}

// Hook for keyboard navigation in lists
export function useListNavigation(
  itemCount: number,
  orientation: 'vertical' | 'horizontal' = 'vertical',
  onSelect?: (index: number) => void
) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const newIndex = keyboardNavigation.handleListNavigation(
      event,
      selectedIndex,
      itemCount,
      orientation
    );

    if (newIndex !== null) {
      event.preventDefault();
      setSelectedIndex(newIndex);
      
      // Focus the new item
      const items = listRef.current?.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"]');
      if (items && items[newIndex]) {
        (items[newIndex] as HTMLElement).focus();
      }
    }

    // Handle activation
    if (keyboardNavigation.isActivationKey(event.key) && selectedIndex >= 0) {
      event.preventDefault();
      onSelect?.(selectedIndex);
    }
  }, [selectedIndex, itemCount, orientation, onSelect]);

  const selectItem = useCallback((index: number) => {
    setSelectedIndex(index);
    onSelect?.(index);
  }, [onSelect]);

  return {
    selectedIndex,
    setSelectedIndex: selectItem,
    handleKeyDown,
    listRef
  };
}

// Hook for managing ARIA attributes
export function useAria(attributes: Record<string, string>) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      ariaUtils.setAttributes(elementRef.current, attributes);
    }
  }, [attributes]);

  return elementRef;
}

// Hook for skip links
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState<Array<{id: string; text: string}>>([]);

  const addSkipLink = useCallback((id: string, text: string) => {
    setSkipLinks(prev => [...prev, { id, text }]);
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink
  };
}

// Hook for managing form accessibility
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getFieldProps = useCallback((fieldName: string, value: string) => {
    const error = errors[fieldName];
    const isTouched = touched[fieldName];
    const hasError = isTouched && !!error;

    return {
      id: `field-${fieldName}`,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `error-${fieldName}` : undefined,
      error: hasError ? error : undefined,
      onBlur: () => setTouched(prev => ({ ...prev, [fieldName]: true }))
    };
  }, [errors, touched]);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    getFieldProps,
    setFieldError,
    clearFieldError,
    clearAllErrors
  };
}

// Hook for managing button accessibility
export function useButtonAccessibility(
  onClick: () => void,
  options: {
    isPressed?: boolean;
    isExpanded?: boolean;
    isSelected?: boolean;
    label?: string;
    describedBy?: string;
  } = {}
) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (keyboardNavigation.isActivationKey(event.key)) {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const buttonProps = {
    role: 'button',
    tabIndex: 0,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    'aria-pressed': options.isPressed ?? isPressed,
    'aria-expanded': options.isExpanded,
    'aria-selected': options.isSelected,
    'aria-label': options.label,
    'aria-describedby': options.describedBy
  };

  return {
    buttonProps,
    setIsPressed
  };
}

// Hook for managing dialog accessibility
export function useDialogAccessibility(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = ariaUtils.generateId('dialog-title');
  const descriptionId = ariaUtils.generateId('dialog-description');

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Set dialog attributes
      ariaUtils.setAttributes(dialogRef.current, {
        'role': 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId
      });

      // Handle escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, titleId, descriptionId]);

  return {
    dialogRef,
    titleId,
    descriptionId
  };
}

// Hook for managing table accessibility
export function useTableAccessibility() {
  const tableRef = useRef<HTMLTableElement>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (tableRef.current) {
      ariaUtils.setAttributes(tableRef.current, {
        'role': 'table'
      });
    }
  }, []);

  const handleSort = useCallback((columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
  }, [sortColumn, sortDirection]);

  const getColumnProps = useCallback((columnId: string) => ({
    'aria-sort': sortColumn === columnId 
      ? (sortDirection === 'asc' ? 'ascending' : 'descending')
      : 'none',
    tabIndex: 0,
    role: 'columnheader',
    onClick: () => handleSort(columnId),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (keyboardNavigation.isActivationKey(event.key)) {
        event.preventDefault();
        handleSort(columnId);
      }
    }
  }), [sortColumn, sortDirection, handleSort]);

  return {
    tableRef,
    sortColumn,
    sortDirection,
    getColumnProps
  };
}