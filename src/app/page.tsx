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
      <section className="relative bg-gradient-to-b from-indigo-50/80 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 pb-6 pt-12 text-center sm:pt-16">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
            {t.heroSub}
          </p>

          {/* Integrated search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t.searchPh}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:py-3.5"
              />
              <button
                type="submit"
                className="mr-1.5 shrink-0 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-6"
              >
                {t.searchBtn}
              </button>
            </div>
          </form>

          {/* Category pills from DB */}
          {categoryPills.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {categoryPills.map((cat) => {
                const Icon = resolveCategoryIcon(cat.icon || null);
                return (
                  <Link
                    key={cat.slug}
                    href={`/stores?category=${encodeURIComponent(cat.slug)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    {cat.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Inline stats */}
          {stats && (stats.sellers > 0 || stats.products > 0) && (
            <p className="mt-4 text-xs text-slate-400">
              {stats.sellers} {t.statsStores} · {stats.products} {t.statsProducts} · {stats.orders} {t.statsOrders}
            </p>
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
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {stores.map((store) => (
                <FeaturedStoreCard key={store.slug} store={store} t={t} />
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center">
              <Store className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">{t.noStores}</p>
              <Link href="/register" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                {t.createStore} <ArrowRight className="h-4 w-4" />
              </Link>
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

/* Featured store card — compact horizontal scroll card */
function FeaturedStoreCard({ store, t }: { store: StoreData; t: Record<string, string> }) {
  return (
    <Link
      href={`/s/${store.slug}`}
      className="group flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md sm:w-64"
    >
      {/* Banner */}
      <div className="relative h-20 bg-gradient-to-br from-indigo-100 to-slate-100">
        {store.bannerUrl && (
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
        <div className="flex items-start gap-2">
          <div className="-mt-5 h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-indigo-50 shadow-sm">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-indigo-400">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="truncate text-sm font-semibold text-slate-900">{store.name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {Number(store.avgRating) > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {store.avgRating}
                </span>
              )}
              <span>{store.productCount} {t.products}</span>
            </div>
          </div>
        </div>
        <span className="mt-auto pt-2 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
          {t.visit} →
        </span>
      </div>
    </Link>
  );
}
