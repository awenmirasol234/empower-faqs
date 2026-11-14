import type { IncomingMessage, ServerResponse } from "node:http";
import { extractSessionIdFromRequest } from "./auth.js";
import { hasValidAdminSession } from "./redis.js";

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export async function readJsonBody<T = Record<string, unknown>>(
  req: IncomingMessage & { body?: unknown }
): Promise<T> {
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body) as T;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

export async function requireAdminSession(
  req: IncomingMessage,
  res: ServerResponse
): Promise<string | null> {
  const sessionId = extractSessionIdFromRequest(req);
  if (!sessionId) {
    sendJson(res, 401, { error: "Unauthorized. Please log in." });
    return null;
  }

  const valid = await hasValidAdminSession(sessionId);
  if (!valid) {
    sendJson(res, 401, { error: "Session expired or invalid. Please log in again." });
    return null;
  }

  return sessionId;
}
