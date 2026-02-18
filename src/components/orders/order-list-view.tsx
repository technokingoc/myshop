"use client";

import { Clock, Phone, Package, Truck, CheckCircle, Ban } from "lucide-react";
import type { OrderItem, OrderStatus } from "./types";
import { STATUS_FLOW, statusColorMap } from "./types";

const statusIcons: Record<string, typeof Clock> = {
  new: Clock, contacted: Phone, processing: Package, shipped: Truck, completed: CheckCircle, cancelled: Ban,
};

type Props = {
  orders: OrderItem[];
  onSelect: (order: OrderItem) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  t: Record<string, string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  showSeller?: boolean;
};

export function OrderListView({ orders, onSelect, onStatusChange, t, selectedIds, onToggleSelect, showSeller }: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{t.empty}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table - hidden on mobile */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2.5 w-8">
                <input type="checkbox" className="rounded border-slate-300"
                  checked={orders.length > 0 && orders.every(o => selectedIds.has(o.id))}
                  onChange={() => {
                    const allSelected = orders.every(o => selectedIds.has(o.id));
                    orders.forEach(o => { if (allSelected ? selectedIds.has(o.id) : !selectedIds.has(o.id)) onToggleSelect(o.id); });
                  }} />
              </th>
              <th className="px-3 py-2.5">{t.orderRef || "Ref"}</th>
              <th className="px-3 py-2.5">{t.item || "Customer"}</th>
              {showSeller && <th className="px-3 py-2.5">Seller</th>}
              <th className="px-3 py-2.5">{t.items || "Items"}</th>
              <th className="px-3 py-2.5">{t.total || "Total"}</th>
              <th className="px-3 py-2.5">{t.changeStatus || "Status"}</th>
              <th className="px-3 py-2.5">{t.from || "Date"}</th>
              <th className="px-3 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const Icon = statusIcons[order.status] || Clock;
              const colors = statusColorMap[order.status] || statusColorMap.new;
              return (
                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer" onClick={() => onSelect(order)}>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300"
                      checked={selectedIds.has(order.id)} onChange={() => onToggleSelect(order.id)} />
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">ORD-{order.id}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800 text-sm">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{order.customerContact}</p>
                  </td>
                  {showSeller && <td className="px-3 py-2.5 text-slate-600 text-xs">{order.sellerName || "—"}</td>}
                  <td className="px-3 py-2.5 text-slate-600 text-xs">{order.itemName || "—"}{order.itemType ? ` • ${order.itemType}` : ""}</td>
                  <td className="px-3 py-2.5 text-slate-700 font-medium text-xs">{order.itemPrice ? `$${order.itemPrice}` : "—"}</td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`appearance-none rounded-full pl-6 pr-3 py-1 text-xs font-medium cursor-pointer border-0 ${colors.badge}`}>
                        {STATUS_FLOW.map(s => <option key={s} value={s}>{t[s] || s}</option>)}
                        <option value="cancelled">{t.cancelled || "Cancelled"}</option>
                      </select>
                      <Icon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(order); }}
                      className="text-xs text-slate-500 hover:text-slate-700">↗</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {orders.map((order) => {
          const Icon = statusIcons[order.status] || Clock;
          const colors = statusColorMap[order.status] || statusColorMap.new;
          return (
            <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-3.5" onClick={() => onSelect(order)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-300 shrink-0"
                    checked={selectedIds.has(order.id)} onChange={(e) => { e.stopPropagation(); onToggleSelect(order.id); }}
                    onClick={(e) => e.stopPropagation()} />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-slate-500">ORD-{order.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${colors.badge}`}>
                  <Icon className="h-3 w-3" />{t[order.status] || order.status}
                </span>
              </div>
              {order.itemName && <p className="text-xs text-slate-600 mb-1">{order.itemName} {order.itemPrice ? `• $${order.itemPrice}` : ""}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                    {STATUS_FLOW.map(s => <option key={s} value={s}>{t[s] || s}</option>)}
                    <option value="cancelled">{t.cancelled || "Cancelled"}</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
