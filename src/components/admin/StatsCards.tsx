import type { ContentStats } from "../../types/content.ts";

interface StatsCardsProps {
  stats: ContentStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    { label: "Total guides", value: stats.totalCards, tone: "text-[#131416]" },
    { label: "Published", value: stats.publishedCards, tone: "text-[#1e7b4f]" },
    { label: "Drafts", value: stats.draftCards, tone: "text-[#92400e]" },
    { label: "Modules", value: stats.totalCategories, tone: "text-[#2d5be3]" },
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-[#e8eaec] overflow-hidden rounded-[10px] border border-[#e8eaec] bg-[#ffffff] sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
            {item.label}
          </p>
          <p
            className={`num mt-1 text-[28px] font-normal leading-none tracking-tight ${item.tone}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
