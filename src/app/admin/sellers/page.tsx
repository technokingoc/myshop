"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Search, ExternalLink, Trash2, Shield, ShieldOff } from "lucide-react";

const dict = {
  en: {
    title: "Sellers",
    subtitle: "Manage all platform sellers",
    search: "Search by name or email...",
    name: "Name",
    email: "Email",
    slug: "Slug",
    products: "Products",
    orders: "Orders",
    role: "Role",
    joined: "Joined",
    actions: "Actions",
    all: "All",
    admin: "Admin",
    seller: "Seller",
    makeAdmin: "Make Admin",
    makeSeller: "Make Seller",
    delete: "Delete",
    viewStore: "View Store",
    confirmDelete: "Delete this seller? This cannot be undone.",
    noSellers: "No sellers found",
  },
  pt: {
    title: "Vendedores",
    subtitle: "Gerir todos os vendedores da plataforma",
    search: "Pesquisar por nome ou email...",
    name: "Nome",
    email: "Email",
    slug: "Slug",
    products: "Produtos",
    orders: "Pedidos",
    role: "Função",
    joined: "Registo",
    actions: "Ações",
    all: "Todos",
    admin: "Admin",
    seller: "Vendedor",
    makeAdmin: "Tornar Admin",
    makeSeller: "Tornar Vendedor",
    delete: "Apagar",
    viewStore: "Ver Loja",
    confirmDelete: "Apagar este vendedor? Esta ação é irreversível.",
    noSellers: "Nenhum vendedor encontrado",
  },
};

type Seller = {
  id: number; name: string; email: string; slug: string; role: string;
  createdAt: string; productCount: number; orderCount: number;
};

export default function AdminSellers() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = () => {
    fetch("/api/admin/sellers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSellers(d.sellers || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = sellers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
    }
    if (roleFilter !== "all") list = list.filter((s) => s.role === roleFilter);
    return list;
  }, [sellers, search, roleFilter]);

  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "seller" : "admin";
    await fetch(`/api/admin/sellers/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    load();
  };

  const deleteSeller = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/admin/sellers/${id}`, { method: "DELETE", credentials: "include" });
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
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="flex gap-1">
          {["all", "seller", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                roleFilter === r ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t[r as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">{t.name}</th>
              <th className="px-4 py-3">{t.email}</th>
              <th className="px-4 py-3">{t.slug}</th>
              <th className="px-4 py-3 text-center">{t.products}</th>
              <th className="px-4 py-3 text-center">{t.orders}</th>
              <th className="px-4 py-3">{t.role}</th>
              <th className="px-4 py-3">{t.joined}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t.noSellers}</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="px-4 py-3 text-slate-500">{s.slug}</td>
                <td className="px-4 py-3 text-center text-slate-600">{s.productCount}</td>
                <td className="px-4 py-3 text-center text-slate-600">{s.orderCount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                  }`}>{s.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a href={`/s/${s.slug}`} target="_blank" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title={t.viewStore}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => toggleRole(s.id, s.role)} className="rounded p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title={s.role === "admin" ? t.makeSeller : t.makeAdmin}>
                      {s.role === "admin" ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteSeller(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t.delete}>
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
