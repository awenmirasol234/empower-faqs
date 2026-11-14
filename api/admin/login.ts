import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readJsonBody, sendJson } from "../../src/lib/apiHelpers.js";
import {
  buildSessionCookie,
  generateSessionId,
  getClientIp,
  setCookieHeader,
  signSessionId,
  verifyAdminPassword,
} from "../../src/lib/auth.js";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  createAdminSession,
  recordFailedLoginAttempt,
} from "../../src/lib/redis.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const ip = getClientIp(req);
    const rate = await checkLoginRateLimit(ip);
    if (!rate.allowed) {
      sendJson(res, 429, {
        error: "Too many failed login attempts. Please wait 15 minutes and try again.",
      });
      return;
    }

    const body = await readJsonBody<{ password?: string }>(req);
    const password = typeof body.password === "string" ? body.password : "";

    if (!password) {
      sendJson(res, 400, { error: "Password is required." });
      return;
    }

    if (!process.env.ADMIN_PASSWORD_HASH?.trim()) {
      sendJson(res, 500, {
        error: "Server authentication is not configured (missing ADMIN_PASSWORD_HASH).",
      });
      return;
    }

    const valid = verifyAdminPassword(password);
    if (!valid) {
      await recordFailedLoginAttempt(ip);
      sendJson(res, 401, { error: "Invalid admin password." });
      return;
    }

    await clearLoginRateLimit(ip);

    const sessionId = generateSessionId();
    await createAdminSession(sessionId);

    const signedToken = signSessionId(sessionId);
    setCookieHeader(res, buildSessionCookie(signedToken));

    sendJson(res, 200, { authenticated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    sendJson(res, 500, { error: message });
  }
}
