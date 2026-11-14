import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../../src/lib/apiHelpers.ts";
import { extractSessionIdFromRequest } from "../../src/lib/auth.ts";
import { hasValidAdminSession } from "../../src/lib/redis.ts";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const sessionId = extractSessionIdFromRequest(req);
    if (!sessionId) {
      sendJson(res, 401, { authenticated: false });
      return;
    }

    const valid = await hasValidAdminSession(sessionId);
    if (!valid) {
      sendJson(res, 401, { authenticated: false });
      return;
    }

    sendJson(res, 200, { authenticated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session check failed.";
    sendJson(res, 500, { error: message });
  }
}
