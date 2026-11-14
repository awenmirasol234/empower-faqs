import type { Category } from "../../types/content.ts";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
  totalCount: number;
  countsBySlug: Record<string, number>;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  totalCount,
  countsBySlug,
}: CategoryFilterProps) {
  const options = [
    { id: 0, name: "All guides", slug: "", display_order: -1 },
    ...categories,
  ];

  return (
    <nav aria-label="Module index" className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#5d5f60]">
        Modules
      </div>
      {options.map((cat) => {
        const isActive = selected === cat.slug;
        const count = cat.slug === "" ? totalCount : countsBySlug[cat.slug] ?? 0;

        return (
          <button
            key={cat.slug || "all"}
            type="button"
            onClick={() => onSelect(cat.slug)}
            aria-pressed={isActive}
            className={
              isActive
                ? "flex w-full items-center justify-between gap-2 rounded-[6px] bg-[#2d5be3] px-2.5 py-1.5 text-left text-[13px] font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
                : "flex w-full items-center justify-between gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] font-normal text-[#5d5f60] transition-colors hover:bg-[#eef3fe] hover:text-[#2d5be3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
            }
          >
            <span className="truncate">{cat.name}</span>
            <span
              className={`num shrink-0 text-[11px] ${
                isActive ? "text-white/90" : "text-[#5d5f60]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
