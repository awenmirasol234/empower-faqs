import { Eye, Play } from "lucide-react";
import {
  getYouTubeThumbnailUrl,
  resolveCardThumbnail,
} from "../../services/youtubeService.ts";
import type { ContentCard } from "../../types/content.ts";

interface VideoCardProps {
  video: ContentCard;
  categoryName?: string;
  onClick: () => void;
  isMostViewed: boolean;
}

export function VideoCard({
  video,
  categoryName,
  onClick,
  isMostViewed,
}: VideoCardProps) {
  const thumbSrc = resolveCardThumbnail(video);
  const fallbackThumb = video.youtube_id
    ? getYouTubeThumbnailUrl(video.youtube_id)
    : "";
  const tags = video.tags
    ? video.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const views = typeof video.views === "number" ? video.views : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-[10px] border border-[#e8eaec] bg-[#ffffff] text-left transition-colors hover:border-[#2d5be3]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
    >
      <div className="relative aspect-video w-full overflow-hidden border-b border-[#f0f1f2] bg-[#f4f6f8]">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => {
              const img = e.currentTarget;
              if (fallbackThumb && img.src !== fallbackThumb) {
                img.src = fallbackThumb;
              } else {
                img.style.display = "none";
              }
            }}
          />
        ) : null}

        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#131416]/80 text-white transition-colors group-hover:bg-[#131416]">
            <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
          </span>
        </span>

        {isMostViewed && (
          <span className="absolute left-2 top-2 rounded-[5px] bg-[#2d5be3] px-2 py-0.5 text-[11px] font-medium text-white">
            Most viewed
          </span>
        )}

        {video.duration && (
          <span className="num absolute bottom-2 right-2 rounded-[5px] bg-[#131416]/85 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
            {video.duration}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {categoryName && (
          <span className="w-fit rounded-[5px] bg-[#eef3fe] px-2 py-0.5 text-[11px] font-medium text-[#2d5be3]">
            {categoryName}
          </span>
        )}

        <h3 className="line-clamp-2 break-words text-[14px] font-medium leading-[1.35] text-[#131416]">
          {video.title}
        </h3>

        {video.description && (
          <p className="line-clamp-2 break-words text-[13px] leading-[1.45] text-[#5d5f60]">
            {video.description}
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#f0f1f2] pt-2.5 text-[12px] text-[#5d5f60]">
          <span className="num inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views} {views === 1 ? "view" : "views"}
          </span>
          {video.youtube_id && (
            <span className="font-mono text-[11px] text-[#5d5f60]">
              {video.youtube_id}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
