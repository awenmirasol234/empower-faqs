import type {
  CardType,
  Category,
  ContentCard,
  ContentDocument,
  ContentStats,
  ContentStatus,
  ThumbnailMode,
} from "../types/content.js";
import { extractYouTubeId, getYouTubeThumbnailUrl } from "../services/youtubeService.js";

const VALID_TYPES = new Set<CardType>(["video", "faq"]);
const VALID_STATUSES = new Set<ContentStatus>(["published", "draft", "hidden"]);
const VALID_THUMBNAIL_MODES = new Set<ThumbnailMode>(["youtube", "custom"]);

export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asNullableString(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateCategoryInput(
  raw: unknown,
  fallbackId?: number
): Category {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Invalid category payload.");
  }
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (!name) {
    throw new ValidationError("Category name is required.");
  }
  const rawSlug = typeof obj.slug === "string" ? obj.slug.trim() : "";
  const slug = slugify(rawSlug || name);
  if (!slug) {
    throw new ValidationError("Category slug is invalid.");
  }
  const id =
    typeof obj.id === "number" && Number.isInteger(obj.id) && obj.id > 0
      ? obj.id
      : fallbackId ?? Date.now();
  const displayOrder =
    typeof obj.display_order === "number" && Number.isFinite(obj.display_order)
      ? obj.display_order
      : 0;

  return {
    id,
    name,
    slug,
    display_order: displayOrder,
  };
}

export function validateCardInput(
  raw: unknown,
  categories: Category[],
  existingCard?: ContentCard,
  fallbackId?: number
): ContentCard {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Invalid card payload.");
  }
  const obj = raw as Record<string, unknown>;

  const type: CardType =
    typeof obj.type === "string" && VALID_TYPES.has(obj.type as CardType)
      ? (obj.type as CardType)
      : existingCard?.type ?? "video";

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!title) {
    throw new ValidationError(
      type === "faq" ? "Question / title is required." : "Video title is required."
    );
  }

  let youtubeUrl = typeof obj.youtube_url === "string" ? obj.youtube_url.trim() : "";
  let youtubeId = typeof obj.youtube_id === "string" ? obj.youtube_id.trim() : "";

  if (type === "video") {
    const extracted = extractYouTubeId(youtubeUrl || youtubeId);
    if (!extracted) {
      throw new ValidationError("Please provide a valid YouTube URL.");
    }
    youtubeId = extracted;
    if (!youtubeUrl) {
      youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    }
  } else {
    // FAQ cards do not require a YouTube URL, but preserve if optionally provided
    if (youtubeUrl) {
      const extracted = extractYouTubeId(youtubeUrl);
      if (!extracted) {
        throw new ValidationError("Optional YouTube URL is invalid.");
      }
      youtubeId = extracted;
    } else {
      youtubeId = "";
    }
  }

  const thumbnailMode: ThumbnailMode =
    typeof obj.thumbnail_mode === "string" &&
    VALID_THUMBNAIL_MODES.has(obj.thumbnail_mode as ThumbnailMode)
      ? (obj.thumbnail_mode as ThumbnailMode)
      : "youtube";

  const thumbnailUrl =
    thumbnailMode === "custom" ? asNullableString(obj.thumbnail_url) : null;

  const thumbnail =
    youtubeId
      ? getYouTubeThumbnailUrl(youtubeId)
      : existingCard?.thumbnail ?? "";

  const status: ContentStatus =
    typeof obj.status === "string" && VALID_STATUSES.has(obj.status as ContentStatus)
      ? (obj.status as ContentStatus)
      : existingCard?.status ?? "draft";

  const categoryId =
    typeof obj.category_id === "number" && Number.isInteger(obj.category_id)
      ? obj.category_id
      : typeof obj.category_id === "string" && obj.category_id.trim() !== ""
      ? Number(obj.category_id)
      : null;

  const matchedCategory =
    categoryId !== null && Number.isInteger(categoryId)
      ? categories.find((c) => c.id === categoryId) ?? null
      : null;

  const displayOrder =
    typeof obj.display_order === "number" && Number.isFinite(obj.display_order)
      ? obj.display_order
      : existingCard?.display_order ?? 0;

  const views =
    typeof obj.views === "number" && Number.isFinite(obj.views) && obj.views >= 0
      ? Math.floor(obj.views)
      : existingCard?.views ?? 0;

  const now = new Date().toISOString();
  const id =
    typeof obj.id === "number" && Number.isInteger(obj.id) && obj.id > 0
      ? obj.id
      : existingCard?.id ?? fallbackId ?? Date.now();

  return {
    id,
    type,
    title,
    description: asNullableString(obj.description),
    category_id: matchedCategory ? matchedCategory.id : null,
    category: matchedCategory
      ? { id: matchedCategory.id, name: matchedCategory.name, slug: matchedCategory.slug }
      : null,
    tags: asNullableString(obj.tags),
    youtube_url: youtubeUrl,
    youtube_id: youtubeId,
    thumbnail,
    thumbnail_mode: thumbnailMode,
    thumbnail_url: thumbnailUrl,
    transcript: asNullableString(obj.transcript ?? obj.transcript_text),
    language: asNullableString(obj.language) ?? "English",
    presenter: asNullableString(obj.presenter),
    organization: asNullableString(obj.organization),
    location: asNullableString(obj.location),
    duration: asNullableString(obj.duration),
    date: asNullableString(obj.date),
    notes: asNullableString(obj.notes),
    status,
    display_order: displayOrder,
    views,
    created_at:
      typeof obj.created_at === "string" && obj.created_at
        ? obj.created_at
        : existingCard?.created_at ?? now,
    updated_at: now,
  };
}

