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
      <div className="grid min-h-[100dvh] place-items-center bg-[#f4f6f9] p-6 text-[13px] text-[#5d5f60]">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const categories = doc?.categories ?? [];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc]">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 bg-[#f8fafc] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[#2d5be3] text-[11px] font-semibold text-white">
            EM
          </div>
          <span className="truncate text-[14px] font-medium tracking-tight text-[#131416]">
            Admin CMS
          </span>
          <span className="num rounded-[5px] border border-[#dbe5fc] bg-[#eef3fe] px-2 py-0.5 text-[11px] font-medium text-[#2d5be3]">
            {stats.totalCards} cards
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={!doc}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#ebedee] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[12px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#ebedee]"
          >
            View Library
          </a>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/admin/login", { replace: true });
            }}
            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#ffedea] bg-[#ffedea] px-2.5 text-[12px] font-medium text-[#831c1e] hover:bg-[#ffdcd7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4242a]"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-0 flex w-full flex-1 flex-col gap-5 rounded-t-[12px] border border-[#e8eaec] bg-[#ffffff] p-4 sm:p-6 md:mx-2 md:mb-2 md:w-auto md:rounded-[16px]">
        <div className="flex flex-col gap-1 border-b border-[#e8eaec] pb-4">
          <h1 className="text-[20px] font-medium tracking-tight text-[#131416]">
            Content Library
          </h1>
          <p className="break-words text-[13px] text-[#5d5f60]">
            Create, edit, reorder, save drafts, and publish video walkthroughs and FAQs. Only Published cards appear on the public library.
          </p>
        </div>

        <StatsCards stats={stats} />

        {error && (
          <div className="break-words rounded-[8px] border border-[#ffedea] bg-[#ffedea] px-3.5 py-2.5 text-[13px] text-[#831c1e]">
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
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[6px] bg-[#2d5be3] px-3.5 text-[13px] font-medium text-white hover:bg-[#244ac2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3] sm:flex-none"
            >
              <span>+</span> Add YouTube Video
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCard(null);
                setFormInitialType("faq");
                setFormOpen(true);
              }}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[#2d5be3] bg-[#ffffff] px-3.5 text-[13px] font-medium text-[#2d5be3] hover:bg-[#eef3fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3] sm:flex-none"
            >
              <span>+</span> Add FAQ Card
            </button>
            <button
              type="button"
              onClick={() => setCategoriesModalOpen(true)}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3.5 text-[13px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#f4f6f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3] sm:flex-none"
            >
              Manage Categories
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="h-8 w-full rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3 text-[13px] text-[#131416] placeholder:text-[#5d5f60] focus:border-[#cdced1] focus:outline-none sm:w-[210px]"
            />

            <div className="relative w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="h-8 w-full appearance-none rounded-[6px] border border-[#e8eaec] bg-[#ffffff] pl-3 pr-8 text-[13px] text-[#131416] focus:border-[#cdced1] focus:outline-none sm:w-[190px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5d5f60]">
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="h-8 w-full appearance-none rounded-[6px] border border-[#e8eaec] bg-[#ffffff] pl-3 pr-8 text-[13px] text-[#131416] focus:border-[#cdced1] focus:outline-none sm:w-[150px]"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5d5f60]">
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-[10px] border border-[#e8eaec] bg-[#f4f6f8] px-6 py-12 text-[13px] text-[#5d5f60]">
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
