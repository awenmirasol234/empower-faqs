import { ChevronDown } from "lucide-react";
import type { Category } from "../../types/content.ts";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  const options = [{ id: 0, name: "All", slug: "", display_order: -1 }, ...categories];

  return (
    <>
      {/* Mobile dropdown */}
      <div className="md:hidden">
        <label htmlFor="category-filter-select" className="sr-only">
          Filter by category
        </label>
        <div className="relative">
          <select
            id="category-filter-select"
            aria-label="Filter by category"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-12 text-sm leading-5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accentBlue focus:border-accentBlue"
          >
            {options.map((cat) => (
              <option key={cat.slug || "all"} value={cat.slug}>
                {cat.slug === "" ? "All Categories" : cat.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Desktop category pills */}
      <div className="hidden md:flex flex-wrap gap-2">
        {options.map((cat) => {
          const isActive = selected === cat.slug;
          return (
            <button
              key={cat.slug || "all"}
              type="button"
              onClick={() => onSelect(cat.slug)}
              className={
                isActive
                  ? "rounded-full bg-accentBlue px-4 py-2 text-sm font-medium text-white min-h-[44px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
                  : "rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
              }
              aria-pressed={isActive}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
