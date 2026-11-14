const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts an 11-character YouTube video ID from standard watch, shortener,
 * Shorts, and embed URLs.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const vParam = parsed.searchParams.get("v");
    if (vParam && YOUTUBE_ID_PATTERN.test(vParam)) {
      return vParam;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && (segments[0] === "embed" || segments[0] === "shorts")) {
      const id = segments[1];
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function resolveCardThumbnail(card: {
  youtube_id?: string;
  thumbnail?: string;
  thumbnail_mode?: string;
  thumbnail_url?: string | null;
}): string {
  if (card.thumbnail_mode === "custom" && card.thumbnail_url) {
    return card.thumbnail_url;
  }
  if (card.thumbnail) {
    return card.thumbnail;
  }
  if (card.youtube_id) {
    return getYouTubeThumbnailUrl(card.youtube_id);
  }
  return "";
}
