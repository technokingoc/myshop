"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language";
import { Footer } from "@/components/footer";
import {
  ArrowLeft,
  Grid3X3,
  List,
  ChevronRight,
  Star,
  Package,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Product {
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
  store: {
    slug: string;
    name: string;
    city: string;
    logoUrl: string;
  };
  wishlistCount?: number;
  orderCount?: number;
}

interface Subcategory {
  id: number;
  name: string;
  nameEn: string;
  namePt: string;
  slug: string;
  icon: string;
  productCount: number;
}

interface CategoryData {
  category: {
    id: number;
    name: string;
    nameEn: string;
    namePt: string;
    slug: string;
    icon: string;
    parentId: number | null;
  };
  subcategories: Subcategory[];
  sections: {
    featured: Product[];
    topSellers: Product[];
    recent: Product[];
  };
  stats: {
    totalProducts: number;
    totalStores: number;
  };
}

const dict = {
  en: {
    backToCategories: "Back to Categories",
    subcategories: "Subcategories",
    featured: "Featured Products",
    topSellers: "Top Sellers",
    recent: "Recently Added",
    viewAll: "View All",
    products: "products",
    stores: "stores",
    loading: "Loading category...",
    error: "Failed to load category",
    noProducts: "No products found in this category",
    seeAll: "See all products",
    fromStore: "from",
    stockLeft: "left in stock",
    outOfStock: "Out of stock",
    addedDaysAgo: "Added {days} days ago",
    orders: "orders",
    wishlisted: "wishlisted",
  },
  pt: {
    backToCategories: "Voltar às Categorias",
    subcategories: "Subcategorias",
    featured: "Produtos em Destaque",
    topSellers: "Mais Vendidos",
    recent: "Adicionados Recentemente",
    viewAll: "Ver Todos",
    products: "produtos",
    stores: "lojas",
    loading: "Carregando categoria...",
    error: "Falha ao carregar categoria",
    noProducts: "Nenhum produto encontrado nesta categoria",
    seeAll: "Ver todos os produtos",
    fromStore: "de",
    stockLeft: "restam em estoque",
    outOfStock: "Fora de estoque",
    addedDaysAgo: "Adicionado há {days} dias",
    orders: "pedidos",
    wishlisted: "na wishlist",
  },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(`/api/categories/${slug}?lang=${lang}`);
        if (!response.ok) throw new Error("Failed to fetch");
        
        const categoryData = await response.json();
        setData(categoryData);
      } catch (err) {
        console.error("Error fetching category:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, lang]);

  if (loading) {
    return <CategorySkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{t.error}</h1>
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {t.backToCategories}
          </button>
        </div>
      </div>
    );
  }

  const { category, subcategories, sections, stats } = data;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:block">{t.backToCategories}</span>
              </button>
              <div className="hidden sm:block h-6 w-px bg-slate-300" />
              <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">
                {category.name}
              </h1>
            </div>
            <div className="hidden sm:flex items-center space-x-6 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{stats.totalProducts} {t.products}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{stats.totalStores} {t.stores}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Subcategories */}
        {subcategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{t.subcategories}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {subcategories.map((subcat) => (
                <Link
                  key={subcat.id}
                  href={`/categories/${subcat.slug}`}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="text-center">
                    <div className="h-12 w-12 mx-auto mb-3 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                      {subcat.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {subcat.productCount} {t.products}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {sections.featured.length > 0 && (
          <ProductSection
            title={t.featured}
            products={sections.featured}
            icon={Sparkles}
            viewAllHref={`/stores?category=${category.slug}&sort=popular`}
            t={t}
            showMetric="wishlist"
          />
        )}

        {/* Top Sellers */}
        {sections.topSellers.length > 0 && (
          <ProductSection
            title={t.topSellers}
            products={sections.topSellers}
            icon={TrendingUp}
            viewAllHref={`/stores?category=${category.slug}&sort=orders`}
            t={t}
            showMetric="orders"
          />
        )}

        {/* Recent Products */}
        {sections.recent.length > 0 && (
          <ProductSection
            title={t.recent}
            products={sections.recent}
            icon={Clock}
            viewAllHref={`/stores?category=${category.slug}&sort=recent`}
            t={t}
            showMetric="date"
          />
        )}

        {/* Empty State */}
        {sections.featured.length === 0 && sections.topSellers.length === 0 && sections.recent.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.noProducts}</h3>
            <Link
              href="/stores"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Browse all stores →
            </Link>
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Link
            href={`/stores?category=${category.slug}`}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            {t.seeAll} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Product Section Component
function ProductSection({
  title,
  products,
  icon: Icon,
  viewAllHref,
  t,
  showMetric,
}: {
  title: string;
  products: Product[];
  icon: LucideIcon;
  viewAllHref: string;
  t: Record<string, string>;
  showMetric: 'wishlist' | 'orders' | 'date';
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Icon className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm"
        >
          <span>{t.viewAll}</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            t={t}
            showMetric={showMetric}
          />
        ))}
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ 
  product, 
  t, 
  showMetric 
}: { 
  product: Product; 
  t: Record<string, string>;
  showMetric: 'wishlist' | 'orders' | 'date';
}) {
  const daysAgo = Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Link
      href={`/s/${product.store.slug}/products/${product.id}`}
      className="group bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square relative bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-slate-300" />
          </div>
        )}
        
        {/* Stock Badge */}
        {product.trackInventory && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded">
            {product.stockQuantity} {t.stockLeft}
          </div>
        )}
        
        {/* Out of Stock Badge */}
        {product.trackInventory && product.stockQuantity === 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
            {t.outOfStock}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-green-900">
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
        <p className="text-xs text-slate-500 mb-3">
          {t.fromStore} <span className="font-medium">{product.store.name}</span>
          {product.store.city && <span> · {product.store.city}</span>}
        </p>

        {/* Metric Display */}
        <div className="text-xs text-slate-400">
          {showMetric === 'wishlist' && product.wishlistCount !== undefined && (
            <span>{product.wishlistCount} {t.wishlisted}</span>
          )}
          {showMetric === 'orders' && product.orderCount !== undefined && (
            <span>{product.orderCount} {t.orders}</span>
          )}
          {showMetric === 'date' && (
            <span>{t.addedDaysAgo.replace('{days}', daysAgo.toString())}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Loading Skeleton
function CategorySkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="aspect-square bg-slate-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}