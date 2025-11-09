/**
 * Accessibility utilities and helper functions for NovaTask
 * Provides common accessibility patterns and ARIA management
 */

import React from 'react';

// Focus management utilities
export const focusManagement = {
  /**
   * Trap focus within a container element
   * @param container The container element to trap focus within
   * @returns Cleanup function to remove focus trap
   */
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element if none is currently focused
    if (!container.contains(document.activeElement)) {
      firstElement?.focus();
    }
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Restore focus to previously focused element
   * @param element The element to restore focus to
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  /**
   * Get all focusable elements within a container
   * @param container The container element
   * @returns Array of focusable elements
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    return Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  }
};

// ARIA utilities
export const ariaUtils = {
  /**
   * Announce message to screen readers
   * @param message The message to announce
   * @param priority The priority level (polite or assertive)
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Set ARIA attributes on an element
   * @param element The element to set attributes on
   * @param attributes Object of ARIA attributes to set
   */
  setAttributes: (element: HTMLElement, attributes: Record<string, string>) => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  },

  /**
   * Generate unique ID for ARIA relationships
   * @param prefix The prefix for the ID
   * @returns Unique ID string
   */
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  /**
   * Handle keyboard navigation for list-like components
   * @param event The keyboard event
   * @param currentIndex The current index
   * @param itemCount The total number of items
   * @param orientation The orientation (vertical or horizontal)
   * @returns The new index or null if no navigation
   */
  handleListNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    orientation: 'vertical' | 'horizontal' = 'vertical'
  ): number | null => {
    const { key } = event;
    
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (orientation === 'vertical' && key === 'ArrowRight') return null;
        if (orientation === 'horizontal' && key === 'ArrowDown') return null;
        event.preventDefault();
        return currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        if (orientation === 'vertical' && key === 'ArrowLeft') return null;
        if (orientation === 'horizontal' && key === 'ArrowUp') return null;
        event.preventDefault();
        return currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
        
      case 'Home':
        event.preventDefault();
        return 0;
        
      case 'End':
        event.preventDefault();
        return itemCount - 1;
        
      default:
        return null;
    }
  },

  /**
   * Check if key is an activation key
   * @param key The keyboard key
   * @returns True if key activates an element
   */
  isActivationKey: (key: string): boolean => {
    return ['Enter', ' ', 'Space'].includes(key);
  }
};

// Screen reader utilities
export const screenReader = {
  /**
   * Create screen reader only text
   * @param text The text to make screen reader only
   * @returns JSX element with screen reader only styling
   */
  onlyText: (text: string): React.ReactElement => {
    return React.createElement('span', { className: 'sr-only' }, text);
  },

  /**
   * Hide element visually but keep accessible to screen readers
   * @returns CSS class name for screen reader only elements
   */
  getOnlyClass: (): string => {
    return 'sr-only';
  }
};

// Color contrast utilities
export const colorContrast = {
  /**
   * Check if color meets WCAG AA contrast ratio
   * @param foreground The foreground color
   * @param background The background color
   * @returns True if contrast meets AA standards
   */
  meetsAA: (foreground: string, background: string): boolean => {
    // This is a simplified check - in a real implementation,
    // you'd use a proper color contrast calculation library
    return true; // Placeholder
  },

  /**
   * Get focus indicator styles that don't rely on color alone
   * @returns CSS class name for accessible focus indicators
   */
  getFocusClass: (): string => {
    return 'focus-visible:focus:outline-2 focus-visible:focus:outline-offset-2 focus-visible:focus:outline-purple-400';
  }
};

// Validation utilities
export const accessibilityValidation = {
  /**
   * Check if element has proper ARIA attributes
   * @param element The element to check
   * @param requiredAttributes Array of required ARIA attributes
   * @returns True if all required attributes are present
   */
  hasRequiredAria: (element: HTMLElement, requiredAttributes: string[]): boolean => {
    return requiredAttributes.every(attr => element.hasAttribute(attr));
  },

  /**
   * Check if interactive elements are keyboard accessible
   * @param container The container to check
   * @returns Array of elements that are not keyboard accessible
   */
  findNonKeyboardAccessible: (container: HTMLElement): HTMLElement[] => {
    const interactiveElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    return Array.from(interactiveElements).filter(element => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.display === 'none' || 
             computedStyle.visibility === 'hidden' ||
             element.tabIndex < 0;
    });
  }
};

// Skip link utilities
export const skipLinks = {
  /**
   * Create skip link for keyboard navigation
   * @param targetId The ID of the target element
   * @param text The link text
   * @returns JSX element for skip link
   */
  create: (targetId: string, text: string): React.ReactElement => {
    return React.createElement(
      'a',
      {
        href: `#${targetId}`,
        className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-purple-600 text-white px-4 py-2 rounded-md z-50 focus:outline-2 focus:outline-offset-2 focus:outline-purple-400"
      },
      text
    );
  }
};

// Testing utilities
export const accessibilityTesting = {
  /**
   * Run basic accessibility checks on a component
   * @param container The container element to test
   * @returns Object with test results
   */
  runBasicChecks: (container: HTMLElement) => {
    const results = {
      hasFocusableElements: false,
      hasProperHeadings: false,
      hasAriaLabels: false,
      hasKeyboardNavigation: false,
      issues: [] as string[]
    };

    // Check for focusable elements
    const focusableElements = focusManagement.getFocusableElements(container);
    results.hasFocusableElements = focusableElements.length > 0;
    if (!results.hasFocusableElements) {
      results.issues.push('No focusable elements found');
    }

    // Check for proper headings
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    results.hasProperHeadings = headings.length > 0;
    if (!results.hasProperHeadings) {
      results.issues.push('No heading elements found');
    }

    // Check for ARIA labels
    const interactiveElements = container.querySelectorAll(
      'button, [href], input, select, textarea'
    );
    results.hasAriaLabels = Array.from(interactiveElements).every(el => {
      const element = el as HTMLElement;
      return element.hasAttribute('aria-label') ||
             element.hasAttribute('aria-labelledby') ||
             element.textContent?.trim() !== '';
    });
    if (!results.hasAriaLabels) {
      results.issues.push('Some interactive elements lack proper labels');
    }

    // Check keyboard navigation
    results.hasKeyboardNavigation = focusableElements.length > 0;
    if (!results.hasKeyboardNavigation) {
      results.issues.push('No keyboard navigation available');
    }

    return results;
  }
};