"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Search, Trash2, Star } from "lucide-react";

const dict = {
  en: {
    title: "Reviews",
    subtitle: "Moderate customer reviews and comments",
    search: "Search by author or content...",
    author: "Author",
    content: "Content",
    rating: "Rating",
    product: "Product",
    seller: "Seller",
    date: "Date",
    actions: "Actions",
    all: "All",
    delete: "Delete",
    confirmDelete: "Delete this review?",
    noReviews: "No reviews found",
  },
  pt: {
    title: "Avaliações",
    subtitle: "Moderar avaliações e comentários de clientes",
    search: "Pesquisar por autor ou conteúdo...",
    author: "Autor",
    content: "Conteúdo",
    rating: "Classificação",
    product: "Produto",
    seller: "Vendedor",
    date: "Data",
    actions: "Ações",
    all: "Todos",
    delete: "Apagar",
    confirmDelete: "Apagar esta avaliação?",
    noReviews: "Nenhuma avaliação encontrada",
  },
};

type Review = {
  id: number; authorName: string; authorEmail: string; content: string; rating: number | null;
  createdAt: string; itemName: string; sellerName: string;
};

export default function AdminReviews() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const load = () => {
    fetch("/api/admin/reviews", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = reviews;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.authorName.toLowerCase().includes(q) || r.content.toLowerCase().includes(q));
    }
    if (ratingFilter !== "all") list = list.filter((r) => r.rating === Number(ratingFilter));
    return list;
  }, [reviews, search, ratingFilter]);

  const deleteReview = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setRatingFilter("all")}
            className={`rounded-lg px-3 py-2 text-xs font-medium ${ratingFilter === "all" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.all}
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button key={r} onClick={() => setRatingFilter(String(r))}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${ratingFilter === String(r) ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {r}★
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">{t.author}</th>
              <th className="px-4 py-3">{t.content}</th>
              <th className="px-4 py-3">{t.rating}</th>
              <th className="px-4 py-3">{t.product}</th>
              <th className="px-4 py-3">{t.seller}</th>
              <th className="px-4 py-3">{t.date}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t.noReviews}</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{r.authorName}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-600">{r.content}</td>
                <td className="px-4 py-3">
                  {r.rating ? (
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {r.rating}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.itemName || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{r.sellerName || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteReview(r.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t.delete}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
