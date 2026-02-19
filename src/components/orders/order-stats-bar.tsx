"use client";

import { Package, AlertCircle, Loader2, DollarSign } from "lucide-react";
import type { OrderItem } from "./types";

type Props = {
  orders: OrderItem[];
  t: Record<string, string>;
};

export function OrderStatsBar({ orders, t }: Props) {
  const total = orders.length;
  const newCount = orders.filter((o) => o.status === "placed").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const revenue = orders
    .filter((o) => o.status !== "cancelled" && new Date(o.createdAt) >= monthStart)
    .reduce((sum, o) => sum + (parseFloat(o.itemPrice || "0") || 0), 0);

  const stats = [
    { label: t.totalOrders || "Total", value: total, icon: Package, color: "text-slate-600 bg-slate-100" },
    { label: t.needAttention || "Need attention", value: newCount, icon: AlertCircle, color: "text-green-600 bg-green-100" },
    { label: t.processing || "Processing", value: processingCount, icon: Loader2, color: "text-orange-600 bg-orange-100" },
    { label: t.revenueMonth || "Revenue", value: `$${revenue.toFixed(0)}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-100" },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <div className={`rounded-lg p-1.5 ${s.color}`}>
            <s.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 leading-tight">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
