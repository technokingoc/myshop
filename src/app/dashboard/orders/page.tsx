"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { getOrders, updateOrderStatus, type OrderIntent } from "@/lib/orders";
import { DbMigrationGuard } from "@/components/db-migration-guard";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";

import type { OrderItem, OrderStatus, DateRange } from "@/components/orders/types";
import { OrderStatsBar } from "@/components/orders/order-stats-bar";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderListView } from "@/components/orders/order-list-view";
import { OrderPipelineView } from "@/components/orders/order-pipeline-view";
import { OrderDetailPanelEnhanced } from "@/components/orders/order-detail-panel-enhanced";

type DbOrder = {
  id: number; customerName: string; customerContact: string; message: string;
  itemId: number | null; itemName: string | null; itemType: string | null; itemPrice: string | null;
  status: OrderStatus; notes: string | null;
  statusHistory: Array<{ status: string; at: string; note?: string }> | null;
  createdAt: string;
};

type DbHealth = { ok: boolean; connected: boolean; missingTables: string[]; errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY" };

function toOrderItem(o: DbOrder | OrderIntent, extra?: Partial<OrderItem>): OrderItem {
  return {
    id: String(o.id || ""),
    customerName: (o as DbOrder).customerName ?? (o as OrderIntent).customerName ?? "",
    customerContact: (o as DbOrder).customerContact ?? (o as OrderIntent).customerContact ?? "",
    message: (o as DbOrder).message ?? (o as OrderIntent).message ?? "",
    itemId: (o as DbOrder).itemId ?? (o as OrderIntent).itemId ?? null,
    itemName: (o as DbOrder).itemName ?? (o as OrderIntent).itemName ?? "",
    itemType: (o as DbOrder).itemType ?? (o as OrderIntent).itemType ?? "",
    itemPrice: (o as DbOrder).itemPrice ?? (o as OrderIntent).itemPrice ?? "",
    storeName: (o as OrderIntent).storeName ?? "",
    status: o.status as OrderStatus,
    notes: (o as DbOrder).notes ?? "",
    statusHistory: (o as DbOrder).statusHistory ?? [],
    createdAt: (o as DbOrder).createdAt ?? (o as OrderIntent).createdAt ?? "",
    ...extra,
  };
}

export default function OrdersPage() {
  const { lang } = useLanguage();
  const t = getDict(lang).orders as unknown as Record<string, string>;
  const common = getDict(lang).common;
  const toastText = getDict(lang).toast;
  const toast = useToast();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [hydrated, setHydrated] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    const health = await fetch("/api/health/db").then(r => r.json()).catch(() => null);
    setDbHealth(health);
    const raw = localStorage.getItem("myshop_seller_id");
    const id = raw ? Number(raw) : null;
    setSellerId(id);

    if (!id || (health && !health.ok)) {
      setOrders(getOrders().map(o => toOrderItem(o as unknown as DbOrder)));
      setHydrated(true);
      return;
    }

    try {
      const rows = await fetchJsonWithRetry<DbOrder[]>(`/api/orders?sellerId=${id}`, undefined, 3, "orders:list");
      setOrders(rows.map(o => toOrderItem(o)));
    } catch {
      setOrders(getOrders().map(o => toOrderItem(o as unknown as DbOrder)));
      toast.info(t.dbBanner);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) && !o.customerContact.toLowerCase().includes(q) && !o.id.includes(q)) return false;
      }
      if (dateRange !== "all") {
        const d = new Date(o.createdAt);
        const diff = (now.getTime() - d.getTime()) / 86400000;
        if (dateRange === "today" && diff > 1) return false;
        if (dateRange === "7d" && diff > 7) return false;
        if (dateRange === "30d" && diff > 30) return false;
      }
      return true;
    });
  }, [orders, filter, search, dateRange]);

  const handleStatus = useCallback(async (id: string, status: OrderStatus, note?: string) => {
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry(`/api/orders/${id}/status`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        }, 3, "orders:update-status");
      } catch {
        try {
          await fetchJsonWithRetry("/api/orders", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: Number(id), status }),
          }, 3, "orders:update-status-fallback");
        } catch { toast.info(toastText.syncFailed); }
      }
    }
    updateOrderStatus(id, status as OrderIntent["status"]);
    const historyEntry = { status, at: new Date().toISOString(), note };
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, statusHistory: [...(o.statusHistory || []), historyEntry] } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status, statusHistory: [...(prev.statusHistory || []), historyEntry] } : prev);
    toast.success(toastText.statusUpdated);
  }, [sellerId, dbHealth, toast, toastText]);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry(`/api/orders/${id}/status`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: order.status, note }),
        }, 3, "orders:add-note");
      } catch {}
    }
    const historyEntry = { status: order.status, at: new Date().toISOString(), note };
    setOrders(prev => prev.map(o => o.id === id ? { ...o, notes: (o.notes ? o.notes + "\n" : "") + note, statusHistory: [...(o.statusHistory || []), historyEntry] } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, notes: (prev.notes ? prev.notes + "\n" : "") + note, statusHistory: [...(prev.statusHistory || []), historyEntry] } : prev);
    toast.success(toastText.noteSaved);
  }, [orders, sellerId, dbHealth, toast, toastText]);

  const handleCancelRefund = useCallback(async (id: string, action: "cancel" | "refund", reason: string, refundAmount?: number) => {
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry(`/api/orders/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "cancel" ? "cancelled" : "completed",
            note: `${action === "cancel" ? "Cancelled" : "Refunded"}: ${reason}`,
            cancelReason: action === "cancel" ? reason : undefined,
            refundReason: action === "refund" ? reason : undefined,
            refundAmount: refundAmount,
          }),
        }, 3, "orders:cancel-refund");
        
        const newStatus = action === "cancel" ? "cancelled" : "completed";
        const historyEntry = { 
          status: newStatus, 
          at: new Date().toISOString(), 
          note: `${action === "cancel" ? "Cancelled" : "Refunded"}: ${reason}` 
        };
        
        setOrders(prev => prev.map(o => o.id === id ? { 
          ...o, 
          status: newStatus as OrderStatus,
          statusHistory: [...(o.statusHistory || []), historyEntry] 
        } : o));
        
        setSelectedOrder(prev => prev?.id === id ? { 
          ...prev, 
          status: newStatus as OrderStatus, 
          statusHistory: [...(prev.statusHistory || []), historyEntry] 
        } : prev);
        
        toast.success(action === "cancel" ? "Order cancelled" : "Refund processed");
      } catch {
        toast.error("Failed to update order");
      }
    }
  }, [sellerId, dbHealth, toast, toastText]);

  const handleRefund = useCallback(async (orderId: string, amount: string, reason: string, note: string) => {
    if (!sellerId || !dbHealth?.ok) return;
    
    try {
      await fetchJsonWithRetry(`/api/orders/${orderId}/refund`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "refund", amount, reason, note }),
      }, 3, "orders:refund");
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, status: "cancelled" as OrderStatus, refundStatus: "completed", refundAmount: amount }
          : o
      ));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: "cancelled" as OrderStatus } : prev);
      toast.success(toastText.refundProcessed || "Refund processed successfully");
    } catch (error) {
      console.error("Refund error:", error);
      toast.error(toastText.refundFailed || "Failed to process refund");
    }
  }, [sellerId, dbHealth, toast, toastText]);

  const handleUpdateShipping = useCallback(async (orderId: string, data: {
    trackingNumber?: string;
    trackingProvider?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    status?: string;
  }) => {
    if (!sellerId || !dbHealth?.ok) return;

    try {
      await fetchJsonWithRetry(`/api/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, ...data }),
      }, 3, 'orders:update-shipping');

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              ...data,
              status: (data.status as OrderStatus) || o.status,
            }
          : o
      ));
      
      setSelectedOrder(prev => prev?.id === orderId ? {
        ...prev,
        ...data,
        status: (data.status as OrderStatus) || prev.status,
      } : prev);

      toast.success(toastText.updated || 'Tracking information updated');
    } catch (error) {
      console.error('Shipping update error:', error);
      toast.error((toastText as any).updateFailed || 'Failed to update tracking information');
    }
  }, [sellerId, dbHealth, toast, toastText]);

  const handleCancelOrder = useCallback(async (orderId: string, reason: string) => {
    if (!sellerId || !dbHealth?.ok) return;
    
    try {
      await fetchJsonWithRetry(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cancel", reason, note: reason }),
      }, 3, "orders:cancel");
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" as OrderStatus } : o));
      setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: "cancelled" as OrderStatus } : prev);
      toast.success(toastText.orderCancelled || "Order cancelled successfully");
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(toastText.cancelFailed || "Failed to cancel order");
    }
  }, [sellerId, dbHealth, toast, toastText]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkStatus = useCallback((status: OrderStatus) => {
    selectedIds.forEach(id => handleStatus(id, status));
    setSelectedIds(new Set());
  }, [selectedIds, handleStatus]);

  const exportCsv = () => {
    if (!sellerId) return;
    const params = new URLSearchParams({ sellerId: String(sellerId) });
    if (filter !== "all") params.set("status", filter);
    if (search.trim()) params.set("q", search.trim());
    try { window.open(`/api/orders/export.csv?${params.toString()}`, "_blank", "noopener,noreferrer"); } catch { toast.error(common.exportFailed); }
  };

  if (!hydrated) return null;

  return (
    <>
      <DbMigrationGuard health={dbHealth} onRetry={fetchOrders} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <OrderStatsBar orders={orders} t={t} />

      <OrderFilters
        filter={filter} setFilter={setFilter}
        search={search} setSearch={setSearch}
        dateRange={dateRange} setDateRange={setDateRange}
        viewMode={viewMode} setViewMode={setViewMode}
        orders={orders} onExport={exportCsv} t={t}
        selectedCount={selectedIds.size}
        onBulkStatus={handleBulkStatus}
      />

      {viewMode === "list" ? (
        <OrderListView
          orders={filtered} onSelect={setSelectedOrder}
          onStatusChange={handleStatus} t={t}
          selectedIds={selectedIds} onToggleSelect={toggleSelect}
        />
      ) : (
        <OrderPipelineView orders={filtered} onSelect={setSelectedOrder} t={t} />
      )}

      {selectedOrder && (
        <OrderDetailPanelEnhanced
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatus} 
          onAddNote={handleAddNote}
          onCancelRefund={handleCancelRefund}
          onUpdateShipping={handleUpdateShipping}
          t={t} 
          sellerId={sellerId}
          sellerInfo={{
            name: "MyShop Store",
            logoUrl: "",
            address: "",
            phone: "",
            email: "",
          }}
        />
      )}
    </>
  );
}
