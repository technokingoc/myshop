"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { Footer } from "@/components/footer";
import {
  ArrowRight,
  Search,
  UserPlus,
  Package,
  Rocket,
  Store,
  ShoppingBag,
  Star,
  MapPin,
  ChevronRight,
  Shirt,
  Smartphone,
  Utensils,
  Home as HomeIcon,
  Briefcase,
  HeartHandshake,
  Tag,
  type LucideIcon,
} from "lucide-react";

type CategoryData = {
  id: number;
  nameEn: string;
  namePt: string;
  slug: string;
  icon: string | null;
  children?: CategoryData[];
};

const dict = {
  en: {
    heroTitle: "Discover local stores & products",
    heroSub: "Find what you need from trusted sellers in your area",
    searchPh: "Search stores or products...",
    searchBtn: "Search",
    statsStores: "stores",
    statsProducts: "products",
    statsOrders: "happy customers",
    featured: "Featured Stores",
    viewAll: "View all",
    visit: "Visit",
    products: "products",
    how1: "Create your account",
    how2: "Add your products",
    how3: "Start selling",
    ctaLine: "Ready to sell?",
    ctaBtn: "Create your store — it's free",
    noStores: "Be the first to create a store!",
    createStore: "Create your store",
  },
  pt: {
    heroTitle: "Descubra lojas e produtos locais",
    heroSub: "Encontre o que precisa de vendedores de confiança na sua área",
    searchPh: "Pesquisar lojas ou produtos...",
    searchBtn: "Pesquisar",
    statsStores: "lojas",
    statsProducts: "produtos",
    statsOrders: "clientes felizes",
    featured: "Lojas em Destaque",
    viewAll: "Ver todas",
    visit: "Visitar",
    products: "produtos",
    how1: "Crie sua conta",
    how2: "Adicione produtos",
    how3: "Comece a vender",
    ctaLine: "Pronto para vender?",
    ctaBtn: "Criar sua loja — é grátis",
    noStores: "Seja o primeiro a criar uma loja!",
    createStore: "Criar sua loja",
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

interface Stats { sellers: number; products: number; orders: number; }

function resolveCategoryIcon(icon?: string | null) {
  const key = (icon || "").toLowerCase();
  const map: Record<string, LucideIcon> = {
    fashion: Shirt,
    clothing: Shirt,
    electronics: Smartphone,
    food: Utensils,
    restaurant: Utensils,
    home: HomeIcon,
    services: Briefcase,
    beauty: HeartHandshake,
  };
  return map[key] || Tag;
}

export default function HomePage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbCategories, setDbCategories] = useState<CategoryData[]>([]);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    fetch("/api/stores?limit=8&sort=popular")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setStores(d.stores || []);
        }
      })
      .catch(() => {});
    fetch("/api/stores/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => {});
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setDbCategories(d); })
      .catch(() => {});
  }, []);

  // Flatten categories for display
  const categoryPills = useMemo(() => {
    const result: { slug: string; label: string; icon?: string | null }[] = [];
    for (const cat of dbCategories) {
      const name = lang === "pt" ? cat.namePt : cat.nameEn;
      result.push({ slug: cat.slug, label: name, icon: cat.icon });
      if (cat.children) {
        for (const child of cat.children) {
          const childName = lang === "pt" ? child.namePt : child.nameEn;
          result.push({ slug: child.slug, label: childName, icon: child.icon || cat.icon });
        }
      }
    }
    return result;
  }, [dbCategories, lang]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/stores?search=${encodeURIComponent(searchQ.trim())}`);
    } else {
      router.push("/stores");
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      {/* Hero — above the fold */}
      <section className="relative bg-gradient-to-b from-indigo-50/80 via-white to-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100/40 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl opacity-20">
          <div className="h-64 w-64 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-8 pt-16 text-center sm:pt-20 lg:pt-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg lg:text-xl">
            {t.heroSub}
          </p>

          {/* Enhanced search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
              <Search className="ml-5 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t.searchPh}
                className="min-w-0 flex-1 border-0 bg-transparent px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none sm:py-5"
              />
              <button
                type="submit"
                className="mr-2 shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-md sm:px-8 sm:py-4"
              >
                {t.searchBtn}
              </button>
            </div>
          </form>

          {/* Enhanced category pills */}
          {categoryPills.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
              {categoryPills.slice(0, 8).map((cat) => {
                const Icon = resolveCategoryIcon(cat.icon || null);
                return (
                  <Link
                    key={cat.slug}
                    href={`/stores?category=${encodeURIComponent(cat.slug)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </Link>
                );
              })}
              {categoryPills.length > 8 && (
                <Link
                  href="/stores"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-all hover:text-slate-700"
                >
                  +{categoryPills.length - 8} more
                </Link>
              )}
            </div>
          )}

          {/* Enhanced stats with better presentation */}
          {stats && (stats.sellers > 0 || stats.products > 0) && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white px-6 py-3 shadow-sm">
                <div className="px-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{stats.sellers}</p>
                  <p className="text-xs font-medium text-slate-500">{t.statsStores}</p>
                </div>
                <div className="px-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{stats.products}</p>
                  <p className="text-xs font-medium text-slate-500">{t.statsProducts}</p>
                </div>
                <div className="px-3 text-center">
                  <p className="text-lg font-bold text-slate-900">{stats.orders}</p>
                  <p className="text-xs font-medium text-slate-500">{t.statsOrders}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured stores — horizontal scroll */}
      <section className="py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t.featured}</h2>
            <Link href="/stores" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
              {t.viewAll} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {stores.length > 0 ? (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {stores.map((store) => (
                <FeaturedStoreCard key={store.slug} store={store} t={t} />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <div className="mx-auto w-full max-w-lg rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 px-6 py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <Store className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{t.noStores}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Join our growing marketplace and start your business journey today. 
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md">
                    {t.createStore} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Learn More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works — ultra compact */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-center sm:gap-12">
          {[
            { icon: UserPlus, text: t.how1 },
            { icon: Package, text: t.how2 },
            { icon: Rocket, text: t.how3 },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-indigo-500">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-medium text-slate-800">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — single line */}
      <section className="py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-xl bg-indigo-600 px-6 py-5 sm:px-8">
          <p className="text-sm font-semibold text-white sm:text-base">{t.ctaLine}</p>
          <Link
            href="/register"
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 sm:px-6"
          >
            {t.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* Featured store card — premium design with enhanced visual hierarchy */
function FeaturedStoreCard({ store, t }: { store: StoreData; t: Record<string, string> }) {
  return (
    <Link
      href={`/s/${store.slug}`}
      className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 sm:w-72"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100">
        {store.bannerUrl && (
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <div className="flex items-start gap-3">
          {/* Logo with enhanced styling */}
          <div className="-mt-6 h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg ring-1 ring-slate-900/5">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Store info */}
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-900">{store.name}</h3>
            {store.city && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <MapPin className="h-3 w-3" />
                {store.city}
              </p>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
          {Number(store.avgRating) > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {store.avgRating}
              {store.reviewCount > 0 && <span className="text-slate-400">({store.reviewCount})</span>}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            {store.productCount} {t.products}
          </span>
        </div>

        {/* Description if available */}
        {store.description && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2">{store.description}</p>
        )}
        
        {/* Visit CTA */}
        <div className="mt-auto pt-3">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 group-hover:gap-2 transition-all">
            {t.visit}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
