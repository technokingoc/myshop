"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Package, Loader2, ExternalLink, Clock, CheckCircle, Truck, AlertCircle, RotateCcw, ShoppingCart } from "lucide-react";

const dict = {
  en: {
    title: "My Orders", subtitle: "Track your orders across all stores",
    loading: "Loading...", noOrders: "No orders yet", noOrdersHint: "Your orders will appear here after you place one.",
    ref: "Ref", store: "Store", status: "Status", track: "Track", reorder: "Reorder",
    new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
    reordering: "Adding to cart...", reordered: "Added to cart!", reorderError: "Item no longer available",
    viewCart: "View Cart",
  },
  pt: {
    title: "Meus Pedidos", subtitle: "Acompanhe seus pedidos em todas as lojas",
    loading: "A carregar...", noOrders: "Sem pedidos", noOrdersHint: "Seus pedidos aparecerão aqui depois de fazer um.",
    ref: "Ref", store: "Loja", status: "Estado", track: "Rastrear", reorder: "Repetir Pedido",
    new: "Novo", confirmed: "Confirmado", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
    reordering: "A adicionar ao carrinho...", reordered: "Adicionado ao carrinho!", reorderError: "Item não está mais disponível",
    viewCart: "Ver Carrinho",
  },
};

type Order = { id: number; status: string; message: string; createdAt: string; sellerName: string; sellerSlug: string; itemName: string | null; itemPrice: string | null; itemId: number | null };

const statusIcon: Record<string, typeof Clock> = { new: Clock, confirmed: CheckCircle, shipped: Truck, delivered: CheckCircle, cancelled: AlertCircle };
const statusColor: Record<string, string> = { new: "bg-green-50 text-green-700", confirmed: "bg-emerald-50 text-emerald-700", shipped: "bg-amber-50 text-amber-700", delivered: "bg-green-50 text-green-700", cancelled: "bg-red-50 text-red-600" };

export default function CustomerOrdersPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [reorderMessage, setReorderMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/customer/orders", { credentials: "include" })
      .then((r) => { if (r.status === 401) { router.push("/customer/login"); return []; } return r.json(); })
      .then((data) => { if (Array.isArray(data)) setOrders(data); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleReorder = async (orderId: number) => {
    setReorderingId(orderId);
    setReorderMessage("");
    
    try {
      const response = await fetch("/api/auth/customer/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        setReorderMessage(t.reordered);
        setTimeout(() => setReorderMessage(""), 3000);
      } else {
        setReorderMessage(data.error || t.reorderError);
        setTimeout(() => setReorderMessage(""), 3000);
      }
    } catch (error) {
      setReorderMessage(t.reorderError);
      setTimeout(() => setReorderMessage(""), 3000);
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="ml-2 text-sm text-slate-500">{t.loading}</span></div>;

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100"><Package className="h-5 w-5 text-green-600" /></div>
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
          {reorderMessage && (
            <div className={`rounded-xl border p-3 text-sm ${
              reorderMessage.includes("Added") || reorderMessage.includes("Adicionado") 
                ? "border-green-200 bg-green-50 text-green-800" 
                : "border-red-200 bg-red-50 text-red-800"
            }`}>
              <div className="flex items-center gap-2">
                {reorderMessage.includes("Added") || reorderMessage.includes("Adicionado") ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{reorderMessage}</span>
                    <Link 
                      href="/cart" 
                      className="ml-auto text-xs font-medium underline hover:no-underline"
                    >
                      {t.viewCart}
                    </Link>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>{reorderMessage}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {orders.map((order) => {
            const Icon = statusIcon[order.status] || Clock;
            const color = statusColor[order.status] || "bg-slate-50 text-slate-600";
            const statusLabel = (t as Record<string, string>)[order.status] || order.status;
            const isReordering = reorderingId === order.id;
            const canReorder = order.itemId && (order.status === "delivered" || order.status === "confirmed");
            
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
                    {order.itemPrice && (
                      <p className="mt-0.5 text-sm font-semibold text-green-600">${order.itemPrice}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <Link href={`/s/${order.sellerSlug}`} className="font-medium text-green-600 hover:text-green-700">{order.sellerName}</Link>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {canReorder && (
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={isReordering}
                        className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition"
                      >
                        {isReordering ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="hidden sm:inline">{t.reordering}</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">{t.reorder}</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    <Link 
                      href={`/track/ORD-${order.id}`} 
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="hidden sm:inline">{t.track}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
