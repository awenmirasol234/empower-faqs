import type {
  Category,
  ContentCard,
  ContentDocument,
  ContentStats,
  SiteConfig,
} from "../types/content.ts";

export interface PublicContentResponse {
  version: number;
  updatedAt: string;
  site: SiteConfig;
  categories: Category[];
  cards: ContentCard[];
}

export interface AdminContentResponse extends ContentDocument {
  stats: ContentStats;
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("json");
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (isJsonResponse(response)) {
      try {
        const payload = (await response.json()) as {
          error?: string;
          message?: string;
        };
        if (typeof payload.error === "string" && payload.error) {
          message = payload.error;
        } else if (typeof payload.message === "string" && payload.message) {
          message = payload.message;
        }
      } catch {
        // ignore JSON parse failure
      }
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  if (!isJsonResponse(response)) {
    throw new Error(
      "API returned non-JSON response. Please ensure the API server is running."
    );
  }

  return (await response.json()) as T;
}

export async function fetchPublicContent(): Promise<PublicContentResponse> {
  const response = await fetch("/api/content", { cache: "no-store" });
  return parseJsonOrThrow<PublicContentResponse>(response);
}

export async function recordCardView(
  cardId: number
): Promise<{ status: number; views?: number; error?: string }> {
  const response = await fetch(`/api/videos/${cardId}/view`, {
    method: "POST",
  });
  const payload = isJsonResponse(response)
    ? ((await response.json().catch(() => ({}))) as {
        views?: number;
        error?: string;
      })
    : {};
  return {
    status: response.status,
    views: payload.views,
    error: payload.error,
  };
}

export async function checkAdminSession(): Promise<boolean> {
  const response = await fetch("/api/admin/session", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return false;
  const data = (await response.json().catch(() => ({}))) as { authenticated?: boolean };
  return Boolean(data.authenticated);
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  await parseJsonOrThrow(response);
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchAdminContent(): Promise<AdminContentResponse> {
  const response = await fetch("/api/admin/content", {
    credentials: "include",
    cache: "no-store",
  });
  return parseJsonOrThrow<AdminContentResponse>(response);
}

export async function saveAdminContent(
  content: ContentDocument,
  expectedVersion?: number
): Promise<AdminContentResponse> {
  const response = await fetch("/api/admin/content", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, expectedVersion }),
  });
  return parseJsonOrThrow<AdminContentResponse>(response);
}
