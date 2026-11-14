import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Eye, Play, X } from "lucide-react";
import { getYouTubeEmbedUrl } from "../../services/youtubeService.ts";
import type { ContentCard } from "../../types/content.ts";

interface VideoModalProps {
  card: ContentCard | null;
  categoryName?: string;
  open: boolean;
  onClose: () => void;
}

interface TranscriptCue {
  raw: string;
  timestamp: string | null;
  seconds: number | null;
  text: string;
}

function parseTimestampSeconds(stamp: string): number | null {
  const parts = stamp.split(":").map((part) => Number(part));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

function parseTranscriptCues(transcript: string): TranscriptCue[] {
  return transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^[\[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?\s*[-:|]?\s*(.*)$/
      );
      if (!match) {
        return { raw: line, timestamp: null, seconds: null, text: line };
      }
      const timestamp = match[1];
      const seconds = parseTimestampSeconds(timestamp);
      return {
        raw: line,
        timestamp,
        seconds,
        text: match[2] || line,
      };
    });
}

export function VideoModal({
  card,
  categoryName,
  open,
  onClose,
}: VideoModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [seekSeconds, setSeekSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeekSeconds(null);
  }, [card?.id]);

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

  const transcriptCues = useMemo(
    () => (card?.transcript ? parseTranscriptCues(card.transcript) : []),
    [card?.transcript]
  );

  if (!open || !card) return null;

  const views = typeof card.views === "number" ? card.views : 0;
  const hasVideo = Boolean(card.youtube_id);
  const tags = card.tags
    ? card.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const baseEmbedUrl = getYouTubeEmbedUrl(card.youtube_id);
  const embedSrc =
    seekSeconds !== null
      ? `${baseEmbedUrl}?start=${seekSeconds}&autoplay=1`
      : baseEmbedUrl;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-[#131416]/50 p-2 sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        data-ui="modal"
        className="flex max-h-[92vh] w-[95vw] max-w-3xl flex-col overflow-hidden rounded-[12px] border border-[#e8eaec] bg-[#ffffff]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#e8eaec] bg-[#f4f6f8] px-4 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-[5px] border border-[#e8eaec] bg-[#ffffff] px-2 py-0.5 text-[11px] font-medium text-[#131416]">
              {hasVideo ? "Video guide" : "FAQ"}
            </span>
            {categoryName && (
              <span className="truncate text-[12px] font-medium text-[#5d5f60]">
                {categoryName}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {hasVideo && card.youtube_url && (
              <a
                href={card.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#ebedee]"
              >
                YouTube
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded-[6px] border border-[#e8eaec] bg-[#ffffff] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {hasVideo && (
          <div className="relative aspect-video w-full shrink-0 border-b border-[#e8eaec] bg-[#131416]">
            <iframe
              key={`${card.id}-${seekSeconds ?? "init"}`}
              src={embedSrc}
              title={card.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="flex-1 break-words text-[18px] font-semibold leading-[1.3] text-[#131416]">
              {card.title}
            </h2>
            <span className="num inline-flex items-center gap-1 rounded-[5px] border border-[#e8eaec] bg-[#f4f6f8] px-2 py-0.5 text-[12px] font-medium text-[#5d5f60]">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {views} {views === 1 ? "view" : "views"}
            </span>
          </div>

          {card.description && (
            <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.55] text-[#353736]">
              {card.description}
            </p>
          )}

          {(card.presenter ||
            card.organization ||
            card.location ||
            card.duration ||
            card.date ||
            card.language) && (
            <dl className="grid grid-cols-1 gap-3 rounded-[8px] border border-[#e8eaec] bg-[#f4f6f8] p-3.5 text-[13px] sm:grid-cols-3">
              {card.presenter && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Presenter
                  </dt>
                  <dd className="mt-0.5 break-words text-[#131416]">
                    {card.presenter}
                  </dd>
                </div>
              )}
              {card.organization && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Organization
                  </dt>
                  <dd className="mt-0.5 break-words text-[#131416]">
                    {card.organization}
                  </dd>
                </div>
              )}
              {card.location && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Location
                  </dt>
                  <dd className="mt-0.5 break-words text-[#131416]">
                    {card.location}
                  </dd>
                </div>
              )}
              {card.duration && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Duration
                  </dt>
                  <dd className="num mt-0.5 break-words font-mono text-[12px] text-[#131416]">
                    {card.duration}
                  </dd>
                </div>
              )}
              {card.date && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Date
                  </dt>
                  <dd className="num mt-0.5 break-words font-mono text-[12px] text-[#131416]">
                    {card.date}
                  </dd>
                </div>
              )}
              {card.language && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                    Language
                  </dt>
                  <dd className="mt-0.5 break-words text-[#131416]">
                    {card.language}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[5px] border border-[#e8eaec] bg-[#f4f6f8] px-2 py-0.5 text-[11px] text-[#5d5f60]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {transcriptCues.length > 0 && (
            <div className="overflow-hidden rounded-[8px] border border-[#e8eaec] bg-[#ffffff]">
              <div className="flex items-center justify-between border-b border-[#e8eaec] bg-[#f4f6f8] px-3.5 py-2">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#5d5f60]">
                  Transcript
                </h3>
                {hasVideo &&
                  transcriptCues.some((cue) => cue.seconds !== null) && (
                    <span className="text-[11px] text-[#5d5f60]">
                      Click a timestamp to jump
                    </span>
                  )}
              </div>
              <div className="divide-y divide-[#f0f1f2]">
                {transcriptCues.map((cue, idx) => {
                  const isClickable = hasVideo && cue.seconds !== null;
                  const isActive =
                    isClickable && seekSeconds === cue.seconds;

                  if (isClickable) {
                    return (
                      <button
                        key={`${cue.timestamp}-${idx}`}
                        type="button"
                        onClick={() => setSeekSeconds(cue.seconds)}
                        className={`flex w-full items-start gap-3 px-3.5 py-2 text-left text-[13px] transition-colors ${
                          isActive
                            ? "bg-[#ebedee] text-[#131416]"
                            : "hover:bg-[#f4f6f8] text-[#353736]"
                        }`}
                      >
                        <span className="num inline-flex shrink-0 items-center gap-1 rounded border border-[#e8eaec] bg-[#ffffff] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#2d5be3]">
                          <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                          {cue.timestamp}
                        </span>
                        <span className="break-words leading-[1.45]">
                          {cue.text}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="px-3.5 py-2 text-[13px] leading-[1.45] text-[#353736]"
                    >
                      {cue.raw}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
