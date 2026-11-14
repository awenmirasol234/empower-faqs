import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { slugify } from "../../lib/validation.ts";
import type { Category, ContentCard } from "../../types/content.ts";
import { ConfirmDialog } from "./ConfirmDialog.tsx";

interface CategoryManagerModalProps {
  open: boolean;
  categories: Category[];
  cards: ContentCard[];
  saving: boolean;
  onClose: () => void;
  onSaveCategories: (nextCategories: Category[]) => Promise<void>;
}

export function CategoryManagerModal({
  open,
  categories,
  cards,
  saving,
  onClose,
  onSaveCategories,
}: CategoryManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  if (!open) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }

    const slug = slugify(trimmed);
    if (categories.some((c) => c.slug === slug)) {
      setError("A category with that name already exists.");
      return;
    }

    setError(null);
    setSuccess(null);

    const nextId =
      categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const nextOrder =
      categories.reduce((max, c) => Math.max(max, c.display_order), -1) + 1;

    const nextCategories: Category[] = [
      ...categories,
      { id: nextId, name: trimmed, slug, display_order: nextOrder },
    ];

    try {
      await onSaveCategories(nextCategories);
      setNewName("");
      setSuccess("Category added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category.");
    }
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }
    const slug = slugify(trimmed);
    setError(null);
    setSuccess(null);

    const nextCategories = categories.map((c) =>
      c.id === editingId ? { ...c, name: trimmed, slug } : c
    );

    try {
      await onSaveCategories(nextCategories);
      setEditingId(null);
      setEditingName("");
      setSuccess("Category updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category.");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    const normalized = reordered.map((c, idx) => ({ ...c, display_order: idx }));
    setError(null);
    setSuccess(null);
    try {
      await onSaveCategories(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder categories.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCat) return;
    const inUse = cards.some((card) => card.category_id === deletingCat.id);
    if (inUse) {
      setError(
        `Cannot delete "${deletingCat.name}" because one or more cards still use it.`
      );
      setDeletingCat(null);
      return;
    }

    setError(null);
    setSuccess(null);
    const nextCategories = categories
      .filter((c) => c.id !== deletingCat.id)
      .map((c, idx) => ({ ...c, display_order: idx }));

    try {
      await onSaveCategories(nextCategories);
      setDeletingCat(null);
      setSuccess("Category deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category.");
      setDeletingCat(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#131416]/50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-categories-title"
        data-ui="modal"
        className="my-4 w-full max-w-xl rounded-[12px] border border-[#e8eaec] bg-[#ffffff]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[12px] border-b border-[#e8eaec] bg-[#f4f6f8] px-4 py-3 sm:px-6">
          <h2
            id="manage-categories-title"
            className="text-[15px] font-semibold text-[#131416]"
          >
            Manage Categories
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
            aria-label="Close categories dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
            <p className="text-sm text-zinc-500">
              Create, rename, reorder, or delete categories. Categories still assigned
              to cards cannot be deleted.
            </p>

            <form
              onSubmit={handleAdd}
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  className="text-xs font-medium text-zinc-700"
                  htmlFor="cat-name"
                >
                  New Category
                </label>
                <input
                  id="cat-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. General"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-accentBlue px-4 py-2.5 text-sm font-medium text-white hover:bg-[#244ac2] disabled:opacity-50 min-h-[44px] sm:w-auto"
              >
                Add Category
              </button>
            </form>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 break-words">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 break-words">
                {success}
              </p>
            )}

            <ul className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {categories.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-500">
                  No categories yet.
                </li>
              ) : (
                categories.map((cat, idx) => (
                  <li
                    key={cat.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {editingId === cat.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 min-h-[44px]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-zinc-900">
                            {cat.name}
                          </p>
                          <p className="break-words text-xs text-zinc-500">
                            {cat.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "up")}
                            disabled={saving || idx === 0}
                            aria-label={`Move ${cat.name} up`}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, "down")}
                            disabled={saving || idx === categories.length - 1}
                            aria-label={`Move ${cat.name} down`}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditingName(cat.name);
                            }}
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCat(cat)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deletingCat)}
        title="Delete category?"
        message={`Are you sure you want to delete "${deletingCat?.name ?? ""}"?`}
        loading={saving}
        onCancel={() => setDeletingCat(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
