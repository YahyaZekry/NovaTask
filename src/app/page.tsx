"use client";

import { useState, useEffect } from "react";
import { TodoForm } from "@/components/TodoForm";
import { TodoList } from "@/components/TodoList";
import { TodoStats } from "@/components/TodoStats";
import { TodoFilters } from "@/components/TodoFilters";
import { NovaLogo } from "@/components/NovaLogo";
import { MobileNavigation } from "@/components/MobileNavigation";
import { SlidePanel } from "@/components/SlidePanel";
import { useErrorHandler } from "@/contexts/ErrorContext";

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
  const { handleError } = useErrorHandler();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  
  // Mobile navigation state
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 safe-top safe-bottom">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <NovaLogo />
              <TodoStats todos={todos} />
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <MobileNavigation
          onAddTask={() => setIsMobileFormOpen(true)}
          onToggleFilters={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          isFiltersOpen={isMobileFiltersOpen}
        />

        {/* Mobile Slide Panels */}
        <div className="md:hidden">
          {/* Mobile Task Form Panel */}
          <SlidePanel
            isOpen={isMobileFormOpen}
            onClose={() => setIsMobileFormOpen(false)}
            direction="up"
            size="full"
          >
            <div className="p-4 pt-2">
              <h2 id="slide-up-panel-title" className="text-xl font-semibold text-white mb-4 text-center">
                Create New Task
              </h2>
              <TodoForm
                todos={todos}
                setTodos={setTodos}
                categories={categories}
                onClose={() => setIsMobileFormOpen(false)}
                isMobilePanel={true}
              />
            </div>
          </SlidePanel>

          {/* Mobile Filters Panel */}
          <SlidePanel
            isOpen={isMobileFiltersOpen}
            onClose={() => setIsMobileFiltersOpen(false)}
            direction="right"
            size="md"
          >
            <div className="p-4">
              <h2 id="slide-panel-title" className="text-xl font-semibold text-white mb-4 text-center">
                Filter Tasks
              </h2>
              <TodoFilters
                filter={filter}
                setFilter={setFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                onClose={() => setIsMobileFiltersOpen(false)}
                isMobilePanel={true}
              />
            </div>
          </SlidePanel>
        </div>

        {/* Main content - Responsive Layout */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile Layout (< md) */}
          <div className="block md:hidden">
            {/* Todo List Section - Main view on mobile */}
            <div className="glass-mobile rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4 text-center">Your Tasks</h2>
              <TodoList
                todos={filteredTodos}
                setTodos={setTodos}
                onAddTask={() => setIsMobileFormOpen(true)}
              />
            </div>
          </div>

          {/* Tablet Layout (md to lg) */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-1 gap-4">
              {/* Top row: Task Form and Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-desktop rounded-2xl p-4">
                  <h2 className="text-lg font-semibold text-white mb-4 text-center">Create New Task</h2>
                  <TodoForm todos={todos} setTodos={setTodos} categories={categories} />
                </div>
                <div className="glass-desktop rounded-2xl p-4">
                  <h2 className="text-lg font-semibold text-white mb-4 text-center">Filter Tasks</h2>
                  <TodoFilters
                    filter={filter}
                    setFilter={setFilter}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    categories={categories}
                  />
                </div>
              </div>

              {/* Bottom row: Todo List */}
              <div className="glass-desktop rounded-2xl p-4">
                <h2 className="text-lg font-semibold text-white mb-4 text-center">Your Tasks</h2>
                <TodoList todos={filteredTodos} setTodos={setTodos} />
              </div>
            </div>
          </div>

          {/* Desktop Layout (≥ lg) - 3 Column Layout */}
          <div className="hidden lg:block">
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
                    className="w-10 h-10 rounded-lg bg-white/10 group flex items-center justify-center shadow-lg border border-white/20 touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced"
                    title="Hide Task Form"
                  >
                    <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setLeftSidebarVisible(true)}
                    className="w-10 h-10 rounded-lg bg-white/10 group flex items-center justify-center shadow-lg border border-white/20 touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced"
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
                    className="w-10 h-10 rounded-lg bg-white/10 group flex items-center justify-center shadow-lg border border-white/20 touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced"
                    title="Hide Filters"
                  >
                    <svg className="w-5 h-5 text-white/70 group-hover:text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setRightSidebarVisible(true)}
                    className="w-10 h-10 rounded-lg bg-white/10 group flex items-center justify-center shadow-lg border border-white/20 touch-target button-hover-enhanced focus-enhanced keyboard-enhanced accessibility-enhanced mobile-enhanced desktop-enhanced"
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
          </div>
        </main>
      </div>
    </div>
  );
}
