"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Search, Trash2, Star, CheckCircle, Clock, EyeOff, Eye, Camera } from "lucide-react";

const dict = {
  en: {
    title: "Reviews",
    subtitle: "Moderate customer reviews across all stores",
    search: "Search by author or content...",
    author: "Author",
    content: "Content",
    rating: "Rating",
    product: "Product",
    seller: "Seller",
    date: "Date",
    actions: "Actions",
    status: "Status",
    all: "All",
    published: "Published",
    pending: "Pending",
    hidden: "Hidden",
    publish: "Publish",
    hide: "Hide",
    delete: "Delete",
    confirmDelete: "Delete this review?",
    noReviews: "No reviews found",
    verified: "Verified",
    helpful: "helpful",
    withPhotos: "With Photos",
  },
  pt: {
    title: "Avaliações",
    subtitle: "Moderar avaliações de clientes de todas as lojas",
    search: "Pesquisar por autor ou conteúdo...",
    author: "Autor",
    content: "Conteúdo",
    rating: "Classificação",
    product: "Produto",
    seller: "Vendedor",
    date: "Data",
    actions: "Ações",
    status: "Estado",
    all: "Todos",
    published: "Publicadas",
    pending: "Pendentes",
    hidden: "Ocultas",
    publish: "Publicar",
    hide: "Ocultar",
    delete: "Apagar",
    confirmDelete: "Apagar esta avaliação?",
    noReviews: "Nenhuma avaliação encontrada",
    verified: "Verificada",
    helpful: "útil",
    withPhotos: "Com Fotos",
  },
};

type Review = {
  id: number;
  rating: number;
  title: string;
  content: string;
  imageUrls: string;
  helpful: number;
  verified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  productName: string;
  sellerName: string;
};

export default function AdminReviews() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

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
      list = list.filter((r) => 
        r.customerName.toLowerCase().includes(q) || 
        r.content.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (ratingFilter !== "all") {
      list = list.filter((r) => r.rating === Number(ratingFilter));
    }
    return list;
  }, [reviews, search, statusFilter, ratingFilter]);

  const updateReviewStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewId: id, status: newStatus }),
      });
      if (response.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      console.error("Error updating review:", error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="h-3 w-3" />
            {t.published}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="h-3 w-3" />
            {t.pending}
          </span>
        );
      case "hidden":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            <EyeOff className="h-3 w-3" />
            {t.hidden}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </div>
        
        {/* Status filters */}
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: "all", label: t.all },
            { key: "pending", label: t.pending },
            { key: "published", label: t.published },
            { key: "hidden", label: t.hidden },
          ].map((status) => (
            <button key={status.key} onClick={() => setStatusFilter(status.key)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                statusFilter === status.key 
                  ? "bg-green-100 text-green-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {status.label}
            </button>
          ))}
        </div>

        {/* Rating filters */}
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setRatingFilter("all")}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${ratingFilter === "all" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.all}
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button key={r} onClick={() => setRatingFilter(String(r))}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${ratingFilter === String(r) ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
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
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.date}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t.noReviews}</td></tr>
            ) : filtered.map((r) => {
              const hasImages = r.imageUrls && r.imageUrls.trim();
              const imageCount = hasImages ? r.imageUrls.split(',').filter(Boolean).length : 0;
              
              return (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{r.customerName}</span>
                      {r.verified && (
                        <span className="text-green-600 text-xs" title={t.verified}>✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div>
                      {r.title && (
                        <p className="font-medium text-slate-800 truncate">{r.title}</p>
                      )}
                      <p className="text-slate-600 line-clamp-2 text-xs mt-1">{r.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {imageCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Camera className="h-3 w-3" />
                            {imageCount}
                          </span>
                        )}
                        {r.helpful > 0 && (
                          <span className="text-xs text-slate-500">
                            {r.helpful} {t.helpful}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {r.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{r.productName}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{r.sellerName}</td>
                  <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === "pending" && (
                        <button
                          onClick={() => updateReviewStatus(r.id, "published")}
                          disabled={updating === r.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                          title={t.publish}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "published" && (
                        <button
                          onClick={() => updateReviewStatus(r.id, "hidden")}
                          disabled={updating === r.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                          title={t.hide}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "hidden" && (
                        <button
                          onClick={() => updateReviewStatus(r.id, "published")}
                          disabled={updating === r.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                          title={t.publish}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(r.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title={t.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
