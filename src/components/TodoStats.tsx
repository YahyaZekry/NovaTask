"use client";

import { Todo } from "@/app/page";

interface TodoStatsProps {
  todos: Todo[];
}

export function TodoStats({ todos }: TodoStatsProps) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;
  const active = total - completed;
  const overdue = todos.filter((todo) =>
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex gap-4 text-white">
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-300">{total}</div>
        <div className="text-xs text-purple-200">Total</div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{active}</div>
        <div className="text-xs text-purple-200">Active</div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">{completed}</div>
        <div className="text-xs text-purple-200">Done</div>
      </div>

      {overdue > 0 && (
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{overdue}</div>
          <div className="text-xs text-purple-200">Overdue</div>
        </div>
      )}

      <div className="text-center">
        <div className="text-lg font-semibold text-purple-300">{completionRate}%</div>
        <div className="text-xs text-purple-200">Complete</div>
      </div>
    </div>
  );
}
