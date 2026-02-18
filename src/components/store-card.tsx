"use client";

import Link from "next/link";
import { Star, MapPin, Package } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface StoreCardProps {
  store: {
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
  };
}

const dict = {
  en: { visit: "Visit store", products: "products", reviews: "reviews" },
  pt: { visit: "Visitar loja", products: "produtos", reviews: "avaliações" },
};

export function StoreCard({ store }: StoreCardProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      {/* Banner */}
      <div className="relative h-28 bg-gradient-to-br from-indigo-100 to-slate-100">
        {store.bannerUrl && (
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
        {store.businessType && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-600 backdrop-blur">
            {store.businessType}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          <div className="-mt-8 h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-indigo-50 shadow-sm">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-400">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 pt-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{store.name}</h3>
            {store.city && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                {store.city}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {store.description && (
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {store.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {store.productCount} {t.products}
          </span>
          {Number(store.avgRating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {store.avgRating}
              <span className="text-slate-400">({store.reviewCount})</span>
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/s/${store.slug}`}
          className="mt-3 block rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          {t.visit}
        </Link>
      </div>
    </article>
  );
}
