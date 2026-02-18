"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Search } from "lucide-react";

const dict = {
  en: {
    title: "Orders",
    subtitle: "All orders across the platform",
    search: "Search customer...",
    customer: "Customer",
    seller: "Seller",
    item: "Item",
    price: "Price",
    status: "Status",
    date: "Date",
    contact: "Contact",
    all: "All",
    new: "New",
    contacted: "Contacted",
    completed: "Completed",
    noOrders: "No orders found",
  },
  pt: {
    title: "Pedidos",
    subtitle: "Todos os pedidos da plataforma",
    search: "Pesquisar cliente...",
    customer: "Cliente",
    seller: "Vendedor",
    item: "Item",
    price: "Preço",
    status: "Estado",
    date: "Data",
    contact: "Contacto",
    all: "Todos",
    new: "Novo",
    contacted: "Contactado",
    completed: "Concluído",
    noOrders: "Nenhum pedido encontrado",
  },
};

type Order = {
  id: number; customerName: string; customerContact: string; status: string; createdAt: string;
  sellerName: string; sellerSlug: string; itemName: string; itemPrice: string;
};

export default function AdminOrders() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.customerName.toLowerCase().includes(q) || (o.sellerName || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    return list;
  }, [orders, search, statusFilter]);

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
          {["all", "new", "contacted", "completed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${statusFilter === s ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t[s as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t.customer}</th>
              <th className="px-4 py-3">{t.seller}</th>
              <th className="px-4 py-3">{t.item}</th>
              <th className="px-4 py-3">{t.price}</th>
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.date}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t.noOrders}</td></tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-400">{o.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{o.customerName}</td>
                <td className="px-4 py-3 text-slate-600">{o.sellerName}</td>
                <td className="px-4 py-3 text-slate-600">{o.itemName || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{o.itemPrice ? `$${o.itemPrice}` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                    o.status === "contacted" ? "bg-blue-50 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
