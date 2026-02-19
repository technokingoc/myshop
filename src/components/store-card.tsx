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
  en: { visit: "Visit", products: "products" },
  pt: { visit: "Visitar", products: "produtos" },
};

export function StoreCard({ store }: StoreCardProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  return (
    <Link
      href={`/s/${store.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Enhanced Banner */}
      <div className="relative h-28 bg-gradient-to-br from-indigo-100 via-purple-50 to-slate-100">
        {store.bannerUrl && (
          <>
            <img src={store.bannerUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </>
        )}
        {store.businessType && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
            {store.businessType}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          <div className="-mt-8 h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg ring-1 ring-slate-900/5">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">{store.name}</h3>
            {store.city && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="h-3 w-3" />
                {store.city}
              </p>
            )}
          </div>
        </div>

        {/* Description if available */}
        {store.description && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-2">{store.description}</p>
        )}

        {/* Enhanced Stats */}
        <div className="mt-3 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            {store.productCount} {t.products}
          </span>
          {Number(store.avgRating) > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {store.avgRating}
              {store.reviewCount > 0 && (
                <span className="text-slate-400">({store.reviewCount})</span>
              )}
            </span>
          )}
        </div>

        {/* Enhanced CTA */}
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 group-hover:gap-2 transition-all">
            {t.visit}
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
