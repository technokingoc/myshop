"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Package, Loader2, ExternalLink, Clock, CheckCircle, Truck, AlertCircle } from "lucide-react";

const dict = {
  en: {
    title: "My Orders", subtitle: "Track your orders across all stores",
    loading: "Loading...", noOrders: "No orders yet", noOrdersHint: "Your orders will appear here after you place one.",
    ref: "Ref", store: "Store", status: "Status", track: "Track",
    new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
  },
  pt: {
    title: "Meus Pedidos", subtitle: "Acompanhe seus pedidos em todas as lojas",
    loading: "A carregar...", noOrders: "Sem pedidos", noOrdersHint: "Seus pedidos aparecerão aqui depois de fazer um.",
    ref: "Ref", store: "Loja", status: "Estado", track: "Rastrear",
    new: "Novo", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  },
};

type Order = { id: number; status: string; message: string; createdAt: string; sellerName: string; sellerSlug: string; itemName: string | null; itemPrice: string | null };

const statusIcon: Record<string, typeof Clock> = { new: Clock, confirmed: CheckCircle, shipped: Truck, delivered: CheckCircle, cancelled: AlertCircle };
const statusColor: Record<string, string> = { new: "bg-blue-50 text-blue-700", confirmed: "bg-emerald-50 text-emerald-700", shipped: "bg-amber-50 text-amber-700", delivered: "bg-green-50 text-green-700", cancelled: "bg-red-50 text-red-600" };

export default function CustomerOrdersPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/customer/orders", { credentials: "include" })
      .then((r) => { if (r.status === 401) { router.push("/customer/login"); return []; } return r.json(); })
      .then((data) => { if (Array.isArray(data)) setOrders(data); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="ml-2 text-sm text-slate-500">{t.loading}</span></div>;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100"><Package className="h-5 w-5 text-indigo-600" /></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noOrders}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noOrdersHint}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => {
            const Icon = statusIcon[order.status] || Clock;
            const color = statusColor[order.status] || "bg-slate-50 text-slate-600";
            const statusLabel = (t as Record<string, string>)[order.status] || order.status;
            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">ORD-{order.id}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
                        <Icon className="h-3 w-3" /> {statusLabel}
                      </span>
                    </div>
                    {order.itemName && <p className="mt-1 truncate text-sm text-slate-700">{order.itemName}</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <Link href={`/s/${order.sellerSlug}`} className="font-medium text-indigo-600 hover:text-indigo-700">{order.sellerName}</Link>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/track/ORD-${order.id}`} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <ExternalLink className="h-3 w-3" /> {t.track}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
