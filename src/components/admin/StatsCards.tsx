import type { ContentStats } from "../../types/content.ts";

interface StatsCardsProps {
  stats: ContentStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    { label: "Total Cards", value: stats.totalCards, tone: "text-zinc-900" },
    { label: "Published Cards", value: stats.publishedCards, tone: "text-green-700" },
    { label: "Draft Cards", value: stats.draftCards, tone: "text-amber-700" },
    { label: "Total Categories", value: stats.totalCategories, tone: "text-accentBlue" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-zinc-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
