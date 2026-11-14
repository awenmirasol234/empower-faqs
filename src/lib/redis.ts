import { Redis } from "@upstash/redis";
import { INITIAL_CONTENT_DOCUMENT } from "../data/seedData.ts";
import type { ContentDocument } from "../types/content.ts";
import { SESSION_TTL_SECONDS } from "./auth.ts";
import { validateContentDocument } from "./validation.ts";

export const CONTENT_KEY = "empower:content:v1";
const SESSION_KEY_PREFIX = "empower:admin:session:";
const LOGIN_LIMIT_PREFIX = "empower:ratelimit:login:";
const VIEW_LIMIT_PREFIX = "empower:ratelimit:view:";

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minutes
const VIEW_COOLDOWN_SECONDS = 60;

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

interface MemoryEntry {
  value: unknown;
  expiresAt: number | null;
}

const memoryStore = new Map<string, MemoryEntry>();
let warnedAboutMemoryFallback = false;

function getRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();

  if (url && token) {
    return new Redis({ url, token });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Upstash Redis credentials (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN) must be configured in production."
    );
  }

  if (!warnedAboutMemoryFallback) {
    warnedAboutMemoryFallback = true;
    console.warn(
      "[redis] Upstash Redis credentials not set. Using in-memory fallback for local development."
    );
  }
  return null;
}

function getMemoryValue<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

function setMemoryValue(key: string, value: unknown, ttlSeconds?: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

function cloneDocument(doc: ContentDocument): ContentDocument {
  return JSON.parse(JSON.stringify(doc)) as ContentDocument;
}

export async function getContentDocument(): Promise<ContentDocument> {
  const redis = getRedisClient();

  if (redis) {
    const raw = await redis.get<unknown>(CONTENT_KEY);
    if (raw) {
      try {
        return validateContentDocument(raw);
      } catch {
        // If stored data is somehow malformed, do not crash public site
        return cloneDocument(INITIAL_CONTENT_DOCUMENT);
      }
    }
    const seeded = cloneDocument(INITIAL_CONTENT_DOCUMENT);
    await redis.set(CONTENT_KEY, seeded);
    return seeded;
  }

  const existing = getMemoryValue<ContentDocument>(CONTENT_KEY);
  if (existing) {
    return cloneDocument(existing);
  }

  const seeded = cloneDocument(INITIAL_CONTENT_DOCUMENT);
  setMemoryValue(CONTENT_KEY, seeded);
  return cloneDocument(seeded);
}

export async function saveContentDocument(
  nextDoc: ContentDocument,
  expectedVersion?: number
): Promise<ContentDocument> {
  const validated = validateContentDocument(nextDoc);
  const current = await getContentDocument();

  if (
    typeof expectedVersion === "number" &&
    current.version !== expectedVersion
  ) {
    throw new ConflictError(
      "Content was modified by another session. Please reload and try again."
    );
  }

  const updated: ContentDocument = {
    ...validated,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };

  const redis = getRedisClient();
  if (redis) {
    await redis.set(CONTENT_KEY, updated);
  } else {
    setMemoryValue(CONTENT_KEY, cloneDocument(updated));
  }

  return updated;
}

export async function createAdminSession(sessionId: string): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${sessionId}`;
  const payload = { createdAt: new Date().toISOString() };
  const redis = getRedisClient();

  if (redis) {
    await redis.set(key, payload, { ex: SESSION_TTL_SECONDS });
  } else {
    setMemoryValue(key, payload, SESSION_TTL_SECONDS);
  }
}

export async function hasValidAdminSession(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const key = `${SESSION_KEY_PREFIX}${sessionId}`;
  const redis = getRedisClient();

  if (redis) {
    const data = await redis.get<unknown>(key);
    return data !== null && data !== undefined;
  }

  return getMemoryValue<unknown>(key) !== null;
}

export async function deleteAdminSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const key = `${SESSION_KEY_PREFIX}${sessionId}`;
  const redis = getRedisClient();

  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

export async function checkLoginRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const key = `${LOGIN_LIMIT_PREFIX}${ip}`;
  const redis = getRedisClient();

  if (redis) {
    const attempts = (await redis.get<number>(key)) ?? 0;
    return {
      allowed: attempts < LOGIN_MAX_ATTEMPTS,
      remaining: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts),
    };
  }

  const attempts = getMemoryValue<number>(key) ?? 0;
  return {
    allowed: attempts < LOGIN_MAX_ATTEMPTS,
    remaining: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts),
  };
}

export async function recordFailedLoginAttempt(ip: string): Promise<void> {
  const key = `${LOGIN_LIMIT_PREFIX}${ip}`;
  const redis = getRedisClient();

  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, LOGIN_WINDOW_SECONDS);
    }
    return;
  }

  const current = getMemoryValue<number>(key) ?? 0;
  setMemoryValue(key, current + 1, LOGIN_WINDOW_SECONDS);
}

export async function clearLoginRateLimit(ip: string): Promise<void> {
  const key = `${LOGIN_LIMIT_PREFIX}${ip}`;
  const redis = getRedisClient();

  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

export async function incrementCardView(
  cardId: number,
  ip: string
): Promise<{ incremented: boolean; views: number } | null> {
  const doc = await getContentDocument();
  const cardIdx = doc.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return null;

  const limitKey = `${VIEW_LIMIT_PREFIX}${cardId}:${ip}`;
  const redis = getRedisClient();

  if (redis) {
    const alreadyViewed = await redis.get<unknown>(limitKey);
    if (alreadyViewed) {
      return { incremented: false, views: doc.cards[cardIdx].views };
    }
    await redis.set(limitKey, 1, { ex: VIEW_COOLDOWN_SECONDS });
  } else {
    if (getMemoryValue<number>(limitKey)) {
      return { incremented: false, views: doc.cards[cardIdx].views };
    }
    setMemoryValue(limitKey, 1, VIEW_COOLDOWN_SECONDS);
  }

  const nextViews = (doc.cards[cardIdx].views ?? 0) + 1;
  doc.cards[cardIdx] = {
    ...doc.cards[cardIdx],
    views: nextViews,
  };
  await saveContentDocument(doc);
  return { incremented: true, views: nextViews };
}
