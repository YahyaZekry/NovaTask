"use client";

import { useEffect, useState, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface KeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsReturn {
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const { shortcuts, enabled = true, preventDefault = true } = options;
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen(prev => !prev), []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Check if the pressed key combination matches any shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled, preventDefault]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp
  };
}

// Common todo app shortcuts
export const commonTodoShortcuts: KeyboardShortcut[] = [
  {
    key: "n",
    ctrlKey: true,
    action: () => {
      // Focus on new task input
      const taskInput = document.querySelector('input[placeholder*="What needs to be done"]') as HTMLInputElement;
      if (taskInput) {
        taskInput.focus();
      }
    },
    description: "Create new task"
  },
  {
    key: "/",
    action: () => {
      // Focus on search/filter input
      const filterInput = document.querySelector('select') as HTMLSelectElement;
      if (filterInput) {
        filterInput.focus();
      }
    },
    description: "Focus on filters"
  },
  {
    key: "a",
    ctrlKey: true,
    action: () => {
      // Toggle all tasks completion
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        (checkbox as HTMLInputElement).click();
      });
    },
    description: "Toggle all tasks"
  },
  {
    key: "Escape",
    action: () => {
      // Close any open panels or modals
      const closeButtons = document.querySelectorAll('[aria-label="Close"], button[title="Close"]');
      if (closeButtons.length > 0) {
        (closeButtons[0] as HTMLButtonElement).click();
      }
    },
    description: "Close panels/modals"
  },
  {
    key: "?",
    action: () => {
      // This will be handled by the component that uses the hook
    },
    description: "Show keyboard shortcuts"
  },
  {
    key: "1",
    action: () => {
      // Set filter to "all"
      const filterSelect = document.querySelector('select') as HTMLSelectElement;
      if (filterSelect) {
        filterSelect.value = "all";
        filterSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    description: "Show all tasks"
  },
  {
    key: "2",
    action: () => {
      // Set filter to "active"
      const filterSelect = document.querySelector('select') as HTMLSelectElement;
      if (filterSelect) {
        filterSelect.value = "active";
        filterSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    description: "Show active tasks"
  },
  {
    key: "3",
    action: () => {
      // Set filter to "completed"
      const filterSelect = document.querySelector('select') as HTMLSelectElement;
      if (filterSelect) {
        filterSelect.value = "completed";
        filterSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    description: "Show completed tasks"
  }
];

// Hook that includes common shortcuts and help functionality
export function useCommonTodoShortcuts(additionalShortcuts: KeyboardShortcut[] = []) {
  const allShortcuts = [...commonTodoShortcuts, ...additionalShortcuts];
  
  // Add the help toggle action to the "?" shortcut
  const shortcutsWithHelp = allShortcuts.map(shortcut => {
    if (shortcut.key === "?") {
      return {
        ...shortcut,
        action: () => {
          // This will be overridden by the hook's toggleHelp function
        }
      };
    }
    return shortcut;
  });

  const { isHelpOpen, openHelp, closeHelp, toggleHelp } = useKeyboardShortcuts({
    shortcuts: shortcutsWithHelp.map(shortcut => ({
      ...shortcut,
      action: shortcut.key === "?" ? toggleHelp : shortcut.action
    }))
  });

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    shortcuts: allShortcuts
  };
}