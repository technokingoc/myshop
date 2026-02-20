"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { Footer } from "@/components/footer";
import { FAB } from "@/components/fab";
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
  TrendingUp,
  Clock,
  Sparkles,
  ChevronLeft,
  Play,
  Pause,
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
    newArrivals: "New Arrivals",
    trending: "Trending Now",
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
    freshProducts: "Fresh products added recently",
    hotItems: "What's hot right now",
    fromStore: "from",
    addedDays: "Added {days} days ago",
    orders: "orders",
    wishlisted: "in wishlists",
    autoRotating: "Auto-rotating",
    pauseCarousel: "Pause carousel",
    playCarousel: "Play carousel",
    nearYou: "Stores Near You",
    localStores: "Discover local stores in your area",
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
    newArrivals: "Novidades",
    trending: "Em Alta",
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
    freshProducts: "Produtos frescos adicionados recentemente",
    hotItems: "O que está em alta agora",
    fromStore: "de",
    addedDays: "Adicionado há {days} dias",
    orders: "pedidos",
    wishlisted: "em wishlists",
    autoRotating: "Rotação automática",
    pauseCarousel: "Pausar carrossel",
    playCarousel: "Tocar carrossel",
    nearYou: "Lojas Perto de Si",
    localStores: "Descubra lojas locais na sua área",
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
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  shortDescription: string;
  category: string;
  stockQuantity: number;
  trackInventory: boolean;
  createdAt: string;
  daysAgo?: number;
  store: {
    slug: string;
    name: string;
    city: string;
    logoUrl: string;
  };
  trending?: {
    score: number;
    orderCount: number;
    wishlistCount: number;
    timeframe: string;
  };
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
  const [newArrivals, setNewArrivals] = useState<ProductData[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<ProductData[]>([]);
  const [locationStores, setLocationStores] = useState<StoreData[]>([]);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch stores
    fetch("/api/stores?limit=8&sort=popular")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setStores(d.stores || []);
        }
      })
      .catch(() => {});

    // Fetch stats
    fetch("/api/stores/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => {});

    // Fetch categories
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setDbCategories(d); })
      .catch(() => {});

    // Fetch new arrivals
    fetch("/api/products/new-arrivals?limit=8&days=14")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.products) {
          setNewArrivals(d.products);
        }
      })
      .catch(() => {});

    // Fetch trending products
    fetch("/api/products/trending?limit=8&timeframe=7d")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.products) {
          setTrendingProducts(d.products);
        }
      })
      .catch(() => {});

    // Fetch location-based stores (try to detect user location)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get location-based stores
          const { latitude, longitude } = position.coords;
          fetch(`/api/stores?limit=6&sort=popular&lat=${latitude}&lng=${longitude}&maxDistance=50`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
              if (d?.stores && d.stores.length > 0) {
                setLocationStores(d.stores);
              }
            })
            .catch(() => {});
        },
        () => {
          // Fallback to city-based recommendations for Mozambique
          const mozambiqueCities = ["Maputo", "Beira", "Nampula", "Matola", "Chimoio"];
          const randomCity = mozambiqueCities[Math.floor(Math.random() * mozambiqueCities.length)];
          fetch(`/api/stores?limit=6&sort=popular&location=${randomCity}`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
              if (d?.stores && d.stores.length > 0) {
                setLocationStores(d.stores);
              }
            })
            .catch(() => {});
        }
      );
    }
  }, []);

  // Auto-rotating carousel for featured stores
  useEffect(() => {
    if (stores.length <= 1 || isCarouselPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentStoreIndex((prev) => (prev + 1) % Math.min(stores.length, 6)); // Show max 6 stores in rotation
    }, 4000); // Rotate every 4 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stores.length, isCarouselPaused]);

  const toggleCarousel = useCallback(() => {
    setIsCarouselPaused(!isCarouselPaused);
  }, [isCarouselPaused]);

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
      <section className="relative bg-gradient-to-b from-green-50/80 via-white to-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100/40 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl opacity-20">
          <div className="h-64 w-64 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pt-20 lg:pt-32">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg lg:text-xl">
            {t.heroSub}
          </p>

          {/* Enhanced search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg focus-within:border-green-400 focus-within:ring-4 focus-within:ring-green-100 transition-all">
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
                className="mr-2 shrink-0 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md sm:px-8 sm:py-4"
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
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700 hover:shadow-md hover:-translate-y-0.5"
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

      {/* Featured stores — auto-rotating carousel */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{t.featured}</h2>
              {stores.length > 1 && (
                <button
                  onClick={toggleCarousel}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  title={isCarouselPaused ? t.playCarousel : t.pauseCarousel}
                >
                  {isCarouselPaused ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{t.autoRotating}</span>
                </button>
              )}
            </div>
            <Link href="/stores" className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
              {t.viewAll} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {stores.length > 0 ? (
            <div className="mt-6 relative">
              {/* Carousel Navigation */}
              {stores.length > 1 && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
                  <button
                    onClick={() => setCurrentStoreIndex((prev) => (prev - 1 + Math.min(stores.length, 6)) % Math.min(stores.length, 6))}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all text-slate-600 hover:text-slate-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
              {stores.length > 1 && (
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                  <button
                    onClick={() => setCurrentStoreIndex((prev) => (prev + 1) % Math.min(stores.length, 6))}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all text-slate-600 hover:text-slate-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Store Cards */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {stores.slice(currentStoreIndex, currentStoreIndex + 4).concat(
                  stores.length > currentStoreIndex + 4 ? stores.slice(0, Math.max(0, currentStoreIndex + 4 - stores.length)) : []
                ).slice(0, 4).map((store, index) => (
                  <FeaturedStoreCard key={`${store.slug}-${index}`} store={store} t={t} />
                ))}
              </div>

              {/* Carousel Indicators */}
              {stores.length > 4 && (
                <div className="flex justify-center mt-4 gap-2">
                  {Array.from({ length: Math.min(stores.length, 6) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStoreIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStoreIndex ? 'bg-green-600' : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <div className="mx-auto w-full max-w-lg rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 px-6 py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Store className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{t.noStores}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Join our growing marketplace and start your business journey today. 
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md">
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

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t.newArrivals}</h2>
                  <p className="text-sm text-slate-600">{t.freshProducts}</p>
                </div>
              </div>
              <Link href="/stores?sort=recent" className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
                {t.viewAll} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} t={t} showMetric="date" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products Section */}
      {trendingProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t.trending}</h2>
                  <p className="text-sm text-slate-600">{t.hotItems}</p>
                </div>
              </div>
              <Link href="/stores?sort=trending" className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
                {t.viewAll} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} t={t} showMetric="trending" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location-Based Store Recommendations */}
      {locationStores.length > 0 && (
        <section className="py-16 bg-slate-50/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t.nearYou}</h2>
                  <p className="text-sm text-slate-600">{t.localStores}</p>
                </div>
              </div>
              <Link href="/stores?sort=distance" className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700">
                {t.viewAll} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {locationStores.slice(0, 6).map((store) => (
                <FeaturedStoreCard key={`location-${store.slug}`} store={store} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works — ultra compact */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 sm:flex-row sm:justify-center sm:gap-12">
          {[
            { icon: UserPlus, text: t.how1 },
            { icon: Package, text: t.how2 },
            { icon: Rocket, text: t.how3 },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-green-500">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-medium text-slate-800">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — single line */}
      <section className="py-16 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-2xl bg-green-600 px-8 py-8 sm:px-12">
          <p className="text-sm font-semibold text-white sm:text-base">{t.ctaLine}</p>
          <Link
            href="/register"
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 sm:px-6"
          >
            {t.ctaBtn}
          </Link>
        </div>
      </section>

      <Footer />
      
      {/* FAB for mobile */}
      <FAB href="/stores" icon={Store}>
        Browse Stores
      </FAB>
    </div>
  );
}

/* Product card component for new arrivals and trending sections */
function ProductCard({ 
  product, 
  t, 
  showMetric 
}: { 
  product: ProductData; 
  t: Record<string, string>;
  showMetric: 'date' | 'trending';
}) {
  const daysAgo = Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Link
      href={`/s/${product.store.slug}/products/${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-green-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square relative bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}
        
        {/* Stock Badge */}
        {product.trackInventory && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
            {product.stockQuantity} left
          </div>
        )}
        
        {/* Price Badge for compare at price */}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-green-900 transition-colors">
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg font-bold text-slate-900">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-slate-500 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Store Info */}
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <span>{t.fromStore} <span className="font-medium">{product.store.name}</span></span>
          {product.store.city && (
            <>
              <span>•</span>
              <MapPin className="h-3 w-3" />
              <span>{product.store.city}</span>
            </>
          )}
        </p>

        {/* Metric Display */}
        <div className="flex items-center text-xs text-slate-600">
          {showMetric === 'date' && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-green-500" />
              <span>{t.addedDays.replace('{days}', daysAgo.toString())}</span>
            </div>
          )}
          {showMetric === 'trending' && product.trending && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-500" />
                <span>{product.trending.orderCount} {t.orders}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500" />
                <span>{product.trending.wishlistCount} {t.wishlisted}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* Featured store card — premium design with enhanced visual hierarchy */
function FeaturedStoreCard({ store, t }: { store: StoreData; t: Record<string, string> }) {
  return (
    <Link
      href={`/s/${store.slug}`}
      className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-green-200 hover:shadow-xl hover:-translate-y-1 sm:w-72"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-green-100 via-emerald-50 to-slate-100">
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
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-bold text-white">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Store info */}
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-green-900">{store.name}</h3>
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
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 group-hover:text-green-700 group-hover:gap-2 transition-all">
            {t.visit}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
