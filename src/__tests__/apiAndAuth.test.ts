import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicContent } from "../services/contentService.ts";
import {
  generateSessionId,
  signSessionId,
  verifyAdminPassword,
  verifySignedSessionToken,
} from "../lib/auth.ts";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  ConflictError,
  createAdminSession,
  deleteAdminSession,
  getContentDocument,
  hasValidAdminSession,
  incrementCardView,
  recordFailedLoginAttempt,
  saveContentDocument,
} from "../lib/redis.ts";
import {
  validateContentDocument,
  ValidationError,
} from "../lib/validation.ts";

describe("auth, validation, and storage", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-session-secret-1234567890";
    const salt = "0123456789abcdef";
    const derived = crypto.scryptSync("super-secret-pass", salt, 64).toString("hex");
    process.env.ADMIN_PASSWORD_HASH = `scrypt:${salt}:${derived}`;
  });

  it("verifies scrypt admin password hash safely", () => {
    expect(verifyAdminPassword("super-secret-pass")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
    expect(verifyAdminPassword("")).toBe(false);
  });

  it("signs and verifies session tokens", () => {
    const id = generateSessionId();
    const token = signSessionId(id);
    expect(verifySignedSessionToken(token)).toBe(id);
    expect(verifySignedSessionToken(`${token}tampered`)).toBeNull();
  });

  it("stores and revokes admin sessions", async () => {
    const id = generateSessionId();
    await createAdminSession(id);
    expect(await hasValidAdminSession(id)).toBe(true);
    await deleteAdminSession(id);
    expect(await hasValidAdminSession(id)).toBe(false);
  });

  it("rate-limits login attempts after 5 failures", async () => {
    const ip = "198.51.100.10";
    await clearLoginRateLimit(ip);

    for (let i = 0; i < 5; i++) {
      expect((await checkLoginRateLimit(ip)).allowed).toBe(true);
      await recordFailedLoginAttempt(ip);
    }
    expect((await checkLoginRateLimit(ip)).allowed).toBe(false);

    await clearLoginRateLimit(ip);
    expect((await checkLoginRateLimit(ip)).allowed).toBe(true);
  });

  it("seeds initial content and enforces optimistic concurrency", async () => {
    const doc = await getContentDocument();
    expect(doc.categories.length).toBe(15);
    expect(doc.cards.length).toBeGreaterThanOrEqual(7);

    const next = {
      ...doc,
      cards: [
        ...doc.cards,
        {
          ...doc.cards[0],
          id: 999,
          type: "faq" as const,
          title: "Draft FAQ Question",
          description: "Draft answer",
          youtube_url: "",
          youtube_id: "",
          thumbnail: "",
          status: "draft" as const,
        },
      ],
    };

    const saved = await saveContentDocument(next, doc.version);
    expect(saved.version).toBe(doc.version + 1);
    expect(saved.cards.some((c) => c.id === 999 && c.status === "draft")).toBe(true);

    // Stale version should throw ConflictError
    await expect(saveContentDocument(next, doc.version)).rejects.toBeInstanceOf(
      ConflictError
    );
  });

  it("rejects malformed content documents", () => {
    expect(() => validateContentDocument(null)).toThrow(ValidationError);
    expect(() =>
      validateContentDocument({ categories: "not-an-array", cards: [] })
    ).toThrow(ValidationError);
  });

  it("increments view count with per-IP cooldown", async () => {
    const first = await incrementCardView(1, "203.0.113.5");
    expect(first?.incremented).toBe(true);

    const second = await incrementCardView(1, "203.0.113.5");
    expect(second?.incremented).toBe(false);
  });

  it("throws a clear error when API returns HTML instead of JSON", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<!doctype html><html></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    ) as typeof fetch;

    try {
      await expect(fetchPublicContent()).rejects.toThrow(
        "API returned non-JSON response. Please ensure the API server is running."
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
