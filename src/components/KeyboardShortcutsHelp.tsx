"use client";

import { useEffect, useRef } from "react";
import { KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";
import { useDialogAccessibility, useFocusTrap } from "@/hooks/useAccessibility";
import { ariaUtils } from "@/utils/accessibility";

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use dialog accessibility hook
  const { dialogRef, titleId, descriptionId } = useDialogAccessibility(isOpen, onClose);
  
  // Use focus trap for modal
  const focusTrapRef = useFocusTrap(isOpen);

  // Focus management when dialog opens
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Announce dialog opening to screen readers
      ariaUtils.announce("Keyboard shortcuts help dialog opened", "polite");
      
      // Focus close button when dialog opens
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }
  }, [isOpen, dialogRef]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle keyboard events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const formatKeyCombo = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.metaKey) parts.push("Cmd");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 backdrop-overlay transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
        data-testid="keyboard-shortcuts-backdrop"
      />
      
      {/* Dialog */}
      <div
        ref={(node) => {
          dialogRef.current = node;
          focusTrapRef.current = node;
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={handleKeyDown}
        data-testid="keyboard-shortcuts-dialog"
      >
        <div
          className="glass-desktop rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent card-hover-enhanced micro-interaction mobile-panel-transition performance-optimized"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              id={titleId}
              className="text-xl font-semibold text-white"
            >
              Keyboard Shortcuts
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="w-8 h-8 rounded-lg glass-desktop flex items-center justify-center touch-target button-hover-enhanced focus-enhanced keyboard-enhanced micro-interaction"
              title="Close keyboard shortcuts help"
              aria-label="Close keyboard shortcuts help dialog"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
          
          <div
            id={descriptionId}
            className="sr-only"
          >
            List of available keyboard shortcuts for navigating and using the application. Use Tab to navigate through shortcuts and Escape to close this dialog.
          </div>
          
          <div
            className="space-y-3"
            role="list"
            aria-label="Keyboard shortcuts list"
          >
            {shortcuts.map((shortcut, index) => {
              const shortcutId = ariaUtils.generateId(`shortcut-${index}`);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 glass-desktop rounded-lg focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2 focus-within:ring-offset-transparent card-hover-enhanced micro-interaction"
                  role="listitem"
                  id={shortcutId}
                >
                  <span className="text-white text-sm" id={`${shortcutId}-desc`}>
                    {shortcut.description}
                  </span>
                  <kbd
                    className="px-2 py-1 text-xs font-mono bg-white/20 text-white rounded border border-white/30 hover:bg-white/30 transition-colors duration-200"
                    aria-labelledby={`${shortcutId}-desc`}
                    aria-label={`Keyboard shortcut: ${formatKeyCombo(shortcut)}`}
                  >
                    {formatKeyCombo(shortcut)}
                  </kbd>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Press <kbd className="px-2 py-1 text-xs font-mono bg-white/20 text-white rounded border border-white/30 hover:bg-white/30 transition-colors duration-200" aria-label="Question mark key">?</kbd> to toggle this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}