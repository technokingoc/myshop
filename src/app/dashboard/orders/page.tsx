"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getOrders, updateOrderStatus, type OrderIntent } from "@/lib/orders";
import { DbMigrationGuard } from "@/components/db-migration-guard";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { Inbox, CheckCircle, Phone, Clock, X, Search, Download, Truck, Package, Ban, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";

type OrderStatus = "new" | "contacted" | "processing" | "shipped" | "completed" | "cancelled";

type DbOrder = {
  id: number;
  customerName: string;
  customerContact: string;
  message: string;
  itemId: number | null;
  itemName: string | null;
  itemType: string | null;
  itemPrice: string | null;
  status: OrderStatus;
  notes: string | null;
  statusHistory: Array<{ status: string; at: string; note?: string }> | null;
  createdAt: string;
};

type DbHealth = { ok: boolean; connected: boolean; missingTables: string[]; errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY" };
type PaymentState = "pending" | "paid" | "failed" | "manual";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  processing: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusIcons: Record<string, typeof Clock> = {
  new: Clock,
  contacted: Phone,
  processing: Package,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: Ban,
};

const STATUS_FLOW: OrderStatus[] = ["new", "contacted", "processing", "shipped", "completed"];

type ExtendedOrder = OrderIntent & {
  notes?: string;
  statusHistory?: Array<{ status: string; at: string; note?: string }>;
};

export default function OrdersPage() {
  const { lang } = useLanguage();
  const t = getDict(lang).orders;
  const common = getDict(lang).common;
  const toastText = getDict(lang).toast;
  const toast = useToast();

  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [noteText, setNoteText] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentState>("pending");
  const [paymentLink, setPaymentLink] = useState("");

  const fetchOrders = async () => {
    const health = await fetch("/api/health/db").then((r) => r.json()).catch(() => null);
    setDbHealth(health);

    const raw = localStorage.getItem("myshop_seller_id");
    const id = raw ? Number(raw) : null;
    setSellerId(id);

    if (!id || (health && !health.ok)) {
      setOrders(getOrders());
      setHydrated(true);
      return;
    }

    try {
      const rows = await fetchJsonWithRetry<DbOrder[]>(`/api/orders?sellerId=${id}`, undefined, 3, "orders:list");
      setOrders(
        rows.map((o) => ({
          id: String(o.id),
          customerName: o.customerName,
          customerContact: o.customerContact,
          message: o.message || "",
          itemId: o.itemId,
          itemName: o.itemName || "",
          itemType: o.itemType || "",
          itemPrice: o.itemPrice || "",
          storeName: "",
          status: o.status as OrderIntent["status"],
          notes: o.notes || "",
          statusHistory: o.statusHistory || [],
          createdAt: o.createdAt,
        })),
      );
    } catch {
      setOrders(getOrders());
      toast.info(t.dbBanner);
    } finally {
      setHydrated(true);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) && !o.customerContact.toLowerCase().includes(q)) return false;
      }
      const d = new Date(o.createdAt);
      if (fromDate && d < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && d > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [orders, filter, search, fromDate, toDate]);

  const handleStatus = async (id: string, status: OrderStatus, note?: string) => {
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry(`/api/orders/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        }, 3, "orders:update-status");
      } catch {
        // fallback to old endpoint
        try {
          await fetchJsonWithRetry("/api/orders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: Number(id), status }),
          }, 3, "orders:update-status-fallback");
        } catch {
          toast.info(toastText.syncFailed);
        }
      }
    }

    updateOrderStatus(id, status as OrderIntent["status"]);
    const historyEntry = { status, at: new Date().toISOString(), note };
    setOrders((prev) => prev.map((o) => o.id === id ? {
      ...o,
      status: status as OrderIntent["status"],
      statusHistory: [...(o.statusHistory || []), historyEntry],
    } : o));
    setSelectedOrder((prev) => prev?.id === id ? {
      ...prev,
      status: status as OrderIntent["status"],
      statusHistory: [...(prev.statusHistory || []), historyEntry],
    } : prev);
    toast.success(toastText.statusUpdated);
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !noteText.trim()) return;
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry(`/api/orders/${selectedOrder.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedOrder.status, note: noteText.trim() }),
        }, 3, "orders:add-note");
      } catch {}
    }
    const historyEntry = { status: selectedOrder.status, at: new Date().toISOString(), note: noteText.trim() };
    setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? {
      ...o,
      notes: (o.notes ? o.notes + "\n" : "") + noteText.trim(),
      statusHistory: [...(o.statusHistory || []), historyEntry],
    } : o));
    setSelectedOrder((prev) => prev ? {
      ...prev,
      notes: (prev.notes ? prev.notes + "\n" : "") + noteText.trim(),
      statusHistory: [...(prev.statusHistory || []), historyEntry],
    } : prev);
    setNoteText("");
    toast.success(toastText.noteSaved);
  };

  useEffect(() => {
    if (!selectedOrder?.id) return;
    fetch(`/api/payments/status?orderId=${selectedOrder.id}`)
      .then((r) => (r.ok ? r.json() : { status: "pending" }))
      .then((p) => {
        setPaymentStatus((p?.status || "pending") as PaymentState);
        setPaymentLink(p?.externalUrl || "");
      })
      .catch(() => { setPaymentStatus("pending"); setPaymentLink(""); });
  }, [selectedOrder?.id]);

  const updatePayment = async (status: PaymentState) => {
    if (!selectedOrder || !sellerId) return;
    await fetch("/api/payments/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: Number(selectedOrder.id), sellerId, status, externalUrl: paymentLink || undefined }),
    }).catch(() => null);
    setPaymentStatus(status);
  };

  const exportCsv = () => {
    if (!sellerId) return;
    const params = new URLSearchParams({ sellerId: String(sellerId) });
    if (filter !== "all") params.set("status", filter);
    if (search.trim()) params.set("q", search.trim());
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    try { window.open(`/api/orders/export.csv?${params.toString()}`, "_blank", "noopener,noreferrer"); } catch { toast.error(common.exportFailed); }
  };

  const getContactLinks = (contact: string) => {
    const isEmail = contact.includes("@");
    const isPhone = /[\d+]/.test(contact) && !isEmail;
    return { isEmail, isPhone };
  };

  if (!hydrated) return null;

  const allFilters: { key: typeof filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "new", label: t.filterNew },
    { key: "contacted", label: t.filterContacted },
    { key: "processing", label: (t as Record<string, string>).filterProcessing || "Processing" },
    { key: "shipped", label: (t as Record<string, string>).filterShipped || "Shipped" },
    { key: "completed", label: t.filterCompleted },
    { key: "cancelled", label: (t as Record<string, string>).filterCancelled || "Cancelled" },
  ];

  return (
    <>
      <DbMigrationGuard health={dbHealth} onRetry={fetchOrders} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full outline-none" /></label>
        <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{t.from}<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full outline-none" /></label>
        <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{t.to}<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full outline-none" /></label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {allFilters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filter === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>{f.label}</button>
        ))}
        <button onClick={exportCsv} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"><Download className="h-4 w-4" />{t.exportCsv}</button>
      </div>

      {filtered.length === 0 ? (
        <section className="shell-empty rounded-2xl border border-slate-200 bg-white">
          <div className="shell-empty-card">
            <Inbox className="shell-empty-icon" />
            <h2 className="shell-empty-title">{t.empty}</h2>
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const StatusIcon = statusIcons[order.status] || Clock;
            const statusKey = order.status as string;
            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.customerName}</p>
                    <p className="text-sm text-slate-600">{order.customerContact}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[statusKey] || statusColors.new}`}>
                    <StatusIcon className="h-3 w-3" />
                    {(t as Record<string, string>)[statusKey] || statusKey}
                  </span>
                </div>
                {order.itemName && <p className="mt-2 text-sm text-slate-700"><span className="font-medium">{t.item}:</span> {order.itemName} {order.itemType ? `• ${order.itemType}` : ""} {order.itemPrice ? `• ${t.price}: ${order.itemPrice}` : ""}</p>}
                {order.message && <p className="mt-1 text-sm text-slate-600">{order.message}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</span>
                  <span className="flex-1" />
                  <button onClick={() => setSelectedOrder(order)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">{t.viewDetails}</button>
                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) handleStatus(order.id, e.target.value as OrderStatus); }}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white"
                    >
                      <option value="">{(t as Record<string, string>).changeStatus || "Change status"}</option>
                      {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                        <option key={s} value={s}>{(t as Record<string, string>)[s] || s}</option>
                      ))}
                      <option value="cancelled">{(t as Record<string, string>).cancelled || "Cancelled"}</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order detail panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="ml-auto h-full w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{t.detailsTitle}</h2>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            {/* Customer info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
              <p className="font-semibold text-slate-900">{selectedOrder.customerName}</p>
              <p className="text-sm text-slate-600">{selectedOrder.customerContact}</p>
              {selectedOrder.message && <p className="mt-2 text-sm text-slate-600">{selectedOrder.message}</p>}
              <p className="mt-1 text-xs text-slate-400">ORD-{selectedOrder.id} • {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>

            {/* Item details */}
            {selectedOrder.itemName && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
                <p className="text-sm"><span className="font-medium">{t.item}:</span> {selectedOrder.itemName}</p>
                {selectedOrder.itemType && <p className="text-sm"><span className="font-medium">{t.type}:</span> {selectedOrder.itemType}</p>}
                {selectedOrder.itemPrice && <p className="text-sm"><span className="font-medium">{t.price}:</span> {selectedOrder.itemPrice}</p>}
              </div>
            )}

            {/* Status + change */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[selectedOrder.status] || statusColors.new}`}>
                  {(t as Record<string, string>)[selectedOrder.status] || selectedOrder.status}
                </span>
                {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) handleStatus(selectedOrder.id, e.target.value as OrderStatus); }}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white"
                  >
                    <option value="">{(t as Record<string, string>).changeStatus || "Change status"}</option>
                    {STATUS_FLOW.filter((s) => s !== selectedOrder.status).map((s) => (
                      <option key={s} value={s}>{(t as Record<string, string>)[s] || s}</option>
                    ))}
                    <option value="cancelled">{(t as Record<string, string>).cancelled || "Cancelled"}</option>
                  </select>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex gap-2 mb-4">
              {(() => {
                const { isEmail, isPhone } = getContactLinks(selectedOrder.customerContact);
                return (
                  <>
                    {isPhone && (
                      <a href={`https://wa.me/${selectedOrder.customerContact.replace(/[^\d+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    {isEmail && (
                      <a href={`mailto:${selectedOrder.customerContact}`} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Status timeline */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{(t as Record<string, string>).statusTimeline || "Status timeline"}</h3>
                <div className="space-y-0">
                  {selectedOrder.statusHistory.map((entry, idx) => {
                    const EntryIcon = statusIcons[entry.status] || Clock;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors[entry.status] || "bg-slate-100 text-slate-500"}`}>
                            <EntryIcon className="h-3 w-3" />
                          </div>
                          {idx < selectedOrder.statusHistory!.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-slate-700">{(t as Record<string, string>)[entry.status] || entry.status}</p>
                          {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
                          <p className="text-xs text-slate-400">{new Date(entry.at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{lang === "pt" ? "Estado de pagamento" : "Payment status"}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["pending", "paid", "failed", "manual"] as PaymentState[]).map((s) => (
                  <button key={s} onClick={() => updatePayment(s)} className={`rounded-full border px-2.5 py-1 text-xs ${paymentStatus === s ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700"}`}>{s}</button>
                ))}
              </div>
              <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} placeholder={lang === "pt" ? "Link externo de pagamento (opcional)" : "External payment link (optional)"} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" />
            </div>

            {/* Internal notes */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{(t as Record<string, string>).internalNotes || "Internal notes"}</h3>
              {selectedOrder.notes && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t.notePlaceholder} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <button onClick={handleAddNote} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{(t as Record<string, string>).addNote || "Add note"}</button>
              </div>
            </div>

            <button onClick={() => setSelectedOrder(null)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t.close}</button>
          </div>
        </div>
      )}
    </>
  );
}
