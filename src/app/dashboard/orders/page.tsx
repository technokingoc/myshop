"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getOrders, updateOrderStatus, type OrderIntent } from "@/lib/orders";
import { DashboardShell } from "@/components/dashboard-shell";
import { Inbox, CheckCircle, Phone, Clock } from "lucide-react";

type DbOrder = {
  id: number;
  customerName: string;
  customerContact: string;
  message: string;
  itemId: number | null;
  status: "new" | "contacted" | "completed";
  createdAt: string;
};

const dict = {
  en: {
    title: "Orders",
    subtitle: "Manage customer order requests and booking intents.",
    empty: "No orders yet. When customers submit order requests from your storefront, they'll appear here.",
    item: "Item",
    new: "New",
    contacted: "Contacted",
    completed: "Completed",
    markContacted: "Mark contacted",
    markCompleted: "Mark completed",
    filterAll: "All",
    filterNew: "New",
    filterContacted: "Contacted",
    filterCompleted: "Completed",
  },
  pt: {
    title: "Pedidos",
    subtitle: "Gerir pedidos e intenções de reserva dos clientes.",
    empty: "Ainda não há pedidos. Quando os clientes submeterem pedidos na sua loja, aparecerão aqui.",
    item: "Item",
    new: "Novo",
    contacted: "Contactado",
    completed: "Concluído",
    markContacted: "Marcar contactado",
    markCompleted: "Marcar concluído",
    filterAll: "Todos",
    filterNew: "Novos",
    filterContacted: "Contactados",
    filterCompleted: "Concluídos",
  },
};

const statusColors = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const statusIcons = {
  new: Clock,
  contacted: Phone,
  completed: CheckCircle,
};

export default function OrdersPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [orders, setOrders] = useState<OrderIntent[]>([]);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "completed">("all");
  const [hydrated, setHydrated] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("myshop_seller_id");
    const id = raw ? Number(raw) : null;
    setSellerId(id);

    if (!id) {
      setOrders(getOrders());
      setHydrated(true);
      return;
    }

    fetch(`/api/orders?sellerId=${id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: DbOrder[]) => {
        if (Array.isArray(rows)) {
          setOrders(
            rows.map((o) => ({
              id: String(o.id),
              customerName: o.customerName,
              customerContact: o.customerContact,
              message: o.message || "",
              itemId: o.itemId,
              itemName: "",
              storeName: "",
              status: o.status,
              createdAt: o.createdAt,
            })),
          );
        } else {
          setOrders(getOrders());
        }
      })
      .catch(() => setOrders(getOrders()))
      .finally(() => setHydrated(true));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const handleStatus = async (id: string, status: OrderIntent["status"]) => {
    if (sellerId) {
      try {
        await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(id), status }),
        });
      } catch {}
    }

    updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  if (!hydrated) return null;

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "new", label: t.filterNew },
    { key: "contacted", label: t.filterContacted },
    { key: "completed", label: t.filterCompleted },
  ];

  return (
    <DashboardShell activePage="orders">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const StatusIcon = statusIcons[order.status];
            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.customerName}</p>
                    <p className="text-sm text-slate-600">{order.customerContact}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                    <StatusIcon className="h-3 w-3" />
                    {t[order.status]}
                  </span>
                </div>
                {order.itemName && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">{t.item}:</span> {order.itemName}
                  </p>
                )}
                {order.message && <p className="mt-1 text-sm text-slate-600">{order.message}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                  <span className="flex-1" />
                  {order.status === "new" && (
                    <button
                      onClick={() => handleStatus(order.id, "contacted")}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {t.markContacted}
                    </button>
                  )}
                  {(order.status === "new" || order.status === "contacted") && (
                    <button
                      onClick={() => handleStatus(order.id, "completed")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      {t.markCompleted}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
