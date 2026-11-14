import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download } from "lucide-react";
import { CardFormModal } from "../components/admin/CardFormModal.tsx";
import { CategoryManagerModal } from "../components/admin/CategoryManagerModal.tsx";
import { ConfirmDialog } from "../components/admin/ConfirmDialog.tsx";
import { ContentTable } from "../components/admin/ContentTable.tsx";
import { StatsCards } from "../components/admin/StatsCards.tsx";
import { VideoModal } from "../components/video/VideoModal.tsx";
import { useAdminAuth } from "../hooks/useAdminAuth.ts";
import {
  fetchAdminContent,
  saveAdminContent,
} from "../services/contentService.ts";
import type {
  CardType,
  Category,
  ContentCard,
  ContentDocument,
  ContentStats,
} from "../types/content.ts";

const EMPTY_STATS: ContentStats = {
  totalCards: 0,
  publishedCards: 0,
  draftCards: 0,
  hiddenCards: 0,
  totalCategories: 0,
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, checking, logout } = useAdminAuth();

  const [doc, setDoc] = useState<ContentDocument | null>(null);
  const [stats, setStats] = useState<ContentStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<CardType>("video");
  const [editingCard, setEditingCard] = useState<ContentCard | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<ContentCard | null>(null);
  const [previewCard, setPreviewCard] = useState<ContentCard | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminContent();
      setDoc({
        version: data.version,
        updatedAt: data.updatedAt,
        site: data.site,
        categories: data.categories,
        cards: data.cards,
      });
      setStats(data.stats);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load content.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (isAuthenticated) {
      void loadContent();
    }
  }, [checking, isAuthenticated, navigate, loadContent]);

  const persistDocument = async (nextDoc: ContentDocument) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAdminContent(nextDoc, doc?.version);
      setDoc({
        version: saved.version,
        updatedAt: saved.updatedAt,
        site: saved.site,
        categories: saved.categories,
        cards: saved.cards,
      });
      setStats(saved.stats);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes.";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async (card: ContentCard) => {
    if (!doc) return;
    const exists = doc.cards.some((c) => c.id === card.id);
    const nextCards = exists
      ? doc.cards.map((c) => (c.id === card.id ? card : c))
      : [...doc.cards, card];

    await persistDocument({ ...doc, cards: nextCards });
  };

  const handleDeleteCardConfirm = async () => {
    if (!doc || !deletingCard) return;
    const nextCards = doc.cards.filter((c) => c.id !== deletingCard.id);
    await persistDocument({ ...doc, cards: nextCards });
    setDeletingCard(null);
  };

  const handleTogglePublish = async (card: ContentCard) => {
    if (!doc) return;
    const nextStatus: ContentCard["status"] =
      card.status === "published" ? "draft" : "published";
    const nextCards = doc.cards.map((c) =>
      c.id === card.id
        ? { ...c, status: nextStatus, updated_at: new Date().toISOString() }
        : c
    );
    await persistDocument({ ...doc, cards: nextCards });
  };

  const handleMoveCard = async (cardId: number, direction: "up" | "down") => {
    if (!doc) return;
    const ordered = [...doc.cards].sort(
      (a, b) => a.display_order - b.display_order || a.id - b.id
    );
    const idx = ordered.findIndex((c) => c.id === cardId);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || target < 0 || target >= ordered.length) return;

    const [moved] = ordered.splice(idx, 1);
    ordered.splice(target, 0, moved);

    const normalized = ordered.map((c, index) => ({
      ...c,
      display_order: index,
    }));
    await persistDocument({ ...doc, cards: normalized });
  };

  const handleSaveCategories = async (nextCategories: Category[]) => {
    if (!doc) return;
    const catMap = new Map(nextCategories.map((c) => [c.id, c]));
    const updatedCards = doc.cards.map((card) => {
      if (!card.category_id) return card;
      const cat = catMap.get(card.category_id);
      return cat
        ? { ...card, category: { id: cat.id, name: cat.name, slug: cat.slug } }
        : { ...card, category_id: null, category: null };
    });

    await persistDocument({
      ...doc,
      categories: nextCategories,
      cards: updatedCards,
    });
  };

  const handleExportBackup = () => {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `empower-faqs-backup-v${doc.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredCards = useMemo(() => {
    if (!doc) return [];
    const q = searchQuery.trim().toLowerCase();
    return [...doc.cards]
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
      .filter((card) => {
        if (statusFilter && card.status !== statusFilter) return false;
        if (
          categoryFilter &&
          String(card.category_id) !== categoryFilter &&
          card.category?.slug !== categoryFilter
        ) {
          return false;
        }
        if (q) {
          const hay = [
            card.title,
            card.description ?? "",
            card.tags ?? "",
            card.category?.name ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [doc, searchQuery, categoryFilter, statusFilter]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-50 p-6 text-sm text-zinc-500">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const categories = doc?.categories ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                  Admin Dashboard
                </h1>
                <span className="rounded-full bg-accentBlue px-2.5 py-1 text-xs font-medium text-white">
                  {stats.totalCards} cards
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={!doc}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 min-h-[44px]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export JSON
                </button>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 min-h-[44px]"
                >
                  View Public Site
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate("/admin/login", { replace: true });
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px]"
                >
                  Log Out
                </button>
              </div>
            </div>

            <p className="text-sm text-zinc-500 break-words">
              Manage videos and FAQ cards — create, edit, reorder, save drafts, and
              publish. Only Published cards appear on the public site.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        <StatsCards stats={stats} />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 break-words">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingCard(null);
                setFormInitialType("video");
                setFormOpen(true);
              }}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-accentBlue px-5 py-2.5 text-sm font-medium text-white hover:bg-[#244ac2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue min-h-[44px]"
            >
              <span className="text-lg leading-none">+</span> Add YouTube Video
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCard(null);
                setFormInitialType("faq");
                setFormOpen(true);
              }}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg border border-accentBlue bg-white px-5 py-2.5 text-sm font-medium text-accentBlue hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue min-h-[44px]"
            >
              <span className="text-lg leading-none">+</span> Add FAQ Card
            </button>
            <button
              type="button"
              onClick={() => setCategoriesModalOpen(true)}
              className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue min-h-[44px]"
            >
              Manage Categories
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px] sm:w-[220px]"
            />

            <div className="relative w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-12 text-sm leading-5 outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px] sm:w-[190px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 pr-12 text-sm leading-5 outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px] sm:w-[160px]"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-sm text-zinc-500">
            Loading content...
          </div>
        ) : (
          <ContentTable
            cards={filteredCards}
            categories={categories}
            saving={saving}
            onEdit={(card) => {
              setEditingCard(card);
              setFormInitialType(card.type);
              setFormOpen(true);
            }}
            onDelete={(card) => setDeletingCard(card)}
            onPreview={(card) => setPreviewCard(card)}
            onTogglePublish={(card) => void handleTogglePublish(card)}
            onMove={(cardId, dir) => void handleMoveCard(cardId, dir)}
          />
        )}
      </main>

      {formOpen && (
        <CardFormModal
          open={formOpen}
          categories={categories}
          editing={editingCard}
          initialType={formInitialType}
          saving={saving}
          onClose={() => {
            setFormOpen(false);
            setEditingCard(null);
          }}
          onSave={handleSaveCard}
        />
      )}

      <CategoryManagerModal
        open={categoriesModalOpen}
        categories={categories}
        cards={doc?.cards ?? []}
        saving={saving}
        onClose={() => setCategoriesModalOpen(false)}
        onSaveCategories={handleSaveCategories}
      />

      <ConfirmDialog
        open={Boolean(deletingCard)}
        title="Delete this card?"
        message={`This will remove "${deletingCard?.title ?? ""}" from the website.\n\nThis action cannot be undone.`}
        loading={saving}
        onCancel={() => setDeletingCard(null)}
        onConfirm={() => void handleDeleteCardConfirm()}
      />

      <VideoModal
        card={previewCard}
        categoryName={previewCard?.category?.name}
        open={Boolean(previewCard)}
        onClose={() => setPreviewCard(null)}
      />
    </div>
  );
}
