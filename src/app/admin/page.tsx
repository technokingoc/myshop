"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Users, Package, ShoppingCart, MessageSquare, DollarSign, TrendingUp, ArrowRight } from "lucide-react";

const dict = {
  en: {
    title: "Admin Dashboard",
    subtitle: "Platform overview and recent activity",
    sellers: "Sellers",
    products: "Products",
    orders: "Orders",
    reviews: "Reviews",
    revenue: "Revenue",
    recentOrders: "Recent Orders",
    growth: "Seller Growth",
    quickLinks: "Quick Links",
    manageSellers: "Manage Sellers",
    manageOrders: "Manage Orders",
    manageProducts: "Manage Products",
    manageReviews: "Moderate Reviews",
    noData: "No data yet",
    customer: "Customer",
    seller: "Seller",
    item: "Item",
    status: "Status",
    date: "Date",
  },
  pt: {
    title: "Painel de Admin",
    subtitle: "Visão geral da plataforma e atividade recente",
    sellers: "Vendedores",
    products: "Produtos",
    orders: "Pedidos",
    reviews: "Avaliações",
    revenue: "Receita",
    recentOrders: "Pedidos Recentes",
    growth: "Crescimento de Vendedores",
    quickLinks: "Links Rápidos",
    manageSellers: "Gerir Vendedores",
    manageOrders: "Gerir Pedidos",
    manageProducts: "Gerir Produtos",
    manageReviews: "Moderar Avaliações",
    noData: "Sem dados ainda",
    customer: "Cliente",
    seller: "Vendedor",
    item: "Item",
    status: "Estado",
    date: "Data",
  },
};

type Stats = { sellers: number; products: number; orders: number; reviews: number; revenue: string };
type RecentOrder = { id: number; customerName: string; sellerName: string; itemName: string; itemPrice: string; status: string; createdAt: string };
type GrowthPoint = { month: string; count: number };

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setRecentOrders(d.recentOrders || []);
        setGrowth(d.growth || []);
      })
      .catch(() => {});
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: t.sellers, value: stats.sellers, icon: Users, color: "text-violet-600 bg-violet-50" },
      { label: t.products, value: stats.products, icon: Package, color: "text-green-600 bg-green-50" },
      { label: t.orders, value: stats.orders, icon: ShoppingCart, color: "text-emerald-600 bg-emerald-50" },
      { label: t.reviews, value: stats.reviews, icon: MessageSquare, color: "text-amber-600 bg-amber-50" },
      { label: t.revenue, value: `$${Number(stats.revenue).toFixed(2)}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
    ];
  }, [stats, t]);

  const maxGrowth = Math.max(...growth.map((g) => g.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">{t.recentOrders}</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">{t.noData}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                    <th className="pb-2 pr-3">{t.customer}</th>
                    <th className="pb-2 pr-3">{t.seller}</th>
                    <th className="pb-2 pr-3">{t.item}</th>
                    <th className="pb-2 pr-3">{t.status}</th>
                    <th className="pb-2">{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-medium text-slate-800">{o.customerName}</td>
                      <td className="py-2 pr-3 text-slate-600">{o.sellerName}</td>
                      <td className="py-2 pr-3 text-slate-600">{o.itemName || "—"}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                          o.status === "contacted" ? "bg-green-50 text-green-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{o.status}</span>
                      </td>
                      <td className="py-2 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Growth chart + quick links */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              {t.growth}
            </h2>
            {growth.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noData}</p>
            ) : (
              <div className="flex items-end gap-1" style={{ height: 80 }}>
                {growth.map((g) => (
                  <div key={g.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-violet-500"
                      style={{ height: `${(g.count / maxGrowth) * 60}px`, minHeight: 4 }}
                    />
                    <span className="text-[9px] text-slate-400">{g.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{t.quickLinks}</h2>
            <div className="space-y-2">
              {[
                { label: t.manageSellers, href: "/admin/sellers" },
                { label: t.manageOrders, href: "/admin/orders" },
                { label: t.manageProducts, href: "/admin/products" },
                { label: t.manageReviews, href: "/admin/reviews" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
