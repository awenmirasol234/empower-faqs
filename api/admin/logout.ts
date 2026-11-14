import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../../src/lib/apiHelpers.ts";
import {
  buildClearSessionCookie,
  extractSessionIdFromRequest,
  setCookieHeader,
} from "../../src/lib/auth.ts";
import { deleteAdminSession } from "../../src/lib/redis.ts";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const sessionId = extractSessionIdFromRequest(req);
    if (sessionId) {
      await deleteAdminSession(sessionId);
    }
    setCookieHeader(res, buildClearSessionCookie());
    sendJson(res, 200, { authenticated: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed.";
    sendJson(res, 500, { error: message });
  }
}
