import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../../../src/lib/apiHelpers.js";
import { getClientIp } from "../../../src/lib/auth.js";
import { incrementCardView } from "../../../src/lib/redis.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rawId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    const cardId = Number(rawId);

    if (!Number.isInteger(cardId) || cardId <= 0) {
      sendJson(res, 400, { error: "Invalid card ID." });
      return;
    }

    const ip = getClientIp(req);
    const result = await incrementCardView(cardId, ip);
    if (!result) {
      sendJson(res, 404, { error: "Card not found." });
      return;
    }

    if (!result.incremented) {
      sendJson(res, 429, {
        views: result.views,
        error: "You have already viewed this recently.",
      });
      return;
    }

    sendJson(res, 200, { views: result.views });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record view.";
    sendJson(res, 500, { error: message });
  }
}
