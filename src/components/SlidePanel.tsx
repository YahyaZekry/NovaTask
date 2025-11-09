"use client";

import { useEffect, useRef } from "react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  direction: "up" | "right" | "left" | "down";
  children: React.ReactNode;
  className?: string;
  showBackdrop?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function SlidePanel({
  isOpen,
  onClose,
  direction,
  children,
  className = "",
  showBackdrop = true,
  size = "md"
}: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Size classes based on direction
  const getSizeClasses = () => {
    switch (direction) {
      case "up":
        return "max-h-[85vh] overflow-y-auto";
      case "down":
        return "max-h-[85vh] overflow-y-auto";
      case "left":
      case "right":
        switch (size) {
          case "sm": return "w-64";
          case "md": return "w-80";
          case "lg": return "w-96";
          case "xl": return "w-[28rem]";
          case "full": return "w-[85vw]";
          default: return "w-80";
        }
      default:
        return "";
    }
  };

  // Position and transform classes based on direction
  const getPositionClasses = () => {
    const baseClasses = "fixed z-50 transition-transform duration-300 ease-in-out mobile-panel";
    
    switch (direction) {
      case "up":
        return `${baseClasses} inset-x-0 bottom-0 ${isOpen ? "translate-y-0" : "translate-y-full"}`;
      case "down":
        return `${baseClasses} inset-x-0 top-0 ${isOpen ? "translate-y-0" : "-translate-y-full"}`;
      case "left":
        return `${baseClasses} inset-y-0 left-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`;
      case "right":
        return `${baseClasses} inset-y-0 right-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`;
      default:
        return baseClasses;
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Store current focus element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Prevent body scroll when panel is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Restore body scroll
      document.body.style.overflow = "";
      // Restore focus to previous element
      if (previousFocusRef.current && !isOpen) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Focus management for panel content
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Find first focusable element in panel
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 backdrop-overlay"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          ${getPositionClasses()}
          ${getSizeClasses()}
          ${className}
          glass-desktop border-t border-white/20 md:border-t-0 md:border-l md:border-r
          shadow-2xl mobile-panel-transition performance-optimized
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={direction === "up" ? "slide-up-panel-title" : "slide-panel-title"}
      >
        {/* Handle for mobile slide-up panels */}
        {direction === "up" && (
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-white/30 rounded-full animate-pulse"></div>
          </div>
        )}
        
        {/* Panel content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}