import { Eye, HelpCircle } from "lucide-react";
import type { ContentCard } from "../../types/content.ts";

interface FaqCardProps {
  faq: ContentCard;
  categoryName?: string;
  onClick: () => void;
  isMostViewed: boolean;
}

export function FaqCard({
  faq,
  categoryName,
  onClick,
  isMostViewed,
}: FaqCardProps) {
  const tags = faq.tags
    ? faq.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const views = typeof faq.views === "number" ? faq.views : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue min-h-[44px]"
    >
      <div className="relative flex aspect-video w-full flex-col justify-between bg-gradient-to-br from-zinc-50 to-zinc-100 p-4 border-b border-zinc-100">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-accentBlue border border-zinc-200 shadow-sm">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            FAQ
          </span>
          {isMostViewed && (
            <span className="rounded-full bg-[#2D5BE3] px-2.5 py-1 text-xs font-semibold text-white shadow">
              Most Viewed
            </span>
          )}
        </div>

        <p className="break-words text-base font-semibold leading-snug text-zinc-900 line-clamp-2">
          {faq.title}
        </p>

        <div className="flex items-center justify-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/75 px-2 py-1 text-xs font-medium text-white">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {categoryName && (
          <span className="w-fit rounded-full bg-accentBlue px-2.5 py-1 text-xs font-medium text-white">
            {categoryName}
          </span>
        )}

        {faq.description && (
          <p className="break-words text-sm leading-relaxed text-zinc-600 line-clamp-2">
            {faq.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views} {views === 1 ? "view" : "views"}
          </span>
          <span className="text-xs font-medium text-accentBlue group-hover:underline">
            Read answer →
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 break-words"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
