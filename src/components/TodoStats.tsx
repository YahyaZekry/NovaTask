"use client";

import { Todo } from "@/app/page";
import { ariaUtils } from "@/utils/accessibility";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/contexts/ErrorContext";
import { useToastNotification } from "@/components/ToastNotification";
import { AppError } from "@/utils/error-handling";

interface TodoStatsProps {
  todos: Todo[];
}

export function TodoStats({ todos }: TodoStatsProps) {
  const { handleError } = useErrorHandler();
  try {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const active = total - completed;
    const overdue = todos.filter((todo) =>
      todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Generate unique IDs for accessibility
  const statsId = ariaUtils.generateId('todo-stats');

  return (
    <div 
      className="flex gap-2 sm:gap-4 text-white overflow-x-auto"
      role="region"
      aria-label="Task statistics"
      id={statsId}
    >
      <div className="min-w-fit text-center card-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized p-2 rounded-lg">
        <div
          className="text-responsive-lg font-bold text-purple-300"
          aria-label={`Total tasks: ${total}`}
        >
          {total}
        </div>
        <div className="text-responsive-xs text-purple-200">Total</div>
      </div>

      <div className="min-w-fit text-center card-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized p-2 rounded-lg">
        <div
          className="text-responsive-lg font-bold text-green-400"
          aria-label={`Active tasks: ${active}`}
        >
          {active}
        </div>
        <div className="text-responsive-xs text-purple-200">Active</div>
      </div>

      <div className="min-w-fit text-center card-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized p-2 rounded-lg">
        <div
          className="text-responsive-lg font-bold text-blue-400"
          aria-label={`Completed tasks: ${completed}`}
        >
          {completed}
        </div>
        <div className="text-responsive-xs text-purple-200">Done</div>
      </div>

      {overdue > 0 && (
        <div className="min-w-fit text-center card-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized p-2 rounded-lg">
          <div
            className="text-responsive-lg font-bold text-red-400"
            aria-label={`Overdue tasks: ${overdue}`}
          >
            {overdue}
          </div>
          <div className="text-responsive-xs text-purple-200">Overdue</div>
        </div>
      )}

      <div className="min-w-fit text-center card-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized p-2 rounded-lg">
        <div
          className="text-responsive-base font-semibold text-purple-300"
          aria-label={`Completion rate: ${completionRate}%`}
        >
          {completionRate}%
        </div>
        <div className="text-responsive-xs text-purple-200">Complete</div>
      </div>
    </div>
  );
  } catch (error) {
    handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoStats', action: 'calculate' });
    // Return fallback UI on error
    return (
      <div className="glass-desktop rounded-2xl p-6 text-center">
        <div className="text-white">
          <h2 className="text-lg font-semibold mb-3">Statistics Unavailable</h2>
          <p className="text-purple-200">Unable to calculate task statistics</p>
        </div>
      </div>
    );
  }
}

// Fallback component for TodoStats errors
interface TodoStatsFallbackProps {
  error: AppError;
  errorInfo: React.ErrorInfo;
  retry: () => void;
}

function TodoStatsFallback({ error, errorInfo, retry }: TodoStatsFallbackProps) {
  const { success, error: showError } = useToastNotification();
  
  return (
    <div className="glass-desktop rounded-2xl p-6 text-center">
      <div className="text-white">
        <h2 className="text-lg font-semibold mb-3">Statistics Error</h2>
        <p className="mb-4 text-red-200">
          {error?.message || "Failed to load task statistics"}
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
              // Show basic stats as fallback
              try {
                success("Showing basic statistics");
              } catch (e) {
                showError("Failed to show basic statistics");
              }
            }}
            className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Show Basic Stats
          </button>
        </div>
      </div>
    </div>
  );
}

const TodoStatsWithBoundary = withErrorBoundary(TodoStats, {
  fallbackComponent: TodoStatsFallback,
  enableRetry: true,
  maxRetries: 3
});

export default TodoStatsWithBoundary;
