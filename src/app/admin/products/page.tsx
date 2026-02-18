"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Search, Trash2, Eye, EyeOff } from "lucide-react";

const dict = {
  en: {
    title: "Products",
    subtitle: "All catalog items across the platform",
    search: "Search product...",
    name: "Name",
    seller: "Seller",
    price: "Price",
    status: "Status",
    category: "Category",
    date: "Date",
    actions: "Actions",
    all: "All",
    Published: "Published",
    Draft: "Draft",
    noProducts: "No products found",
    publish: "Publish",
    unpublish: "Unpublish",
    delete: "Delete",
    confirmDelete: "Delete this product?",
  },
  pt: {
    title: "Produtos",
    subtitle: "Todos os itens de catálogo da plataforma",
    search: "Pesquisar produto...",
    name: "Nome",
    seller: "Vendedor",
    price: "Preço",
    status: "Estado",
    category: "Categoria",
    date: "Data",
    actions: "Ações",
    all: "Todos",
    Published: "Publicado",
    Draft: "Rascunho",
    noProducts: "Nenhum produto encontrado",
    publish: "Publicar",
    unpublish: "Despublicar",
    delete: "Apagar",
    confirmDelete: "Apagar este produto?",
  },
};

type Product = {
  id: number; name: string; price: string; status: string; category: string;
  createdAt: string; sellerName: string; sellerSlug: string;
};

export default function AdminProducts() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    fetch("/api/admin/products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.sellerName || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [products, search, statusFilter]);

  const toggleStatus = async (id: number, current: string) => {
    const newStatus = current === "Published" ? "Draft" : "Published";
    await fetch(`/api/admin/products/${id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const deleteProduct = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", credentials: "include" });
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
          {["all", "Published", "Draft"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${statusFilter === s ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t[s as keyof typeof t] || s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">{t.name}</th>
              <th className="px-4 py-3">{t.seller}</th>
              <th className="px-4 py-3">{t.price}</th>
              <th className="px-4 py-3">{t.category}</th>
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.date}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t.noProducts}</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.sellerName}</td>
                <td className="px-4 py-3 text-slate-600">${p.price}</td>
                <td className="px-4 py-3 text-slate-500">{p.category || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>{t[p.status as keyof typeof t] || p.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleStatus(p.id, p.status)}
                      className="rounded p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                      title={p.status === "Published" ? t.unpublish : t.publish}>
                      {p.status === "Published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t.delete}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
