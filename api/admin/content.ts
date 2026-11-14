import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readJsonBody,
  requireAdminSession,
  sendJson,
} from "../../src/lib/apiHelpers.js";
import {
  ConflictError,
  getContentDocument,
  saveContentDocument,
} from "../../src/lib/redis.js";
import {
  computeContentStats,
  ValidationError,
} from "../../src/lib/validation.js";
import type { ContentDocument } from "../../src/types/content.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const sessionId = await requireAdminSession(req, res);
  if (!sessionId) return;

  if (req.method === "GET") {
    try {
      const doc = await getContentDocument();
      const sortedCategories = [...doc.categories].sort(
        (a, b) => a.display_order - b.display_order || a.id - b.id
      );
      const sortedCards = [...doc.cards].sort(
        (a, b) => a.display_order - b.display_order || a.id - b.id
      );

      sendJson(res, 200, {
        ...doc,
        categories: sortedCategories,
        cards: sortedCards,
        stats: computeContentStats(doc),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin content.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody<{
        content?: ContentDocument;
        expectedVersion?: number;
      } & Partial<ContentDocument>>(req);

      const docPayload = body.content ?? body;
      const expectedVersion =
        typeof body.expectedVersion === "number"
          ? body.expectedVersion
          : typeof docPayload.version === "number"
          ? docPayload.version
          : undefined;

      const saved = await saveContentDocument(
        docPayload as ContentDocument,
        expectedVersion
      );

      sendJson(res, 200, {
        ...saved,
        stats: computeContentStats(saved),
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        sendJson(res, 400, { error: err.message });
        return;
      }
      if (err instanceof ConflictError) {
        sendJson(res, 409, { error: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to save content.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
}
