import { ArrowDown, ArrowUp, HelpCircle } from "lucide-react";
import { resolveCardThumbnail } from "../../services/youtubeService.ts";
import type { Category, ContentCard } from "../../types/content.ts";

interface ContentTableProps {
  cards: ContentCard[];
  categories: Category[];
  saving?: boolean;
  onEdit: (card: ContentCard) => void;
  onDelete: (card: ContentCard) => void;
  onPreview: (card: ContentCard) => void;
  onTogglePublish: (card: ContentCard) => void;
  onMove: (cardId: number, direction: "up" | "down") => void;
}

function StatusBadge({ status }: { status: ContentCard["status"] }) {
  const classes =
    status === "published"
      ? "bg-green-100 text-green-700"
      : status === "draft"
      ? "bg-amber-100 text-amber-700"
      : "bg-zinc-100 text-zinc-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}

export function ContentTable({
  cards,
  categories,
  saving = false,
  onEdit,
  onDelete,
  onPreview,
  onTogglePublish,
  onMove,
}: ContentTableProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        No cards match the current filters. Click &ldquo;+ Add YouTube Video&rdquo; or
        &ldquo;+ Add FAQ Card&rdquo; to create one.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Thumbnail / Type</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cards.map((card, index) => {
                const thumb = resolveCardThumbnail(card);
                const catName =
                  card.category?.name ??
                  (card.category_id ? categoryMap.get(card.category_id) : undefined);

                return (
                  <tr key={card.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onMove(card.id, "up")}
                          disabled={saving || index === 0}
                          aria-label={`Move ${card.title} up`}
                          className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(card.id, "down")}
                          disabled={saving || index === cards.length - 1}
                          aria-label={`Move ${card.title} down`}
                          className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {card.type === "faq" && !thumb ? (
                        <div className="grid h-12 w-20 place-items-center rounded-md bg-zinc-100 text-accentBlue">
                          <HelpCircle className="h-5 w-5" aria-hidden="true" />
                        </div>
                      ) : (
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className="h-12 w-20 rounded-md object-cover bg-zinc-100"
                        />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                          {card.type}
                        </span>
                        <p className="break-words font-medium text-zinc-900 max-w-[260px] line-clamp-2">
                          {card.title}
                        </p>
                      </div>
                      <p className="mt-0.5 break-words text-xs text-zinc-500 max-w-[280px] truncate lg:hidden">
                        {catName ?? "No category"}
                      </p>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 break-words">
                        {catName ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={card.status} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPreview(card)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onTogglePublish(card)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 min-h-[44px]"
                        >
                          {card.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(card)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(card)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {cards.map((card, index) => {
          const thumb = resolveCardThumbnail(card);
          const catName =
            card.category?.name ??
            (card.category_id ? categoryMap.get(card.category_id) : undefined);

          return (
            <div
              key={card.id}
              className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3"
            >
              {card.type === "faq" && !thumb ? (
                <div className="grid h-16 w-24 shrink-0 place-items-center rounded-md bg-zinc-100 text-accentBlue">
                  <HelpCircle className="h-6 w-6" aria-hidden="true" />
                </div>
              ) : (
                <img
                  src={thumb}
                  alt=""
                  className="h-16 w-24 rounded-md object-cover bg-zinc-100 shrink-0"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-zinc-900 line-clamp-2">
                  {card.title}
                </p>
                <p className="mt-1 break-words text-xs text-zinc-500">
                  {catName ?? "No category"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={card.status} />
                  <span className="text-[11px] uppercase text-zinc-500">
                    {card.type}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onMove(card.id, "up")}
                    disabled={saving || index === 0}
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 disabled:opacity-40 min-h-[44px]"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(card.id, "down")}
                    disabled={saving || index === cards.length - 1}
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 disabled:opacity-40 min-h-[44px]"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(card)}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(card)}
                    className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
