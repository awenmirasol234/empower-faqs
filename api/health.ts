import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../src/lib/apiHelpers.js";
import { getContentDocument } from "../src/lib/redis.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const hasRedisEnv = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
  const hasAuthEnv = Boolean(
    process.env.SESSION_SECRET && process.env.ADMIN_PASSWORD_HASH
  );

  try {
    const doc = await getContentDocument();
    sendJson(res, 200, {
      ok: true,
      hasRedisEnv,
      hasAuthEnv,
      cardCount: doc.cards.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed.";
    sendJson(res, 503, {
      ok: false,
      hasRedisEnv,
      hasAuthEnv,
      error: message,
    });
  }
}