export function validateContentDocument(raw: unknown): ContentDocument {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("Content document must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.categories)) {
    throw new ValidationError("Content document must include a categories array.");
  }
  if (!Array.isArray(obj.cards)) {
    throw new ValidationError("Content document must include a cards array.");
  }

  const rawSite = (obj.site && typeof obj.site === "object"
    ? obj.site
    : {}) as Record<string, unknown>;

  const site = {
    title:
      typeof rawSite.title === "string" && rawSite.title.trim()
        ? rawSite.title.trim()
        : "Video Library",
    description:
      typeof rawSite.description === "string" ? rawSite.description.trim() : "",
    logo: typeof rawSite.logo === "string" ? rawSite.logo.trim() : "/images/logo.png",
    contact: typeof rawSite.contact === "string" ? rawSite.contact.trim() : "",
  };

  const seenCatIds = new Set<number>();
  const categories: Category[] = obj.categories.map((cat, idx) => {
    const validated = validateCategoryInput(cat, idx + 1);
    if (seenCatIds.has(validated.id)) {
      throw new ValidationError(`Duplicate category id: ${validated.id}`);
    }
    seenCatIds.add(validated.id);
    return validated;
  });

  const seenCardIds = new Set<number>();
  const cards: ContentCard[] = obj.cards.map((card, idx) => {
    const validated = validateCardInput(card, categories, undefined, idx + 1);
    if (seenCardIds.has(validated.id)) {
      throw new ValidationError(`Duplicate card id: ${validated.id}`);
    }
    seenCardIds.add(validated.id);
    return validated;
  });

  const version =
    typeof obj.version === "number" && Number.isInteger(obj.version) && obj.version >= 1
      ? obj.version
      : 1;

  return {
    version,
    updatedAt: new Date().toISOString(),
    site,
    categories,
    cards,
  };
}

export function computeContentStats(doc: ContentDocument): ContentStats {
  let publishedCards = 0;
  let draftCards = 0;
  let hiddenCards = 0;

  for (const card of doc.cards) {
    if (card.status === "published") publishedCards++;
    else if (card.status === "draft") draftCards++;
    else if (card.status === "hidden") hiddenCards++;
  }

  return {
    totalCards: doc.cards.length,
    publishedCards,
    draftCards,
    hiddenCards,
    totalCategories: doc.categories.length,
  };
}
