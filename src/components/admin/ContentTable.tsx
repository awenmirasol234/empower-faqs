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
      ? "bg-[#dcfae5] text-[#04250e]"
      : status === "draft"
      ? "bg-[#fffbeb] text-[#92400e]"
      : "bg-[#ebedee] text-[#353736]";

  return (
    <span
      className={`inline-flex rounded-[5px] px-2 py-0.5 text-[11px] font-medium capitalize ${classes}`}
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
      <div className="rounded-[10px] border border-dashed border-[#cdced1] bg-[#f4f6f8] px-6 py-12 text-center text-[13px] text-[#5d5f60]">
        No cards match the current filters. Click &ldquo;+ Add YouTube Video&rdquo; or
        &ldquo;+ Add FAQ Card&rdquo; to create one.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[10px] border border-[#e8eaec] bg-[#ffffff] md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-[#e8eaec] bg-[#f4f6f8] text-[12px] font-medium text-[#5d5f60]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium">Order</th>
                <th className="px-3.5 py-2.5 font-medium">Preview</th>
                <th className="px-3.5 py-2.5 font-medium">Title &amp; ID</th>
                <th className="hidden px-3.5 py-2.5 font-medium lg:table-cell">
                  Module
                </th>
                <th className="px-3.5 py-2.5 font-medium">Status</th>
                <th className="px-3.5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f2]">
              {cards.map((card, index) => {
                const thumb = resolveCardThumbnail(card);
                const catName =
                  card.category?.name ??
                  (card.category_id ? categoryMap.get(card.category_id) : undefined);

                return (
                  <tr key={card.id} className="hover:bg-[#f4f6f8]/60">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onMove(card.id, "up")}
                          disabled={saving || index === 0}
                          aria-label={`Move ${card.title} up`}
                          className="grid h-7 w-7 place-items-center rounded-[5px] border border-[#e8eaec] bg-[#ffffff] text-[#5d5f60] hover:border-[#cdced1] hover:bg-[#ebedee] hover:text-[#131416] disabled:opacity-40"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMove(card.id, "down")}
                          disabled={saving || index === cards.length - 1}
                          aria-label={`Move ${card.title} down`}
                          className="grid h-7 w-7 place-items-center rounded-[5px] border border-[#e8eaec] bg-[#ffffff] text-[#5d5f60] hover:border-[#cdced1] hover:bg-[#ebedee] hover:text-[#131416] disabled:opacity-40"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      {card.type === "faq" && !thumb ? (
                        <div className="grid h-11 w-[72px] place-items-center rounded-[6px] border border-[#e8eaec] bg-[#f4f6f8] text-[#2d5be3]">
                          <HelpCircle className="h-4 w-4" aria-hidden="true" />
                        </div>
                      ) : (
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className="h-11 w-[72px] rounded-[6px] border border-[#e8eaec] bg-[#f4f6f8] object-cover"
                        />
                      )}
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-[#e8eaec] bg-[#f4f6f8] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-[#5d5f60]">
                          {card.type}
                        </span>
                        <p className="line-clamp-2 max-w-[260px] break-words font-medium text-[#131416]">
                          {card.title}
                        </p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#5d5f60]">
                        {card.youtube_id && (
                          <span className="font-mono">{card.youtube_id}</span>
                        )}
                        <span className="truncate lg:hidden">
                          {catName ?? "No module"}
                        </span>
                      </div>
                    </td>

                    <td className="hidden px-3.5 py-2.5 lg:table-cell">
                      <span className="break-words rounded-[5px] border border-[#e8eaec] bg-[#f4f6f8] px-2 py-0.5 text-[12px] text-[#353736]">
                        {catName ?? "-"}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <StatusBadge status={card.status} />
                    </td>

                    <td className="px-3.5 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPreview(card)}
                          className="h-7 rounded-[5px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#f4f6f8]"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onTogglePublish(card)}
                          className="h-7 rounded-[5px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#f4f6f8] disabled:opacity-50"
                        >
                          {card.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(card)}
                          className="h-7 rounded-[5px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#f4f6f8]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(card)}
                          className="h-7 rounded-[5px] border border-[#ffedea] bg-[#ffedea] px-2.5 text-[12px] font-medium text-[#831c1e] hover:bg-[#ffdcd7]"
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

      <div className="grid gap-3 md:hidden">
        {cards.map((card, index) => {
          const thumb = resolveCardThumbnail(card);
          const catName =
            card.category?.name ??
            (card.category_id ? categoryMap.get(card.category_id) : undefined);

          return (
            <div
              key={card.id}
              className="flex gap-3 rounded-[10px] border border-[#e8eaec] bg-[#ffffff] p-3"
            >
              {card.type === "faq" && !thumb ? (
                <div className="grid h-16 w-24 shrink-0 place-items-center rounded-[6px] border border-[#e8eaec] bg-[#f4f6f8] text-[#2d5be3]">
                  <HelpCircle className="h-5 w-5" aria-hidden="true" />
                </div>
              ) : (
                <img
                  src={thumb}
                  alt=""
                  className="h-16 w-24 shrink-0 rounded-[6px] border border-[#e8eaec] bg-[#f4f6f8] object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words text-[13px] font-medium text-[#131416]">
                  {card.title}
                </p>
                <p className="mt-1 break-words text-[12px] text-[#5d5f60]">
                  {catName ?? "No module"}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={card.status} />
                  <span className="font-mono text-[11px] uppercase text-[#5d5f60]">
                    {card.type}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onMove(card.id, "up")}
                    disabled={saving || index === 0}
                    className="h-8 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] disabled:opacity-40"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(card.id, "down")}
                    disabled={saving || index === cards.length - 1}
                    className="h-8 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] disabled:opacity-40"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(card)}
                    className="h-8 flex-1 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3 text-[12px] font-medium text-[#131416] hover:bg-[#f4f6f8]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(card)}
                    className="h-8 flex-1 rounded-[6px] border border-[#ffedea] bg-[#ffedea] px-3 text-[12px] font-medium text-[#831c1e]"
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
