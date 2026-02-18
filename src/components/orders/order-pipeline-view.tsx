"use client";

import { Clock, Phone, Package, Truck, CheckCircle } from "lucide-react";
import type { OrderItem, OrderStatus } from "./types";
import { STATUS_FLOW, statusColorMap } from "./types";

const statusIcons: Record<string, typeof Clock> = {
  new: Clock, contacted: Phone, processing: Package, shipped: Truck, completed: CheckCircle,
};

type Props = {
  orders: OrderItem[];
  onSelect: (order: OrderItem) => void;
  t: Record<string, string>;
};

export function OrderPipelineView({ orders, onSelect, t }: Props) {
  const columns = STATUS_FLOW.map((status) => ({
    status,
    label: t[`filter${status.charAt(0).toUpperCase() + status.slice(1)}`] || t[status] || status,
    orders: orders.filter((o) => o.status === status),
    colors: statusColorMap[status],
    Icon: statusIcons[status] || Clock,
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
      {columns.map((col) => (
        <div key={col.status} className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start">
          <div className={`rounded-t-lg border-t-3 ${col.colors.border} bg-white border border-slate-200 rounded-xl overflow-hidden`}>
            {/* Column header */}
            <div className={`px-3 py-2.5 border-b border-slate-100 ${col.colors.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <col.Icon className={`h-4 w-4 ${col.colors.text}`} />
                  <span className={`text-sm font-semibold ${col.colors.text}`}>{col.label}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${col.colors.badge}`}>{col.orders.length}</span>
              </div>
            </div>
            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
              {col.orders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">&mdash;</p>
              ) : col.orders.map((order) => (
                <div key={order.id} onClick={() => onSelect(order)}
                  className="rounded-lg border border-slate-150 bg-white p-2.5 hover:shadow-sm cursor-pointer transition hover:border-slate-300">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{order.customerName}</p>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">ORD-{order.id}</span>
                  </div>
                  {order.itemName && (
                    <p className="text-xs text-slate-500 truncate">{order.itemName}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    {order.itemPrice && <span className="text-xs font-semibold text-slate-700">${order.itemPrice}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
