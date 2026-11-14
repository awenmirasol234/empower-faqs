import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson } from "../src/lib/apiHelpers.ts";
import { getContentDocument } from "../src/lib/redis.ts";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const doc = await getContentDocument();
    const publishedCards = doc.cards
      .filter((card) => card.status === "published")
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id);

    const sortedCategories = [...doc.categories].sort(
      (a, b) => a.display_order - b.display_order || a.id - b.id
    );

    sendJson(res, 200, {
      version: doc.version,
      updatedAt: doc.updatedAt,
      site: doc.site,
      categories: sortedCategories,
      cards: publishedCards,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load content.";
    sendJson(res, 500, { error: message });
  }
}
