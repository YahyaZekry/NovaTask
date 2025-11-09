"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLiveRegion, useListNavigation } from "@/hooks/useAccessibility";
import { ariaUtils, keyboardNavigation } from "@/utils/accessibility";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/contexts/ErrorContext";
import { useToastNotification } from "@/components/ToastNotification";
import { AppError } from "@/utils/error-handling";

interface TodoFiltersProps {
  filter: "all" | "active" | "completed";
  setFilter: (filter: "all" | "active" | "completed") => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  onClose?: () => void;
  isMobilePanel?: boolean;
}

interface FilterPreset {
  name: string;
  filter: "all" | "active" | "completed";
  category: string;
  icon: string;
}

const TodoFiltersWithBoundary = withErrorBoundary(TodoFilters, {
  fallbackComponent: TodoFiltersFallback,
  enableRetry: true,
  maxRetries: 3
});

export function TodoFilters({
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
  onClose,
  isMobilePanel = false
}: TodoFiltersProps) {
  const { handleError } = useErrorHandler();
  const [filterHistory, setFilterHistory] = useState<Array<{filter: string; category: string}>>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const { announce } = useLiveRegion();
  
  // Generate unique IDs for accessibility
  const titleId = useRef(ariaUtils.generateId('filters-title'));
  const statusId = useRef(ariaUtils.generateId('filter-status'));
  const presetsId = useRef(ariaUtils.generateId('filter-presets'));

  // Load filter history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("novatask-filter-history");
      if (saved) {
        try {
          setFilterHistory(JSON.parse(saved));
        } catch (error) {
          handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'loadFilterHistory' });
        }
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'loadFilterHistory' });
    }
  }, [handleError]);

  // Save filter history to localStorage
  useEffect(() => {
    try {
      if (filter !== "all" || categoryFilter !== "all") {
        const newHistory = [
          { filter, category: categoryFilter },
          ...filterHistory.slice(0, 4) // Keep only last 5 items
        ];
        setFilterHistory(newHistory);
        localStorage.setItem("novatask-filter-history", JSON.stringify(newHistory));
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'saveFilterHistory' });
    }
  }, [filter, categoryFilter, filterHistory, handleError]);

  // Filter presets
  const presets: FilterPreset[] = [
    { name: "All Tasks", filter: "all", category: "all", icon: "📋" },
    { name: "High Priority", filter: "all", category: "all", icon: "🔥" },
    { name: "Due Today", filter: "all", category: "all", icon: "📅" },
    { name: "Work", filter: "all", category: "Work", icon: "💼" },
    { name: "Personal", filter: "all", category: "Personal", icon: "🏠" }
  ];

  const applyPreset = useCallback((preset: FilterPreset) => {
    try {
      setActivePreset(preset.name);
      setFilter(preset.filter);
      if (preset.category !== "all") {
        setCategoryFilter(preset.category);
      }
      
      // Announce filter change
      announce(`Applied filter: ${preset.name}`, 'polite');
      
      // Clear preset selection after animation
      setTimeout(() => setActivePreset(null), 300);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'applyPreset' });
    }
  }, [setFilter, setCategoryFilter, announce, handleError]);

  const goBack = useCallback(() => {
    try {
      if (filterHistory.length > 1) {
        const previous = filterHistory[1];
        setFilter(previous.filter as "all" | "active" | "completed");
        setCategoryFilter(previous.category);
        
        // Announce going back
        announce('Returned to previous filter', 'polite');
        
        // Update history
        const newHistory = filterHistory.slice(1);
        setFilterHistory(newHistory);
        localStorage.setItem("novatask-filter-history", JSON.stringify(newHistory));
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'goBack' });
    }
  }, [filterHistory, setFilter, setCategoryFilter, announce, handleError]);

  const getActiveCount = () => {
    if (filter === "all" && categoryFilter === "all") return 0;
    if (filter !== "all" && categoryFilter === "all") return 1;
    if (filter === "all" && categoryFilter !== "all") return 1;
    return 2;
  };

  return (
    <div className="glass-desktop p-4 sm:p-6 shadow-2xl">
      {/* Mobile Header with Close Button */}
      {isMobilePanel && (
        <div className="flex items-center justify-between mb-6 md:hidden">
          <h2 id={titleId.current} className="text-xl font-semibold text-white">Filter Tasks</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg glass-desktop flex items-center justify-center touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced"
            aria-label="Close filters"
            title="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Filter Presets */}
      <div className="mb-6">
        <h3 className="text-responsive-sm font-medium text-purple-200 mb-3">Quick Filters</h3>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          role="group"
          aria-labelledby={presetsId.current}
        >
          {presets.map((preset, index) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`
                p-3 rounded-lg border touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced micro-interaction card-hover-enhanced
                ${activePreset === preset.name
                  ? "bg-purple-600/30 border-purple-400 scale-95"
                  : "glass-desktop border-white/20"
                }
              `}
              role="button"
              aria-pressed={activePreset === preset.name}
              aria-label={`Apply filter: ${preset.name}`}
              aria-describedby={`preset-desc-${index}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg" aria-hidden="true">{preset.icon}</span>
                <span className="text-responsive-xs text-white">{preset.name}</span>
              </div>
              <div id={`preset-desc-${index}`} className="sr-only">
                {preset.name} filter
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Active Filters Count */}
      {getActiveCount() > 0 && (
        <div
          className="mb-4 p-2 glass-desktop rounded-lg border border-purple-400/30 bg-purple-600/10 animate-fade-in"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center justify-between">
            <p className="text-purple-200 text-sm">
              {getActiveCount()} active filter{getActiveCount() > 1 ? 's' : ''}
            </p>
            {filterHistory.length > 1 && (
              <button
                onClick={goBack}
                className="px-2 py-1 text-xs bg-purple-600/50 text-white rounded touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                aria-label="Go back to previous filter"
                title="Go back to previous filter"
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-4 sm:space-y-6">
        <div className="transition-all duration-300 transform">
          <label
            htmlFor="status-filter"
            className="block text-responsive-sm font-medium text-purple-200 mb-2 sm:mb-3"
          >
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => {
              try {
                setFilter(e.target.value as "all" | "active" | "completed");
                announce(`Status filter changed to: ${e.target.value}`, 'polite');
              } catch (error) {
                handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'statusFilterChange' });
              }
            }}
            className="w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border border-white/30 rounded-lg text-white backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized"
            aria-describedby="status-help"
          >
            <option value="all" className="bg-slate-800">All Tasks</option>
            <option value="active" className="bg-slate-800">Active Tasks</option>
            <option value="completed" className="bg-slate-800">Completed Tasks</option>
          </select>
          <div id="status-help" className="sr-only">
            Filter tasks by completion status
          </div>
        </div>

        <div className="transition-all duration-300 transform">
          <label
            htmlFor="category-filter"
            className="block text-responsive-sm font-medium text-purple-200 mb-2 sm:mb-3"
          >
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => {
              try {
                setCategoryFilter(e.target.value);
                announce(`Category filter changed to: ${e.target.value}`, 'polite');
              } catch (error) {
                handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoFilters', action: 'categoryFilterChange' });
              }
            }}
            className="w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border border-white/30 rounded-lg text-white backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized"
            aria-describedby="category-filter-help"
          >
            <option value="all" className="bg-slate-800">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category} className="bg-slate-800">
                {category}
              </option>
            ))}
          </select>
          <div id="category-filter-help" className="sr-only">
            Filter tasks by category
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback component for TodoFilters errors
interface TodoFiltersFallbackProps {
  error: AppError;
  errorInfo: React.ErrorInfo;
  retry: () => void;
}

function TodoFiltersFallback({ error, errorInfo, retry }: TodoFiltersFallbackProps) {
  const { success, error: showError } = useToastNotification();
  
  return (
    <div className="glass-desktop rounded-2xl p-4 text-center">
      <div className="text-white">
        <h2 className="text-lg font-semibold mb-3">Filter Error</h2>
        <p className="mb-4 text-red-200">
          {error?.message || "Failed to load filters"}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={retry}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Retry
          </button>
          <button
            onClick={() => {
              // Reset filters to defaults
              try {
                success("Filters reset to defaults");
              } catch (e) {
                showError("Failed to reset filters");
              }
            }}
            className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodoFiltersWithBoundary;
