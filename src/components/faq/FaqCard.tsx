import { ArrowRight, Eye, HelpCircle } from "lucide-react";
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
        .slice(0, 3)
    : [];
  const views = typeof faq.views === "number" ? faq.views : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-[10px] border border-[#e8eaec] bg-[#ffffff] text-left transition-colors hover:border-[#cdced1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
    >
      <div className="relative flex aspect-video w-full flex-col justify-between border-b border-[#e8eaec] bg-[#f4f6f8] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-[5px] border border-[#e8eaec] bg-[#ffffff] px-2 py-0.5 text-[11px] font-medium text-[#131416]">
            <HelpCircle className="h-3 w-3 text-[#2d5be3]" aria-hidden="true" />
            FAQ
          </span>
          {isMostViewed && (
            <span className="rounded-[5px] bg-[#2d5be3] px-2 py-0.5 text-[11px] font-medium text-white">
              Most viewed
            </span>
          )}
        </div>

        <p className="line-clamp-2 break-words text-[15px] font-medium leading-[1.35] text-[#131416]">
          {faq.title}
        </p>

        <div className="flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1 font-medium text-[#2d5be3] group-hover:underline">
            Read answer
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {categoryName && (
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#2d5be3]">
            {categoryName}
          </span>
        )}

        {faq.description && (
          <p className="line-clamp-2 break-words text-[13px] leading-[1.45] text-[#5d5f60]">
            {faq.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[5px] border border-[#e8eaec] bg-[#f4f6f8] px-1.5 py-0.5 text-[11px] text-[#5d5f60]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#f0f1f2] pt-2.5 text-[12px] text-[#5d5f60]">
          <span className="num inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views} {views === 1 ? "view" : "views"}
          </span>
          <span className="num text-[11px] text-[#5d5f60]">
            Guide #{faq.id}
          </span>
        </div>
      </div>
    </button>
  );
}
