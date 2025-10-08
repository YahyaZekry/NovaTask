"use client";

import { useState, useEffect } from "react";
import { TodoForm } from "@/components/TodoForm";
import { TodoList } from "@/components/TodoList";
import { TodoStats } from "@/components/TodoStats";
import { TodoFilters } from "@/components/TodoFilters";
import { NovaLogo } from "@/components/NovaLogo";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
  dueDate?: Date;
  createdAt: Date;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  // Default categories
  const defaultCategories = ["Work", "Personal", "Shopping", "Health", "Learning", "General"];

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("novatask-todos");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos).map((todo: Omit<Todo, 'id'> & { id: string }) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
        }));
        setTodos(parsedTodos);
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem("novatask-todos", JSON.stringify(todos));
  }, [todos]);

  const filteredTodos = todos.filter((todo) => {
    const matchesStatus = filter === "all"
      ? true
      : filter === "active"
        ? !todo.completed
        : todo.completed;

    const matchesCategory = categoryFilter === "all" || todo.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  // Get all unique categories from todos, combined with defaults
  const categories = Array.from(new Set([
    ...defaultCategories,
    ...todos.map((todo) => todo.category).filter(Boolean)
  ]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <NovaLogo />
              <TodoStats todos={todos} />
            </div>
          </div>
        </header>

        {/* Main content - 3 Column Layout */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-4 relative">
            {/* Left sidebar - Create New Task */}
            <div className={`w-80 flex-shrink-0 transition-all duration-500 ease-in-out relative ${
              leftSidebarVisible ? 'translate-x-0 opacity-100 z-10' : 'translate-x-full opacity-0 pointer-events-none z-0'
            }`}>
              <div className="sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">Create New Task</h2>
                <TodoForm todos={todos} setTodos={setTodos} categories={categories} />
              </div>
            </div>

            {/* Left hide/show button - takes space in layout */}
            <div className="flex items-start justify-center w-12 pt-8">
              {leftSidebarVisible ? (
                <button
                  onClick={() => setLeftSidebarVisible(false)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 group flex items-center justify-center shadow-lg border border-white/20"
                  title="Hide Task Form"
                >
                  <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setLeftSidebarVisible(true)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 group flex items-center justify-center shadow-lg border border-white/20"
                  title="Show Task Form"
                >
                  <svg className="w-5 h-5 text-white/70 group-hover:text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Center - Your Tasks */}
            <div className="flex-1">
              <div className="flex justify-center mb-4">
                <h2 className="text-xl font-semibold text-white text-center">Your Tasks</h2>
              </div>
              <TodoList todos={filteredTodos} setTodos={setTodos} />
            </div>

            {/* Right hide/show button - takes space in layout */}
            <div className="flex items-start justify-center w-12 pt-8">
              {rightSidebarVisible ? (
                <button
                  onClick={() => setRightSidebarVisible(false)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 group flex items-center justify-center shadow-lg border border-white/20"
                  title="Hide Filters"
                >
                  <svg className="w-5 h-5 text-white/70 group-hover:text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setRightSidebarVisible(true)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110 group flex items-center justify-center shadow-lg border border-white/20"
                  title="Show Filters"
                >
                  <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Right sidebar - Filter Tasks */}
            <div className={`w-80 flex-shrink-0 transition-all duration-500 ease-in-out relative ${
              rightSidebarVisible ? 'translate-x-0 opacity-100 z-10' : '-translate-x-full opacity-0 pointer-events-none z-0'
            }`}>
              <div className="sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">Filter Tasks</h2>
                <TodoFilters
                  filter={filter}
                  setFilter={setFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  categories={categories}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
