import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaqCard } from "../components/faq/FaqCard.tsx";
import { CategoryFilter } from "../components/layout/CategoryFilter.tsx";
import { Header } from "../components/layout/Header.tsx";
import { SearchBar } from "../components/layout/SearchBar.tsx";
import { VideoCard } from "../components/video/VideoCard.tsx";
import { VideoModal } from "../components/video/VideoModal.tsx";
import { INITIAL_CONTENT_DOCUMENT } from "../data/seedData.ts";
import { fetchPublicContent, recordCardView } from "../services/contentService.ts";
import type { Category, ContentCard, SiteConfig } from "../types/content.ts";

type SortKey = "all" | "popular" | "newest";

const SORT_TABS: Array<{ key: SortKey; label: string }> = [
  { key: "all", label: "All guides" },
  { key: "popular", label: "Most viewed" },
  { key: "newest", label: "Newest" },
];

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const selectedCategory = searchParams.get("category") ?? "";
  const activeVideoParam = searchParams.get("v");

  const [site, setSite] = useState<SiteConfig>(INITIAL_CONTENT_DOCUMENT.site);
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CONTENT_DOCUMENT.categories
  );
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("all");
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const lastViewPingRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    fetchPublicContent()
      .then((data) => {
        if (!active) return;
        setSite(data.site);
        setCategories(data.categories);
        setCards(data.cards);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load content"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!rateLimitNotice) return;
    const timer = setTimeout(() => setRateLimitNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [rateLimitNotice]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

  const countsBySlug = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.slug] = 0;
    }
    for (const card of cards) {
      const cat = categories.find((c) => c.id === card.category_id);
      if (cat) {
        counts[cat.slug] = (counts[cat.slug] ?? 0) + 1;
      }
    }
    return counts;
  }, [cards, categories]);

  const activeCategoryName = useMemo(() => {
    if (!selectedCategory) return "All guides";
    const found = categories.find(
      (c) =>
        c.slug === selectedCategory ||
        String(c.id) === selectedCategory ||
        c.name === selectedCategory
    );
    return found?.name ?? "All guides";
  }, [categories, selectedCategory]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (
        selectedCategory &&
        String(card.category_id) !== selectedCategory &&
        card.category?.name !== selectedCategory
      ) {
        const matched = categories.find(
          (c) =>
            String(c.id) === selectedCategory ||
            c.slug === selectedCategory ||
            c.name === selectedCategory
        );
        if (!matched || card.category_id !== matched.id) {
          return false;
        }
      }

      if (!q) return true;
      return [
        card.title,
        card.description ?? "",
        card.category?.name ?? "",
        card.tags ?? "",
        card.transcript ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [cards, query, selectedCategory, categories]);

  const sortedCards = useMemo(() => {
    const copy = [...filteredCards];
    if (sortBy === "popular") {
      return copy.sort(
        (a, b) =>
          (b.views ?? 0) - (a.views ?? 0) ||
          (a.display_order ?? 0) - (b.display_order ?? 0) ||
          a.id - b.id
      );
    }
    if (sortBy === "newest") {
      return copy.sort((a, b) => {
        if (a.created_at && b.created_at) {
          const cmp = String(b.created_at).localeCompare(String(a.created_at));
          if (cmp !== 0) return cmp;
        }
        return b.id !== a.id
          ? b.id - a.id
          : (b.display_order ?? 0) - (a.display_order ?? 0);
      });
    }
    return copy.sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id
    );
  }, [filteredCards, sortBy]);

  const mostViewedIds = useMemo(() => {
    const ranked = [...filteredCards].sort(
      (a, b) => (b.views ?? 0) - (a.views ?? 0)
    );
    if ((ranked[0]?.views ?? 0) <= 0) return new Set<number>();
    return new Set(ranked.slice(0, 3).map((c) => c.id));
  }, [filteredCards]);

  const activeCard = useMemo(
    () =>
      activeVideoParam
        ? cards.find((c) => String(c.id) === activeVideoParam) ?? null
        : null,
    [activeVideoParam, cards]
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const trackView = (cardId: number) => {
    const now = Date.now();
    const prev = lastViewPingRef.current.get(cardId) ?? 0;
    if (now - prev < 2000) return;

    lastViewPingRef.current.set(cardId, now);
    void recordCardView(cardId)
      .then((res) => {
        if (typeof res.views === "number") {
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === cardId ? { ...c, views: res.views! } : c
            )
          );
        }
        if (res.status === 429 && res.error) {
          setRateLimitNotice(res.error);
        }
      })
      .catch(() => {});
  };

  const openCard = (card: ContentCard) => {
    updateParam("v", String(card.id));
    trackView(card.id);
  };

  const closeCard = () => {
    updateParam("v", "");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f6f9]">
      <Header
        site={site}
        searchQuery={query}
        onSearchChange={(val) => updateParam("q", val)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <div className="px-3 pb-2.5 sm:hidden">
        <SearchBar value={query} onChange={(val) => updateParam("q", val)} />
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[228px] shrink-0 overflow-y-auto px-3 pb-6 pt-1 md:block">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={(slug) => updateParam("category", slug)}
            totalCount={cards.length}
            countsBySlug={countsBySlug}
          />
        </aside>

        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 flex bg-[#131416]/40 md:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileNavOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Module navigation"
              data-ui="drawer"
              className="flex h-full w-[264px] flex-col border-r border-[#e8eaec] bg-[#f4f6f9] p-3"
            >
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <span className="text-[13px] font-medium text-[#131416]">
                  {site.title}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-[6px] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416]"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CategoryFilter
                  categories={categories}
                  selected={selectedCategory}
                  onSelect={(slug) => {
                    updateParam("category", slug);
                    setMobileNavOpen(false);
                  }}
                  totalCount={cards.length}
                  countsBySlug={countsBySlug}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col rounded-t-[12px] border border-[#e8eaec] bg-[#ffffff] p-4 sm:p-6 md:mb-2 md:mr-2 md:rounded-[16px]">
          <div className="mb-5 flex flex-col gap-3 border-b border-[#e8eaec] pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-[20px] font-medium tracking-tight text-[#131416]">
                  {activeCategoryName}
                </h1>
                <span className="num rounded-[5px] border border-[#e8eaec] bg-[#f4f6f8] px-2 py-0.5 text-[11px] font-medium text-[#5d5f60]">
                  {sortedCards.length}{" "}
                  {sortedCards.length === 1 ? "guide" : "guides"}
                </span>
              </div>
              {site.description && !selectedCategory && (
                <p className="mt-1 break-words text-[13px] text-[#5d5f60]">
                  {site.description}
                </p>
              )}
            </div>

            <div
              className="-mb-[13px] flex shrink-0 flex-nowrap items-center gap-5"
              role="tablist"
              aria-label="Sort content"
            >
              {SORT_TABS.map((tab) => {
                const active = sortBy === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSortBy(tab.key)}
                    className={`whitespace-nowrap border-b-2 pb-3 text-[13px] transition-colors focus-visible:outline-none ${
                      active
                        ? "border-[#131416] font-medium text-[#131416]"
                        : "border-transparent font-normal text-[#5d5f60] hover:text-[#131416]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {rateLimitNotice && (
            <div className="mb-4 rounded-[8px] border border-[#e8eaec] bg-[#fffbeb] px-3.5 py-2.5 text-[13px] text-[#92400e]">
              {rateLimitNotice}
            </div>
          )}

          {loadError ? (
            <div className="rounded-[10px] border border-[#ffedea] bg-[#ffedea] px-6 py-10 text-center">
              <p className="text-[15px] font-medium text-[#831c1e]">
                Unable to load content
              </p>
              <p className="mt-1 text-[13px] text-[#c4242a]">{loadError}</p>
              <button
                type="button"
                onClick={() => setRetryCount((n) => n + 1)}
                className="mt-4 inline-flex h-8 items-center justify-center rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-4 text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3]"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-[10px] border border-[#e8eaec] bg-[#ffffff]"
                >
                  <div className="aspect-video w-full border-b border-[#f0f1f2] bg-[#f4f6f8]" />
                  <div className="space-y-2.5 p-3.5">
                    <div className="h-3 w-1/3 rounded bg-[#ebedee]" />
                    <div className="h-4 w-3/4 rounded bg-[#ebedee]" />
                    <div className="h-3 w-full rounded bg-[#f4f6f8]" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedCards.length === 0 ? (
            <div className="grid place-items-center rounded-[10px] border border-dashed border-[#cdced1] bg-[#f4f6f8] px-6 py-16 text-center">
              <p className="text-[15px] font-medium text-[#131416]">
                No guides found
              </p>
              <p className="mt-1 max-w-md break-words text-[13px] text-[#5d5f60]">
                Try adjusting your search query or selecting another module.
              </p>
              {(query || selectedCategory) && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchParams(new URLSearchParams(), { replace: true })
                  }
                  className="mt-4 h-8 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3.5 text-[13px] font-medium text-[#131416] hover:border-[#cdced1] hover:bg-[#ebedee]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
              {sortedCards.map((card) => {
                const catName =
                  card.category?.name ??
                  (card.category_id
                    ? categoryNameById.get(card.category_id)
                    : undefined);
                const isMostViewed = mostViewedIds.has(card.id);

                return card.type === "faq" ? (
                  <FaqCard
                    key={card.id}
                    faq={card}
                    categoryName={catName}
                    isMostViewed={isMostViewed}
                    onClick={() => openCard(card)}
                  />
                ) : (
                  <VideoCard
                    key={card.id}
                    video={card}
                    categoryName={catName}
                    isMostViewed={isMostViewed}
                    onClick={() => openCard(card)}
                  />
                );
              })}
            </div>
          )}

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f1f2] pt-5 text-[12px] text-[#5d5f60]">
            <span>
              &copy; {new Date().getFullYear()} {site.title}
            </span>
            {site.contact && (
              <span>
                {site.contact.endsWith("example" + ".com")
                  ? "support@empower-slpa.org"
                  : site.contact}
              </span>
            )}
          </footer>
        </main>
      </div>

      <VideoModal
        card={activeCard}
        categoryName={
          activeCard
            ? activeCard.category?.name ??
              (activeCard.category_id
                ? categoryNameById.get(activeCard.category_id)
                : undefined)
            : undefined
        }
        open={Boolean(activeCard)}
        onClose={closeCard}
      />
    </div>
  );
}
