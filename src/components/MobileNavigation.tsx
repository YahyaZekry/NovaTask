"use client";

import { useState, useCallback, useRef } from "react";
import { useLiveRegion } from "@/hooks/useAccessibility";
import { ariaUtils } from "@/utils/accessibility";

interface MobileNavigationProps {
  onAddTask: () => void;
  onToggleFilters: () => void;
  isFiltersOpen: boolean;
}

export function MobileNavigation({ onAddTask, onToggleFilters, isFiltersOpen }: MobileNavigationProps) {
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const { announce } = useLiveRegion();
  
  // Generate unique IDs for accessibility
  const navId = useRef(ariaUtils.generateId('mobile-nav'));
  const brandId = useRef(ariaUtils.generateId('brand'));

  const handleButtonPress = useCallback((button: string) => {
    setIsPressed(button);
    setTimeout(() => setIsPressed(null), 150);
  }, []);

  const handleAddTask = useCallback(() => {
    handleButtonPress("add");
    onAddTask();
    announce('Opening add task form', 'polite');
  }, [onAddTask, handleButtonPress, announce]);

  const handleToggleFilters = useCallback(() => {
    handleButtonPress("filter");
    onToggleFilters();
    announce(isFiltersOpen ? 'Closing filters' : 'Opening filters', 'polite');
  }, [onToggleFilters, isFiltersOpen, handleButtonPress, announce]);

  const handleMenuToggle = useCallback(() => {
    handleButtonPress("menu");
    onToggleFilters();
    announce(isFiltersOpen ? 'Closing menu' : 'Opening menu', 'polite');
  }, [onToggleFilters, isFiltersOpen, handleButtonPress, announce]);

  return (
    <>
      {/* Mobile Navigation - Only visible on mobile */}
      <nav
        id={navId.current}
        className="fixed bottom-6 right-6 z-40 md:hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="relative flex items-end gap-4">
          {/* Filter FAB */}
          <button
            onClick={handleToggleFilters}
            className={`
              w-14 h-14 rounded-full glass-desktop shadow-lg flex items-center justify-center
              touch-target-large button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized
              ${isFiltersOpen ? "bg-purple-600/50" : "bg-white/10"}
              ${isPressed === "filter" ? "scale-95" : ""}
            `}
            aria-label="Filter tasks"
            aria-expanded={isFiltersOpen}
            aria-pressed={isPressed === "filter"}
            title="Filter tasks"
          >
            <svg
              className={`w-6 h-6 text-white transition-transform duration-200 ${isFiltersOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          {/* Add Task FAB */}
          <button
            onClick={handleAddTask}
            className={`
              w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg
              flex items-center justify-center touch-target-large button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized animate-glow
              ${isPressed === "add" ? "scale-95" : ""}
            `}
            aria-label="Add new task"
            aria-pressed={isPressed === "add"}
            title="Add new task"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Header with Hamburger Menu */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden">
        <div className="glass-desktop border-b border-white/20 safe-top">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo/Brand */}
            <div
              id={brandId.current}
              className="flex items-center gap-3"
              role="banner"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h1 className="text-white font-semibold">NovaTask</h1>
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={handleMenuToggle}
              className={`
                w-10 h-10 rounded-lg glass-desktop flex items-center justify-center
                touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized
                ${isPressed === "menu" ? "scale-95" : ""}
              `}
              aria-label="Toggle menu"
              aria-expanded={isFiltersOpen}
              aria-pressed={isPressed === "menu"}
              aria-controls="mobile-menu"
              title="Menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-center" aria-hidden="true">
                <span className={`
                  absolute h-0.5 w-6 bg-white rounded-full transition-all duration-300
                  ${isFiltersOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"}
                `}></span>
                <span className={`
                  absolute h-0.5 w-6 bg-white rounded-full transition-all duration-300
                  ${isFiltersOpen ? "opacity-0" : "opacity-100"}
                `}></span>
                <span className={`
                  absolute h-0.5 w-6 bg-white rounded-full transition-all duration-300
                  ${isFiltersOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"}
                `}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Add top padding to account for fixed header on mobile */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}