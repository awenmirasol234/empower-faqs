import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaqCard } from "../components/faq/FaqCard.tsx";
import { Header } from "../components/layout/Header.tsx";
import { VideoCard } from "../components/video/VideoCard.tsx";
import { VideoModal } from "../components/video/VideoModal.tsx";
import { INITIAL_CONTENT_DOCUMENT } from "../data/seedData.ts";
import { fetchPublicContent, recordCardView } from "../services/contentService.ts";
import type { Category, ContentCard, SiteConfig } from "../types/content.ts";

type SortKey = "all" | "popular" | "newest";

const SORT_TABS: Array<{ key: SortKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
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
  const lastViewPingRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchPublicContent();
        if (!cancelled) {
          setSite(data.site);
          setCategories(data.categories);
          setCards(data.cards);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load content."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!rateLimitNotice) return;
    const timer = setTimeout(() => setRateLimitNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [rateLimitNotice]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header
        site={site}
        itemCount={sortedCards.length}
        searchQuery={query}
        onSearchChange={(val) => updateParam("q", val)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => updateParam("category", slug)}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div
          className="mb-6 flex flex-wrap items-center gap-2"
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
                className={`min-h-[44px] rounded-full px-5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue ${
                  active
                    ? "bg-[#2D5BE3] text-white shadow"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-[#2D5BE3] hover:text-[#2D5BE3]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {rateLimitNotice && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {rateLimitNotice}
          </div>
        )}

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-base font-semibold text-red-700">
              Unable to load content
            </p>
            <p className="mt-1 text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => setRetryCount((n) => n + 1)}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm animate-pulse"
              >
                <div className="aspect-video w-full bg-zinc-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-zinc-200" />
                  <div className="h-5 w-1/2 rounded-full bg-zinc-200" />
                  <div className="h-3 w-full rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-900">No items found</p>
            <p className="mt-1 max-w-md break-words text-sm text-zinc-500">
              Try adjusting your search or category filter.
            </p>
            {(query || selectedCategory) && (
              <button
                type="button"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
                className="mt-4 min-h-[44px] rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-medium hover:border-accentBlue hover:bg-zinc-50 hover:text-accentBlue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))]">
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
      </main>

      <footer className="border-t border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-500 sm:px-6">
        &copy; {new Date().getFullYear()} {site.title}
      </footer>

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
