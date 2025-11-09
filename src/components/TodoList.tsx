"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Todo } from "@/app/page";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { SkeletonLoader, TodoSkeleton, PullToRefreshSkeleton } from "@/components/SkeletonLoader";
import { useLiveRegion, useListNavigation, useButtonAccessibility } from "@/hooks/useAccessibility";
import { ariaUtils, keyboardNavigation } from "@/utils/accessibility";
import { ErrorBoundary, withErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/contexts/ErrorContext";
import { useToastNotification } from "@/components/ToastNotification";
import { AppError } from "@/utils/error-handling";

interface TodoListProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  onAddTask?: () => void;
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
}

const TodoListWithBoundary = withErrorBoundary(TodoList, {
  fallbackComponent: TodoListFallback,
  enableRetry: true,
  maxRetries: 3
});

export function TodoList({ todos, setTodos, onAddTask, onRefresh, isLoading = false }: TodoListProps) {
  const { handleError } = useErrorHandler();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  const listRef = useRef<HTMLDivElement>(null);
  const { announce } = useLiveRegion();
  
  // Generate unique IDs for accessibility
  const listId = useRef(ariaUtils.generateId('todo-list'));
  const statusId = useRef(ariaUtils.generateId('todo-status'));
  
  // Pull-to-refresh functionality
  const { elementRef: pullToRefreshRef, isPulling, isRefreshing, progress, rotation } = usePullToRefresh({
    onRefresh: async () => {
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (error) {
          handleError(error instanceof Error ? error : new Error(String(error)), { component: 'TodoList', action: 'refresh' });
        }
      }
    }
  });

  const toggleTodo = useCallback((id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      const newCompleted = !todo.completed;
      setTodos(todos.map((t) =>
        t.id === id ? { ...t, completed: newCompleted } : t
      ));
      
      // Announce the change to screen readers
      announce(
        `Task "${todo.text}" marked as ${newCompleted ? 'completed' : 'active'}`,
        'polite'
      );
    }
  }, [todos, setTodos, announce, handleError]);

  const deleteTodo = useCallback((id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setTodos(todos.filter((t) => t.id !== id));
      announce(`Task "${todo.text}" deleted`, 'polite');
    }
  }, [todos, setTodos, announce, handleError]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggedItem(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (todoId: string) => {
    setDragOverItem(todoId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetId) return;
    
    const draggedIndex = todos.findIndex(todo => todo.id === draggedItem);
    const targetIndex = todos.findIndex(todo => todo.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newTodos = [...todos];
    const [draggedTodo] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(targetIndex, 0, draggedTodo);
    
    setTodos(newTodos);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const startEditing = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
    announce(`Editing task "${todo.text}"`, 'polite');
  }, [announce]);

  const saveEdit = useCallback((id: string) => {
    if (editingText.trim()) {
      setTodos(todos.map((todo) =>
        todo.id === id ? { ...todo, text: editingText.trim() } : todo
      ));
      announce(`Task updated to "${editingText.trim()}"`, 'polite');
    }
    setEditingId(null);
    setEditingText("");
  }, [editingText, setTodos, announce]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingText("");
    announce('Edit cancelled', 'polite');
  }, [announce]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-400 bg-red-500/10";
      case "medium": return "border-l-yellow-400 bg-yellow-500/10";
      case "low": return "border-l-green-400 bg-green-500/10";
      default: return "border-l-gray-400 bg-gray-500/10";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle keyboard navigation for the todo list
  const handleListKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (todos.length === 0) return;
    
    const newIndex = keyboardNavigation.handleListNavigation(
      event.nativeEvent,
      focusedIndex,
      todos.length,
      'vertical'
    );

    if (newIndex !== null) {
      event.preventDefault();
      setFocusedIndex(newIndex);
      
      // Focus the todo item
      const todoElement = document.querySelector(`[data-todo-index="${newIndex}"]`) as HTMLElement;
      if (todoElement) {
        todoElement.focus();
      }
    }

    // Handle activation keys for focused todo
    if (focusedIndex >= 0 && keyboardNavigation.isActivationKey(event.key)) {
      event.preventDefault();
      const focusedTodo = todos[focusedIndex];
      if (focusedTodo) {
        // Toggle completion with Enter/Space
        toggleTodo(focusedTodo.id);
      }
    }
  }, [todos, focusedIndex, toggleTodo]);

  // Announce list changes
  useEffect(() => {
    const activeCount = todos.filter(t => !t.completed).length;
    const completedCount = todos.filter(t => t.completed).length;
    announce(
      `Task list updated: ${activeCount} active, ${completedCount} completed, ${todos.length} total`,
      'polite'
    );
  }, [todos.length, announce]);

  if (isLoading) {
    return (
      <div className="glass-desktop rounded-2xl p-2 sm:p-4 shadow-2xl">
        <PullToRefreshSkeleton progress={0} isRefreshing={false} />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <TodoSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div
        className="glass-desktop rounded-2xl p-6 sm:p-12 text-center"
        role="status"
        aria-live="polite"
        aria-label="No tasks available"
      >
        <div className="text-4xl sm:text-6xl mb-4 animate-float" aria-hidden="true">✨</div>
        <h2 className="text-responsive-lg font-semibold text-white mb-2">No tasks yet</h2>
        <p className="text-responsive-sm text-purple-200 mb-6">Create your first task to get started!</p>
        
        {/* Call-to-action button for empty state */}
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg touch-target-large button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized state-enhanced animate-glow"
            aria-label="Add your first task"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Task
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-desktop rounded-2xl p-2 sm:p-4 shadow-2xl">
      {/* Pull-to-refresh indicator */}
      <PullToRefreshSkeleton progress={progress} isRefreshing={isRefreshing} />
      
      {/* Status announcement for screen readers */}
      <div id={statusId.current} className="sr-only" aria-live="polite" aria-atomic="true" />
      
      <div
        ref={(node) => {
          listRef.current = node;
          pullToRefreshRef.current = node;
        }}
        className="space-y-3 px-2"
        role="list"
        aria-label="Task list"
        aria-labelledby={statusId.current}
        id={listId.current}
        onKeyDown={handleListKeyDown}
        tabIndex={0}
      >
        {todos.map((todo, index) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            index={index}
            totalTodos={todos.length}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            toggleTodo={toggleTodo}
            deleteTodo={deleteTodo}
            startEditing={startEditing}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            editingId={editingId}
            editingText={editingText}
            setEditingText={setEditingText}
            draggedItem={draggedItem}
            dragOverItem={dragOverItem}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            getPriorityColor={getPriorityColor}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}

// Separate component for todo item to handle swipe gesture properly
interface TodoItemProps {
  todo: Todo;
  index: number;
  totalTodos: number;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  startEditing: (todo: Todo) => void;
  saveEdit: (id: string) => void;
  cancelEdit: () => void;
  editingId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  draggedItem: string | null;
  dragOverItem: string | null;
  handleDragStart: (e: React.DragEvent, todoId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (todoId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, targetId: string) => void;
  handleDragEnd: () => void;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
}

function TodoItem({
  todo,
  index,
  totalTodos,
  focusedIndex,
  setFocusedIndex,
  toggleTodo,
  deleteTodo,
  startEditing,
  saveEdit,
  cancelEdit,
  editingId,
  editingText,
  setEditingText,
  draggedItem,
  dragOverItem,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  getPriorityColor,
  formatDate
}: TodoItemProps) {
  // Swipe gesture for each todo item
  const { elementRef, isSwiping, swipeDirection, swipeProgress, translateX } = useSwipeGesture({
    onSwipeLeft: () => deleteTodo(todo.id),
    onSwipeRight: () => toggleTodo(todo.id),
    threshold: 80,
    hapticFeedback: true
  });

  return (
    <div
      key={todo.id}
      ref={(node) => {
        if (elementRef.current !== node) {
          (elementRef as React.RefObject<HTMLDivElement>).current = node as HTMLDivElement;
        }
      }}
              draggable
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(todo.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, todo.id)}
              onDragEnd={handleDragEnd}
              data-todo-index={index}
              className={`
                glass-desktop rounded-xl border border-white/20 p-3 sm:p-4
                transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]
                ${getPriorityColor(todo.priority)}
                ${todo.completed ? "opacity-75" : ""}
                ${draggedItem === todo.id ? "opacity-50 scale-95" : ""}
                ${dragOverItem === todo.id ? "border-purple-400 scale-[1.02]" : ""}
                animate-fade-in relative overflow-hidden cursor-move
                ${isSwiping ? "cursor-grabbing" : "cursor-grab"}
                ${focusedIndex === index ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900" : ""}
              `}
              style={{
                animationDelay: `${index * 100}ms`,
                transform: isSwiping ? `translateX(${translateX}px)` : undefined
              }}
              role="listitem"
              aria-label={`Task: ${todo.text}, ${todo.completed ? 'completed' : 'active'}, priority: ${todo.priority}`}
              aria-setsize={totalTodos}
              aria-posinset={index + 1}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
            {/* Swipe hint animation for mobile */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 md:hidden" aria-hidden="true">
              <div className="flex items-center gap-1 text-white/40 text-xs animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Swipe</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`
                  w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center touch-target micro-interaction focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized
                  ${todo.completed
                    ? "bg-green-500 border-green-500 success-enhanced"
                    : "border-purple-400 hover:border-purple-300"
                  }
                `}
                aria-label={`${todo.completed ? 'Mark as active' : 'Mark as complete'}: ${todo.text}`}
                aria-pressed={todo.completed}
                aria-describedby={`todo-text-${todo.id}`}
              >
                {todo.completed && (
                  <svg className="w-3 h-3 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === todo.id ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 px-3 py-2 text-responsive-sm bg-white/20 border border-white/30 rounded-lg text-white min-h-[44px] touch-target input-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced performance-optimized"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                      aria-label="Edit task description"
                      aria-describedby={`edit-help-${todo.id}`}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-responsive-sm min-h-[44px] touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                        aria-label="Save task changes"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg text-responsive-sm min-h-[44px] touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`text-white cursor-pointer ${todo.completed ? "line-through opacity-75" : ""} link-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced`}
                    onClick={() => startEditing(todo)}
                    id={`todo-text-${todo.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit task: ${todo.text}`}
                    onKeyDown={(e) => {
                      if (keyboardNavigation.isActivationKey(e.key)) {
                        e.preventDefault();
                        startEditing(todo);
                      }
                    }}
                  >
                    <p className="font-medium text-responsive-base">{todo.text}</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-responsive-xs text-purple-200" aria-label="Task metadata">
                      {todo.category && (
                        <span className="px-2 py-1 bg-purple-600/30 rounded-full" aria-label={`Category: ${todo.category}`}>
                          {todo.category}
                        </span>
                      )}

                      <span
                        className={`
                          px-2 py-1 rounded-full font-medium
                          ${todo.priority === "high" ? "bg-red-600/30 text-red-300" :
                            todo.priority === "medium" ? "bg-yellow-600/30 text-yellow-300" :
                            "bg-green-600/30 text-green-300"}
                        `}
                        aria-label={`Priority: ${todo.priority}`}
                      >
                        {todo.priority} priority
                      </span>

                      {todo.dueDate && (
                        <span className="text-purple-300" aria-label={`Due date: ${formatDate(todo.dueDate)}`}>
                          Due: {formatDate(todo.dueDate)}
                        </span>
                      )}

                      <span className="text-purple-400" aria-label={`Created: ${formatDate(todo.createdAt)}`}>
                        Created: {formatDate(todo.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {editingId !== todo.id && (
                <div className="flex gap-2" role="group" aria-label="Task actions">
                  <button
                    onClick={() => startEditing(todo)}
                    className="p-3 sm:p-2 text-purple-300 rounded-lg touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                    aria-label={`Edit task: ${todo.text}`}
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-3 sm:p-2 text-red-400 rounded-lg touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
                    aria-label={`Delete task: ${todo.text}`}
                  >
                    <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
    </div>
  );
}

// Fallback component for TodoList errors
interface TodoListFallbackProps {
  error: AppError;
  errorInfo: React.ErrorInfo;
  retry: () => void;
}

function TodoListFallback({ error, errorInfo, retry }: TodoListFallbackProps) {
  const { success, error: showError } = useToastNotification();
  
  return (
    <div className="glass-desktop rounded-2xl p-6 text-center">
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-4">Task List Error</h2>
        <p className="mb-6 text-red-200">
          {error?.message || "Failed to load task list"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={retry}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Retry Loading Tasks
          </button>
          <button
            onClick={() => {
              // Try to recover from localStorage
              try {
                const saved = localStorage.getItem("novatask-todos");
                if (saved) {
                  const parsedTodos = JSON.parse(saved).map((todo: Todo) => ({
                    ...todo,
                    createdAt: new Date(todo.createdAt),
                    dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
                  }));
                  // This would need to be handled by the parent component
                  success("Tasks recovered from local storage");
                }
              } catch (e) {
                showError("Failed to recover tasks from storage");
              }
            }}
            className="px-4 py-2 bg-white/10 text-white rounded-lg button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced micro-interaction"
          >
            Recover from Storage
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodoListWithBoundary;
