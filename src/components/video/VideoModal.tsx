import { useEffect, useRef } from "react";
import { Eye, X } from "lucide-react";
import { getYouTubeEmbedUrl } from "../../services/youtubeService.ts";
import type { ContentCard } from "../../types/content.ts";

interface VideoModalProps {
  card: ContentCard | null;
  categoryName?: string;
  open: boolean;
  onClose: () => void;
}

export function VideoModal({
  card,
  categoryName,
  open,
  onClose,
}: VideoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !card) return null;

  const views = typeof card.views === "number" ? card.views : 0;
  const hasVideo = Boolean(card.youtube_id);
  const tags = card.tags
    ? card.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-2 sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        className="flex max-h-[92vh] w-[95vw] max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {hasVideo ? (
          <div className="relative aspect-video w-full shrink-0 bg-black">
            <iframe
              src={getYouTubeEmbedUrl(card.youtube_id)}
              title={card.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              Frequently Asked Question
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="break-words text-lg font-bold text-zinc-900 sm:text-xl flex-1">
              {card.title}
            </h2>
            {hasVideo && card.youtube_url && (
              <a
                href={card.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 min-h-[44px]"
              >
                Watch on YouTube
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="inline-block rounded-full bg-accentBlue px-3 py-1 text-xs font-medium text-white">
                {categoryName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {views} {views === 1 ? "view" : "views"}
            </span>
          </div>

          {card.description && (
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {card.description}
            </p>
          )}

          {(card.presenter ||
            card.organization ||
            card.location ||
            card.duration ||
            card.date ||
            card.language) && (
            <dl className="grid grid-cols-1 gap-2 rounded-lg bg-zinc-50 p-3 text-sm sm:grid-cols-2">
              {card.presenter && (
                <div>
                  <dt className="font-medium text-zinc-900">Presenter</dt>
                  <dd className="break-words text-zinc-600">{card.presenter}</dd>
                </div>
              )}
              {card.organization && (
                <div>
                  <dt className="font-medium text-zinc-900">Organization</dt>
                  <dd className="break-words text-zinc-600">{card.organization}</dd>
                </div>
              )}
              {card.location && (
                <div>
                  <dt className="font-medium text-zinc-900">Location</dt>
                  <dd className="break-words text-zinc-600">{card.location}</dd>
                </div>
              )}
              {card.duration && (
                <div>
                  <dt className="font-medium text-zinc-900">Duration</dt>
                  <dd className="break-words text-zinc-600">{card.duration}</dd>
                </div>
              )}
              {card.date && (
                <div>
                  <dt className="font-medium text-zinc-900">Date</dt>
                  <dd className="break-words text-zinc-600">{card.date}</dd>
                </div>
              )}
              {card.language && (
                <div>
                  <dt className="font-medium text-zinc-900">Language</dt>
                  <dd className="break-words text-zinc-600">{card.language}</dd>
                </div>
              )}
            </dl>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {card.transcript && (
            <div className="rounded-lg bg-zinc-50 p-3">
              <h3 className="text-sm font-medium text-zinc-900">Transcript</h3>
              <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-600 font-sans">
                {card.transcript}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
