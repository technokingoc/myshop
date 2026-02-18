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
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-indigo-100 to-slate-100">
        {store.bannerUrl && (
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
        {store.businessType && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 backdrop-blur">
            {store.businessType}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {/* Avatar + Name */}
        <div className="flex items-start gap-2.5">
          <div className="-mt-6 h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-indigo-50 shadow-sm">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-indigo-400">
                {store.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="truncate text-sm font-semibold text-slate-900">{store.name}</h3>
            {store.city && (
              <p className="flex items-center gap-0.5 text-xs text-slate-500">
                <MapPin className="h-3 w-3" /> {store.city}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-0.5">
            <Package className="h-3 w-3" /> {store.productCount} {t.products}
          </span>
          {Number(store.avgRating) > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {store.avgRating}
            </span>
          )}
        </div>

        {/* CTA */}
        <span className="mt-auto pt-2 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
          {t.visit} →
        </span>
      </div>
    </Link>
  );
}
