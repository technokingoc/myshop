"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Store, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { StoreCard } from "@/components/store-card";
import { Footer } from "@/components/footer";

const dict = {
  en: {
    title: "Browse Stores",
    subtitle: "Discover amazing stores on MyShop",
    search: "Search stores...",
    all: "All",
    sortRecent: "Recent",
    sortPopular: "Popular",
    sortRating: "Top rated",
    loadMore: "Load more",
    noResults: "No stores found",
    noResultsSub: "Try adjusting your search or filters.",
  },
  pt: {
    title: "Explorar Lojas",
    subtitle: "Descubra lojas incríveis no MyShop",
    search: "Pesquisar lojas...",
    all: "Todas",
    sortRecent: "Recentes",
    sortPopular: "Populares",
    sortRating: "Melhor avaliadas",
    loadMore: "Carregar mais",
    noResults: "Nenhuma loja encontrada",
    noResultsSub: "Tente ajustar a pesquisa ou filtros.",
  },
};

interface StoreData {
  slug: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessType?: string;
  productCount: number;
  avgRating: number;
  reviewCount: number;
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <StoresContent />
    </Suspense>
  );
}

function StoresContent() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const searchParams = useSearchParams();

  const [stores, setStores] = useState<StoreData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("recent");
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  const fetchStores = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      const o = reset ? 0 : offset;
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      params.set("sort", sort);
      params.set("limit", String(LIMIT));
      params.set("offset", String(o));

      try {
        const res = await fetch(`/api/stores?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const newStores = data.stores || [];
        if (reset) {
          setStores(newStores);
          setOffset(LIMIT);
        } else {
          setStores((prev) => [...prev, ...newStores]);
          setOffset((prev) => prev + LIMIT);
        }
        setCategories(data.categories || []);
        setHasMore(newStores.length === LIMIT);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [search, category, sort, offset]
  );

  useEffect(() => {
    fetchStores(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort]);

  return (
    <div className="min-h-screen text-slate-900">
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>

          {/* Search */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCategory("")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !category
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                {t.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat === category ? "" : cat!)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    category === cat
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          <div className="mt-4 flex justify-center gap-2">
            {(["recent", "popular", "rating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === s
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t[`sort${s.charAt(0).toUpperCase() + s.slice(1)}` as keyof typeof t]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {stores.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <StoreCard key={store.slug} store={store} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchStores(false)}
                  disabled={loading}
                  className="ui-btn ui-btn-secondary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.loadMore
                  )}
                </button>
              </div>
            )}
          </>
        ) : !loading ? (
          <div className="py-16 text-center">
            <Store className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">{t.noResults}</p>
            <p className="mt-1 text-xs text-slate-400">{t.noResultsSub}</p>
          </div>
        ) : null}

        {loading && stores.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
