"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Store, Loader2, X, Star, ShoppingBag, Package } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { StoreCard } from "@/components/store-card";
import { Footer } from "@/components/footer";

const dict = {
  en: {
    searchPh: "Search stores or products...",
    searchBtn: "Search",
    all: "All",
    sortRecent: "Recent",
    sortPopular: "Popular",
    sortRating: "Top rated",
    sortPriceAsc: "Price ↑",
    sortPriceDesc: "Price ↓",
    clearFilters: "Clear",
    tabStores: "Stores",
    tabProducts: "Products",
    showing: "Showing",
    loadMore: "Load more",
    noStores: "No stores found",
    noProducts: "No products found",
    noResultsSub: "Try adjusting your search or filters.",
    visit: "Visit",
    order: "Order",
  },
  pt: {
    searchPh: "Pesquisar lojas ou produtos...",
    searchBtn: "Pesquisar",
    all: "Todas",
    sortRecent: "Recentes",
    sortPopular: "Populares",
    sortRating: "Melhor avaliadas",
    sortPriceAsc: "Preço ↑",
    sortPriceDesc: "Preço ↓",
    clearFilters: "Limpar",
    tabStores: "Lojas",
    tabProducts: "Produtos",
    showing: "A mostrar",
    loadMore: "Carregar mais",
    noStores: "Nenhuma loja encontrada",
    noProducts: "Nenhum produto encontrado",
    noResultsSub: "Tente ajustar a pesquisa ou filtros.",
    visit: "Visitar",
    order: "Encomendar",
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

interface ProductData {
  id: number;
  name: string;
  price: string;
  imageUrl?: string;
  shortDescription?: string;
  category?: string;
  sellerName: string;
  sellerSlug: string;
  sellerCurrency: string;
  sellerRating: number;
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
  const router = useRouter();

  const [tab, setTab] = useState<"stores" | "products">("stores");
  const [stores, setStores] = useState<StoreData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [storeCategories, setStoreCategories] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
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
        setStoreCategories(data.categories || []);
        setHasMore(newStores.length === LIMIT);
      } catch {} finally { setLoading(false); }
    },
    [search, category, sort, offset]
  );

  const fetchProducts = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      const o = reset ? 0 : offset;
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      params.set("sort", sort);
      params.set("limit", String(LIMIT));
      params.set("offset", String(o));

      try {
        const res = await fetch(`/api/products/search?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const newProducts = data.products || [];
        if (reset) {
          setProducts(newProducts);
          setOffset(LIMIT);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
          setOffset((prev) => prev + LIMIT);
        }
        setProductCategories(data.categories || []);
        setHasMore(newProducts.length === LIMIT);
      } catch {} finally { setLoading(false); }
    },
    [search, category, sort, offset]
  );

  useEffect(() => {
    if (tab === "stores") fetchStores(true);
    else fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sort, tab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // triggers useEffect
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSort("recent");
  };

  const currentCategories = tab === "stores" ? storeCategories : productCategories;
  const storeSortOptions = ["recent", "popular", "rating"] as const;
  const productSortOptions = ["recent", "price_asc", "price_desc", "popular"] as const;
  const sortOptions = tab === "stores" ? storeSortOptions : productSortOptions;

  const sortLabel = (s: string) => {
    const key = `sort${s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}` as keyof typeof t;
    return t[key] || s;
  };

  const hasFilters = search || category || sort !== "recent";

  return (
    <div className="min-h-screen text-slate-900">
      {/* Search + Filters */}
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-8 sm:px-6 sm:pt-10">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPh}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button type="submit" className="mr-1.5 shrink-0 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                {t.searchBtn}
              </button>
            </div>
          </form>

          {/* Filter bar */}
          <div className="mx-auto mt-4 flex max-w-2xl items-center gap-2 overflow-x-auto pb-1">
            {/* Category pills */}
            <button
              onClick={() => setCategory("")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !category ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              }`}
            >
              {t.all}
            </button>
            {currentCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === cat ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                }`}
              >
                {cat}
              </button>
            ))}

            <span className="mx-1 h-4 w-px bg-slate-200" />

            {/* Sort */}
            {sortOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === s ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                {sortLabel(s)}
              </button>
            ))}

            {hasFilters && (
              <>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button onClick={clearFilters} className="shrink-0 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600">
                  <X className="h-3 w-3" /> {t.clearFilters}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl px-4 sm:px-6">
          {(["stores", "products"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => { setTab(tb); setCategory(""); setOffset(0); }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === tb
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tb === "stores" ? <Store className="h-4 w-4" /> : <Package className="h-4 w-4" />}
              {tb === "stores" ? t.tabStores : t.tabProducts}
            </button>
          ))}
          <div className="ml-auto flex items-center text-xs text-slate-400">
            {!loading && (
              <>
                {t.showing} {tab === "stores" ? stores.length : products.length} {tab === "stores" ? t.tabStores.toLowerCase() : t.tabProducts.toLowerCase()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "stores" ? (
          <>
            {stores.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stores.map((store) => (
                  <StoreCard key={store.slug} store={store} />
                ))}
              </div>
            ) : !loading ? (
              <EmptyState icon={Store} title={t.noStores} sub={t.noResultsSub} />
            ) : null}
          </>
        ) : (
          <>
            {products.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductSearchCard key={p.id} product={p} t={t} />
                ))}
              </div>
            ) : !loading ? (
              <EmptyState icon={Package} title={t.noProducts} sub={t.noResultsSub} />
            ) : null}
          </>
        )}

        {loading && (stores.length === 0 && products.length === 0) && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={() => tab === "stores" ? fetchStores(false) : fetchProducts(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t.loadMore}
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: typeof Store; title: string; sub: string }) {
  return (
    <div className="py-16 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function ProductSearchCard({ product, t }: { product: ProductData; t: Record<string, string> }) {
  return (
    <Link
      href={`/s/${product.sellerSlug}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-slate-100">
          <ShoppingBag className="h-8 w-8 text-slate-300" />
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{product.sellerName}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-bold text-indigo-600">
            {product.sellerCurrency || "USD"} {product.price}
          </span>
          {Number(product.sellerRating) > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-slate-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {product.sellerRating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
