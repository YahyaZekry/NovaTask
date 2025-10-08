"use client";

interface TodoFiltersProps {
  filter: "all" | "active" | "completed";
  setFilter: (filter: "all" | "active" | "completed") => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
}

export function TodoFilters({
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  categories
}: TodoFiltersProps) {
  return (
    <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-3">
            Filter by Status
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "active" | "completed")}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
          >
            <option value="all" className="bg-slate-800">All Tasks</option>
            <option value="active" className="bg-slate-800">Active Tasks</option>
            <option value="completed" className="bg-slate-800">Completed Tasks</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-3">
            Filter by Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
          >
            <option value="all" className="bg-slate-800">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category} className="bg-slate-800">
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
