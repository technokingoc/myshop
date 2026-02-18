"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { getDict } from "@/lib/i18n";

import type { OrderItem, OrderStatus, DateRange } from "@/components/orders/types";
import { OrderStatsBar } from "@/components/orders/order-stats-bar";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderListView } from "@/components/orders/order-list-view";
import { OrderPipelineView } from "@/components/orders/order-pipeline-view";
import { OrderDetailPanel } from "@/components/orders/order-detail-panel";

type ApiOrder = {
  id: number; customerName: string; customerContact: string; message: string;
  status: string; createdAt: string; sellerId: number;
  sellerName: string; sellerSlug: string;
  itemId: number | null; itemName: string; itemPrice: string;
  notes?: string; statusHistory?: Array<{ status: string; at: string; note?: string }>;
};

export default function AdminOrders() {
  const { lang } = useLanguage();
  const t = getDict(lang).orders as unknown as Record<string, string>;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sellerFilter, setSellerFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setOrders((d.orders || []).map((o: ApiOrder): OrderItem => ({
          id: String(o.id), customerName: o.customerName, customerContact: o.customerContact,
          message: o.message || "", itemId: o.itemId, itemName: o.itemName || "",
          itemPrice: o.itemPrice || "", storeName: "", status: o.status as OrderStatus,
          notes: o.notes || "", statusHistory: o.statusHistory || [],
          createdAt: o.createdAt, sellerName: o.sellerName, sellerSlug: o.sellerSlug,
        })));
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) && !(o.sellerName || "").toLowerCase().includes(q) && !o.id.includes(q)) return false;
      }
      if (sellerFilter && !(o.sellerName || "").toLowerCase().includes(sellerFilter.toLowerCase())) return false;
      if (dateRange !== "all") {
        const diff = (now.getTime() - new Date(o.createdAt).getTime()) / 86400000;
        if (dateRange === "today" && diff > 1) return false;
        if (dateRange === "7d" && diff > 7) return false;
        if (dateRange === "30d" && diff > 30) return false;
      }
      return true;
    });
  }, [orders, filter, search, dateRange, sellerFilter]);

  const handleStatus = useCallback(async (id: string, status: OrderStatus, note?: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
    } catch {}
    const historyEntry = { status, at: new Date().toISOString(), note };
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, statusHistory: [...(o.statusHistory || []), historyEntry] } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status, statusHistory: [...(prev.statusHistory || []), historyEntry] } : prev);
  }, []);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: order.status, note }),
      });
    } catch {}
    const historyEntry = { status: order.status, at: new Date().toISOString(), note };
    setOrders(prev => prev.map(o => o.id === id ? { ...o, notes: (o.notes ? o.notes + "\n" : "") + note, statusHistory: [...(o.statusHistory || []), historyEntry] } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, notes: (prev.notes ? prev.notes + "\n" : "") + note, statusHistory: [...(prev.statusHistory || []), historyEntry] } : prev);
  }, [orders]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleBulkStatus = useCallback((status: OrderStatus) => {
    selectedIds.forEach(id => handleStatus(id, status));
    setSelectedIds(new Set());
  }, [selectedIds, handleStatus]);

  const sellers = useMemo(() => [...new Set(orders.map(o => o.sellerName).filter(Boolean))], [orders]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{lang === "pt" ? "Todos os pedidos da plataforma" : "All orders across the platform"}</p>
      </div>

      <OrderStatsBar orders={orders} t={t} />

      {/* Seller filter */}
      {sellers.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500">{lang === "pt" ? "Vendedor:" : "Seller:"}</span>
          <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
            <option value="">{lang === "pt" ? "Todos" : "All"}</option>
            {sellers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      <OrderFilters
        filter={filter} setFilter={setFilter}
        search={search} setSearch={setSearch}
        dateRange={dateRange} setDateRange={setDateRange}
        viewMode={viewMode} setViewMode={setViewMode}
        orders={orders} onExport={() => {}} t={t}
        selectedCount={selectedIds.size} onBulkStatus={handleBulkStatus}
      />

      {viewMode === "list" ? (
        <OrderListView
          orders={filtered} onSelect={setSelectedOrder}
          onStatusChange={handleStatus} t={t}
          selectedIds={selectedIds} onToggleSelect={toggleSelect}
          showSeller
        />
      ) : (
        <OrderPipelineView orders={filtered} onSelect={setSelectedOrder} t={t} />
      )}

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder} onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatus} onAddNote={handleAddNote} t={t}
        />
      )}
    </div>
  );
}
