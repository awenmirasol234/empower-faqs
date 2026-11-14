export type CardType = "video" | "faq";
export type ContentStatus = "published" | "draft" | "hidden";
export type ThumbnailMode = "youtube" | "custom";

export interface SiteConfig {
  title: string;
  description: string;
  logo?: string;
  contact?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number;
}

export interface ContentCard {
  id: number;
  type: CardType;
  title: string;
  description: string | null;
  category_id: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  tags: string | null;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string;
  thumbnail_mode: ThumbnailMode;
  thumbnail_url: string | null;
  transcript: string | null;
  language: string | null;
  presenter: string | null;
  organization: string | null;
  location: string | null;
  duration: string | null;
  date: string | null;
  notes: string | null;
  status: ContentStatus;
  display_order: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface ContentDocument {
  version: number;
  updatedAt: string;
  site: SiteConfig;
  categories: Category[];
  cards: ContentCard[];
}

export interface ContentStats {
  totalCards: number;
  publishedCards: number;
  draftCards: number;
  hiddenCards: number;
  totalCategories: number;
}
