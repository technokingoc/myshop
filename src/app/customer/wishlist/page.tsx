"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Heart, Loader2, Trash2, ShoppingBag } from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";

const dict = {
  en: {
    title: "My Wishlist", subtitle: "Products you've saved",
    loading: "Loading...", empty: "Your wishlist is empty", emptyHint: "Browse stores and tap the heart icon to save products.",
    remove: "Remove", order: "Order", browse: "Browse stores",
  },
  pt: {
    title: "Meus Favoritos", subtitle: "Produtos que guardou",
    loading: "A carregar...", empty: "A sua lista está vazia", emptyHint: "Navegue pelas lojas e toque no ícone de coração para guardar.",
    remove: "Remover", order: "Encomendar", browse: "Ver lojas",
  },
};

type WishItem = { wishlistId: number; catalogItemId: number; itemName: string; itemPrice: string; itemImageUrl: string; itemCategory: string; sellerSlug: string; sellerName: string; sellerCurrency: string };

export default function WishlistPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist", { credentials: "include" })
      .then((r) => { if (r.status === 401) { router.push("/customer/login"); return []; } return r.json(); })
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .finally(() => setLoading(false));
  }, [router]);

  const remove = async (catalogItemId: number) => {
    setItems((prev) => prev.filter((i) => i.catalogItemId !== catalogItemId));
    await fetch(`/api/wishlist?catalogItemId=${catalogItemId}`, { method: "DELETE", credentials: "include" });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="ml-2 text-sm text-slate-500">{t.loading}</span></div>;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><Heart className="h-5 w-5 fill-red-500 text-red-500" /></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.empty}</p>
          <p className="mt-1 text-xs text-slate-400">{t.emptyHint}</p>
          <Link href="/stores" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{t.browse}</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.catalogItemId} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex gap-3 p-3">
                {item.itemImageUrl ? (
                  <img src={item.itemImageUrl} alt={item.itemName} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <PlaceholderImage className="h-20 w-20 shrink-0 rounded-lg" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.itemName}</p>
                  <p className="mt-0.5 text-sm font-bold text-indigo-600">{item.sellerCurrency} {item.itemPrice}</p>
                  <Link href={`/s/${item.sellerSlug}`} className="mt-0.5 block truncate text-xs text-slate-500 hover:text-indigo-600">{item.sellerName}</Link>
                </div>
              </div>
              <div className="flex border-t border-slate-100">
                <button onClick={() => remove(item.catalogItemId)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition">
                  <Trash2 className="h-3.5 w-3.5" /> {t.remove}
                </button>
                <div className="w-px bg-slate-100" />
                <Link href={`/s/${item.sellerSlug}`} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition">
                  <ShoppingBag className="h-3.5 w-3.5" /> {t.order}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
