"use client";

import { useState } from "react";
import { Todo } from "@/app/page";

interface TodoListProps {
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
}

export function TodoList({ todos, setTodos }: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = (id: string) => {
    if (editingText.trim()) {
      setTodos(todos.map((todo) =>
        todo.id === id ? { ...todo, text: editingText.trim() } : todo
      ));
    }
    setEditingId(null);
    setEditingText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

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

  if (todos.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-12 text-center">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
        <p className="text-purple-200">Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-2 shadow-2xl">
      <div className="space-y-3 px-2">
        {todos.map((todo, index) => (
          <div
            key={todo.id}
            className={`
              backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4
              transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]
              ${getPriorityColor(todo.priority)}
              ${todo.completed ? "opacity-75" : ""}
              animate-fade-in
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200 hover:scale-110
                  ${todo.completed
                    ? "bg-green-500 border-green-500"
                    : "border-purple-400 hover:border-purple-300"
                  }
                `}
              >
                {todo.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {editingId === todo.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(todo.id)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`text-white cursor-pointer ${todo.completed ? "line-through opacity-75" : ""}`}
                    onClick={() => startEditing(todo)}
                  >
                    <p className="font-medium">{todo.text}</p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-purple-200">
                      {todo.category && (
                        <span className="px-2 py-1 bg-purple-600/30 rounded-full text-xs">
                          {todo.category}
                        </span>
                      )}

                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${todo.priority === "high" ? "bg-red-600/30 text-red-300" :
                          todo.priority === "medium" ? "bg-yellow-600/30 text-yellow-300" :
                          "bg-green-600/30 text-green-300"}
                      `}>
                        {todo.priority} priority
                      </span>

                      {todo.dueDate && (
                        <span className="text-xs text-purple-300">
                          Due: {formatDate(todo.dueDate)}
                        </span>
                      )}

                      <span className="text-xs text-purple-400">
                        Created: {formatDate(todo.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {editingId !== todo.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(todo)}
                    className="p-2 text-purple-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Edit task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
