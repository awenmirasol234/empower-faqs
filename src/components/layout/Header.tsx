import type { Category, SiteConfig } from "../../types/content.ts";
import { CategoryFilter } from "./CategoryFilter.tsx";
import { SearchBar } from "./SearchBar.tsx";

interface HeaderProps {
  site: SiteConfig;
  itemCount: number;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export function Header({
  site,
  itemCount,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              {site.title}
            </h1>
            <span className="text-sm text-zinc-500">
              {itemCount} {itemCount === 1 ? "item" : "videos"}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar value={searchQuery} onChange={onSearchChange} />
          </div>

          {site.description && (
            <p className="break-words text-sm text-zinc-500">{site.description}</p>
          )}

          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={onSelectCategory}
          />
        </div>
      </div>
    </header>
  );
}
