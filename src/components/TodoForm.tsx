"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Todo } from "@/app/page";
import { useFormAccessibility, useLiveRegion } from "@/hooks/useAccessibility";
import { ariaUtils, keyboardNavigation } from "@/utils/accessibility";
import { useFormValidation } from "@/hooks/useErrorHandling";
import { useToastNotification } from "@/components/ToastNotification";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/contexts/ErrorContext";
import { AppError } from "@/utils/error-handling";

interface TodoFormProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  categories: string[];
  onClose?: () => void;
  isMobilePanel?: boolean;
}

interface FormErrors {
  text?: string;
  category?: string;
  dueDate?: string;
  priority?: string;
}

interface FormValues extends Record<string, unknown> {
  text: string;
  priority: "low" | "medium" | "high";
  category: string;
  dueDate: string;
}

interface DraftTodo {
  text: string;
  priority: "low" | "medium" | "high";
  category: string;
  dueDate: string;
}

const TodoFormWithBoundary = withErrorBoundary(TodoForm, {
  fallbackComponent: TodoFormFallback,
  enableRetry: true,
  maxRetries: 3
});

export function TodoForm({ todos, setTodos, categories, onClose, isMobilePanel = false }: TodoFormProps) {
  const { handleError } = useErrorHandler();
  const initialValues: FormValues = {
    text: "",
    priority: "medium",
    category: "General",
    dueDate: ""
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validate,
    handleSubmit: handleFormSubmit
  } = useFormValidation(initialValues);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  
  const textInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { announce } = useLiveRegion();
  const { success, error, validation } = useToastNotification();
  
  // Auto-save draft with error handling
  const { value: draft, setValue: setDraft } = useLocalStorage<DraftTodo | null>("novatask-draft", {
    defaultValue: null,
    onError: (err) => {
      error("Failed to save draft: " + err.message, { persistent: false });
    }
  });
  
  // Generate unique IDs for accessibility
  const formId = useRef(ariaUtils.generateId('todo-form'));
  const titleId = useRef(ariaUtils.generateId('form-title'));
  const descriptionId = useRef(ariaUtils.generateId('form-description'));

  // Auto-save draft functionality with error handling
  useEffect(() => {
    const draftData: DraftTodo = {
      text: values.text as string,
      priority: values.priority as "low" | "medium" | "high",
      category: values.category as string,
      dueDate: values.dueDate as string
    };
    
    try {
      setDraft(draftData);
      
      // Show draft saved indicator
      if (values.text || values.category !== "General" || values.dueDate) {
        setDraftSaved(true);
        const timer = setTimeout(() => setDraftSaved(false), 2000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      error("Failed to save draft: " + (err instanceof Error ? err.message : String(err)), { persistent: false });
    }
  }, [values, setDraft, error]);

  // Load draft on mount with error handling
  useEffect(() => {
    if (draft) {
      try {
        setValue("text" as keyof FormValues, draft.text || "");
        setValue("priority" as keyof FormValues, draft.priority || "medium");
        setValue("category" as keyof FormValues, draft.category || "General");
        setValue("dueDate" as keyof FormValues, draft.dueDate || "");
      } catch (err) {
        error("Failed to load draft: " + (err instanceof Error ? err.message : String(err)), { persistent: false });
      }
    }
  }, [draft, setValue, error]);

  // Generate smart suggestions
  const generateSuggestions = (input: string) => {
    if (!input.trim()) return [];
    
    const recentTasks = todos
      .filter(todo => todo.text.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 3)
      .map(todo => todo.text);
    
    const categoryMatches = categories
      .filter(cat => cat.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 2);
    
    return [...new Set([...recentTasks, ...categoryMatches])];
  };

  // Validation rules
  const validationRules = {
    text: (value: unknown) => {
      const textValue = String(value || "");
      if (!textValue.trim()) {
        return "Task description is required";
      }
      if (textValue.trim().length < 3) {
        return "Task must be at least 3 characters";
      }
      if (textValue.trim().length > 200) {
        return "Task must be less than 200 characters";
      }
      return null;
    },
    priority: (value: unknown) => {
      if (!value) {
        return "Priority is required";
      }
      return null;
    },
    category: (value: unknown) => {
      const categoryValue = String(value || "");
      if (!categoryValue.trim()) {
        return "Category is required";
      }
      return null;
    },
    dueDate: (value: unknown) => {
      const dateValue = String(value || "");
      if (dateValue) {
        const selectedDate = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          return "Due date cannot be in the past";
        }
      }
      return null;
    }
  };

  // Handle text input with suggestions
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("text", value);
    
    // Generate suggestions
    if (value.trim()) {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      
      // Announce suggestions to screen readers
      if (newSuggestions.length > 0) {
        announce(`${newSuggestions.length} suggestions available`, 'polite');
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [setValue, announce]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: string) => {
    setValue("text" as keyof FormValues, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    textInputRef.current?.focus();
    announce(`Selected suggestion: ${suggestion}`, 'polite');
  }, [announce]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
      
      // Escape to close mobile panel
      if (e.key === "Escape" && isMobilePanel && onClose) {
        onClose();
      }
      
      // Ctrl/Cmd + K to focus on text input
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textInputRef.current?.focus();
        announce('Focused on task input', 'polite');
      }
      
      // Navigate suggestions with arrow keys
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          // Focus first suggestion
          const firstSuggestion = document.querySelector('[role="option"]') as HTMLElement;
          if (firstSuggestion) {
            firstSuggestion.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobilePanel, onClose, showSuggestions, suggestions.length, announce]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = handleFormSubmit(validationRules, async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          text: (values.text as string).trim(),
          completed: false,
          priority: values.priority as "low" | "medium" | "high",
          category: (values.category as string) || "General",
          dueDate: values.dueDate ? new Date(values.dueDate as string) : undefined,
          createdAt: new Date(),
        };

        setTodos([...todos, newTodo]);
        
        // Announce success
        announce(`Task "${(values.text as string).trim()}" created successfully`, 'polite');
        
        // Clear draft
        setDraft(null);
        
        // Reset form
        setValue("text" as keyof FormValues, "");
        setValue("priority" as keyof FormValues, "medium");
        setValue("category" as keyof FormValues, "General");
        setValue("dueDate" as keyof FormValues, "");
        setSuggestions([]);
        setShowSuggestions(false);
        
        success("Task created successfully!");
        
        // Close mobile panel after submission
        if (isMobilePanel && onClose) {
          onClose();
        }
      } catch (err) {
        error("Failed to create task. Please try again.", {
          persistent: false,
          actions: [
            {
              label: "Retry",
              action: () => {
                // Retry the submission
                formRef.current?.requestSubmit();
              },
              primary: true
            }
          ]
        });
        throw err;
      }
    }, { showErrorToast: false });
  }, [values, todos, setTodos, isMobilePanel, onClose, handleFormSubmit, validationRules, announce, setValue, setDraft, success, error]);

  return (
    <div className="glass-desktop p-4 sm:p-6 shadow-2xl">
      {/* Mobile Header with Close Button */}
      {isMobilePanel && (
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h2 id={titleId.current} className="text-xl font-semibold text-white">Create New Task</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg glass-desktop flex items-center justify-center button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced touch-target"
            aria-label="Close form"
            title="Close"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Draft saved indicator */}
      {draftSaved && (
        <div
          className="mb-4 p-2 glass-desktop rounded-lg border border-green-500/30 bg-green-500/10 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <p className="text-green-300 text-sm text-center">Draft saved automatically</p>
        </div>
      )}
      
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4"
        id={formId.current}
        aria-labelledby={isMobilePanel ? titleId.current : undefined}
        aria-describedby={descriptionId.current}
        noValidate
      >
        {/* Task input with suggestions */}
        <div className="relative">
          <label
            htmlFor="task-input"
            className="block text-responsive-sm font-medium text-purple-200 mb-2"
          >
            Task Description
            <span className="text-purple-400 text-xs ml-2" aria-live="polite">
              {(values.text as string).length}/200 characters
            </span>
          </label>
          <div className="relative">
            <input
              ref={textInputRef}
              id="task-input"
              type="text"
              value={values.text as string}
              onChange={handleTextChange}
              onBlur={() => setTouchedField("text")}
              placeholder="What needs to be done?"
              className={`w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border rounded-lg text-white placeholder-purple-300 backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized ${
                errors.text ? "border-red-400 focus:ring-red-400 error-enhanced" : "border-white/30"
              }`}
              aria-required="true"
              aria-describedby={errors.text ? "error-task-text" : descriptionId.current}
              aria-invalid={!!errors.text}
              autoComplete="off"
              maxLength={200}
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 glass-desktop rounded-lg border border-white/20 z-10 animate-fade-in"
                role="listbox"
                aria-label="Task suggestions"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left text-white first:rounded-t-lg last:rounded-b-lg touch-target hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                    role="option"
                    aria-selected={false}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-responsive-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Error message */}
          {errors.text && touched.text && (
            <p
              id="error-task-text"
              className="mt-2 text-red-400 text-responsive-xs animate-fade-in"
              role="alert"
              aria-live="assertive"
            >
              {errors.text}
            </p>
          )}
        </div>

        {/* Priority and Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Priority */}
          <div>
            <label
              htmlFor="priority-select"
              className="block text-responsive-sm font-medium text-purple-200 mb-2"
            >
              Priority
            </label>
            <select
              id="priority-select"
              value={values.priority as string}
              onChange={(e) => setValue("priority", e.target.value as "low" | "medium" | "high")}
              onBlur={() => setTouchedField("priority")}
              className={`w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border rounded-lg text-white backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized ${
                errors.priority ? "border-red-400 focus:ring-red-400 error-enhanced" : "border-white/30"
              }`}
              aria-describedby="priority-help"
              aria-invalid={!!errors.priority}
            >
              <option value="low" className="bg-slate-800">Low</option>
              <option value="medium" className="bg-slate-800">Medium</option>
              <option value="high" className="bg-slate-800">High</option>
            </select>
            <div id="priority-help" className="sr-only">
              Select the priority level for this task
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category-select"
              className="block text-responsive-sm font-medium text-purple-200 mb-2"
            >
              Category
            </label>
            <select
              id="category-select"
              value={values.category as string}
              onChange={(e) => setValue("category", e.target.value)}
              onBlur={() => setTouchedField("category")}
              className={`w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border rounded-lg text-white backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized ${
                errors.category ? "border-red-400 focus:ring-red-400 error-enhanced" : "border-white/30"
              }`}
              aria-describedby="category-help"
              aria-invalid={!!errors.category}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-800">
                  {cat}
                </option>
              ))}
            </select>
            <div id="category-help" className="sr-only">
              Select a category for this task
            </div>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label
            htmlFor="due-date-input"
            className="block text-responsive-sm font-medium text-purple-200 mb-2"
          >
            Due Date (Optional)
          </label>
          <input
            id="due-date-input"
            type="date"
            value={values.dueDate as string}
            onChange={(e) => setValue("dueDate", e.target.value)}
            onBlur={() => setTouchedField("dueDate")}
            className={`w-full px-4 py-3 sm:py-4 text-responsive-base bg-white/20 border rounded-lg text-white backdrop-blur-sm min-h-[44px] sm:min-h-[48px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized ${
              errors.dueDate ? "border-red-400 focus:ring-red-400 error-enhanced" : "border-white/30"
            }`}
            aria-describedby={errors.dueDate ? "error-due-date" : "due-date-help"}
            aria-invalid={!!errors.dueDate}
          />
          <div id="due-date-help" className="sr-only">
            Optional due date for the task
          </div>
          {errors.dueDate && touched.dueDate && (
            <p
              id="error-due-date"
              className="mt-2 text-red-400 text-responsive-xs animate-fade-in"
              role="alert"
              aria-live="assertive"
            >
              {errors.dueDate}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-semibold py-4 sm:py-3 px-6 text-responsive-base rounded-lg min-h-[48px] sm:min-h-[44px] touch-target-large button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized state-enhanced ${
            isSubmitting
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          }`}
          data-state={isSubmitting ? "loading" : "default"}
          aria-describedby="submit-help"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
              <span>Creating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Add Task</span>
              <span className="text-purple-200 text-xs" aria-hidden="true">Ctrl+Enter</span>
            </div>
          )}
        </button>
        
        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-center" aria-label="Keyboard shortcuts">
          <p className="text-purple-300 text-xs">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-white/20 text-white rounded border border-white/30" aria-hidden="true">Ctrl+K</kbd> to focus input •
            Press <kbd className="px-2 py-1 text-xs font-mono bg-white/20 text-white rounded border border-white/30" aria-hidden="true">Ctrl+Enter</kbd> to submit
          </p>
        </div>
        
        {/* Form description for screen readers */}
        <div id={descriptionId.current} className="sr-only">
          Create a new task with description, priority, category, and optional due date
        </div>
      </form>
    </div>
  );
}

// Fallback component for TodoForm errors
interface TodoFormFallbackProps {
  error: AppError;
  errorInfo: React.ErrorInfo;
  retry: () => void;
}

function TodoFormFallback({ error, errorInfo, retry }: TodoFormFallbackProps) {
  const { success, error: showError } = useToastNotification();
  
  return (
    <div className="glass-desktop rounded-2xl p-6 text-center">
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">Form Error</h2>
        <p className="mb-6 text-red-200">
          {error?.message || "Failed to load task form"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={retry}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Retry Loading Form
          </button>
          <button
            onClick={() => {
              // Try to recover from localStorage
              try {
                const saved = localStorage.getItem("novatask-draft");
                if (saved) {
                  success("Form draft recovered from storage");
                } else {
                  showError("No form draft found in storage");
                }
              } catch (e) {
                showError("Failed to recover form draft");
              }
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Recover Draft
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodoFormWithBoundary;
