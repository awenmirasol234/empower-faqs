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
        .slice(0, 4)
    : [];
  const views = typeof video.views === "number" ? video.views : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue min-h-[44px]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
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
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition group-hover:bg-black/70">
            <Play className="h-[18px] w-[18px] fill-current ml-0.5" aria-hidden="true" />
          </span>
        </span>

        {isMostViewed && (
          <span className="absolute left-2 top-2 rounded-full bg-[#2D5BE3] px-2.5 py-1 text-xs font-semibold text-white shadow">
            Most Viewed
          </span>
        )}

        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {views}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="break-words text-sm font-semibold leading-snug text-zinc-900 sm:text-[15px] line-clamp-2">
          {video.title}
        </h3>

        {categoryName && (
          <span className="w-fit rounded-full bg-accentBlue px-2.5 py-1 text-xs font-medium text-white">
            {categoryName}
          </span>
        )}

        {video.description && (
          <p className="break-words text-sm leading-relaxed text-zinc-600 line-clamp-2">
            {video.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views} {views === 1 ? "view" : "views"}
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
