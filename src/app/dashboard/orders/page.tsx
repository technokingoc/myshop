"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getOrders, updateOrderStatus, type OrderIntent } from "@/lib/orders";
import { DashboardShell } from "@/components/dashboard-shell";
import { DbMigrationGuard } from "@/components/db-migration-guard";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { Inbox, CheckCircle, Phone, Clock, X, Search, Download } from "lucide-react";

type DbOrder = {
  id: number;
  customerName: string;
  customerContact: string;
  message: string;
  itemId: number | null;
  status: "new" | "contacted" | "completed";
  createdAt: string;
};

type DbHealth = { ok: boolean; connected: boolean; missingTables: string[]; errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY" };
type StatusNote = { text: string; createdAt: string };

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
    viewDetails: "View details",
    detailsTitle: "Order details",
    close: "Close",
    statusNotes: "Status notes",
    notePlaceholder: "Add a note (e.g. customer asked for delivery tomorrow)",
    saveNote: "Save note",
    noNotes: "No status notes yet.",
    search: "Search customer",
    from: "From",
    to: "To",
    exportCsv: "Export CSV",
    dbBanner: "Could not sync with database. Showing local orders.",
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
    viewDetails: "Ver detalhes",
    detailsTitle: "Detalhes do pedido",
    close: "Fechar",
    statusNotes: "Notas de estado",
    notePlaceholder: "Adicionar nota (ex.: cliente pediu entrega amanhã)",
    saveNote: "Guardar nota",
    noNotes: "Ainda não existem notas de estado.",
    search: "Pesquisar cliente",
    from: "De",
    to: "Até",
    exportCsv: "Exportar CSV",
    dbBanner: "Não foi possível sincronizar com a base de dados. A mostrar pedidos locais.",
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
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderIntent | null>(null);
  const [notesByOrder, setNotesByOrder] = useState<Record<string, StatusNote[]>>({});
  const [noteText, setNoteText] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const fetchOrders = async () => {
    const health = await fetch("/api/health/db").then((r) => r.json()).catch(() => null);
    setDbHealth(health);

    const raw = localStorage.getItem("myshop_seller_id");
    const id = raw ? Number(raw) : null;
    setSellerId(id);

    try {
      const storedNotes = localStorage.getItem("myshop_order_notes");
      if (storedNotes) setNotesByOrder(JSON.parse(storedNotes));
    } catch {}

    if (!id || (health && !health.ok)) {
      setOrders(getOrders());
      setHydrated(true);
      return;
    }

    try {
      const rows = await fetchJsonWithRetry<DbOrder[]>(`/api/orders?sellerId=${id}`);
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
      setBanner(null);
    } catch {
      setOrders(getOrders());
      setBanner(t.dbBanner);
    } finally {
      setHydrated(true);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const persistNotes = (next: Record<string, StatusNote[]>) => {
    setNotesByOrder(next);
    localStorage.setItem("myshop_order_notes", JSON.stringify(next));
  };

  const handleStatus = async (id: string, status: OrderIntent["status"]) => {
    if (sellerId && (!dbHealth || dbHealth.ok)) {
      try {
        await fetchJsonWithRetry("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(id), status }),
        });
        setBanner(null);
      } catch {
        setBanner(t.dbBanner);
      }
    }

    updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelectedOrder((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  const addNote = () => {
    if (!selectedOrder || !noteText.trim()) return;
    const next = {
      ...notesByOrder,
      [selectedOrder.id]: [
        { text: noteText.trim(), createdAt: new Date().toISOString() },
        ...(notesByOrder[selectedOrder.id] || []),
      ],
    };
    persistNotes(next);
    setNoteText("");
  };

  const exportCsv = () => {
    const header = ["id", "customerName", "customerContact", "status", "createdAt", "message"];
    const rows = filtered.map((o) => [o.id, o.customerName, o.customerContact, o.status, o.createdAt, (o.message || "").replaceAll('"', '""')]);
    const csv = [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v)}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <DbMigrationGuard health={dbHealth} onRetry={fetchOrders} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      {banner && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{banner}</div>}

      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full outline-none" /></label>
        <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{t.from}<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full outline-none" /></label>
        <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{t.to}<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full outline-none" /></label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filter === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>{f.label}</button>
        ))}
        <button onClick={exportCsv} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"><Download className="h-4 w-4" />{t.exportCsv}</button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><Inbox className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-500">{t.empty}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const StatusIcon = statusIcons[order.status];
            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{order.customerName}</p><p className="text-sm text-slate-600">{order.customerContact}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}><StatusIcon className="h-3 w-3" />{t[order.status]}</span></div>
                {order.itemName && <p className="mt-2 text-sm text-slate-700"><span className="font-medium">{t.item}:</span> {order.itemName}</p>}
                {order.message && <p className="mt-1 text-sm text-slate-600">{order.message}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</span><span className="flex-1" /><button onClick={() => setSelectedOrder(order)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">{t.viewDetails}</button>{order.status === "new" && <button onClick={() => handleStatus(order.id, "contacted")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">{t.markContacted}</button>}{(order.status === "new" || order.status === "contacted") && <button onClick={() => handleStatus(order.id, "completed")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">{t.markCompleted}</button>}</div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-900">{t.detailsTitle}</h2><button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
            <p className="font-semibold text-slate-900">{selectedOrder.customerName}</p><p className="text-sm text-slate-600">{selectedOrder.customerContact}</p><p className="mt-2 text-sm text-slate-600">{selectedOrder.message || "-"}</p><p className="mt-1 text-xs text-slate-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            <div className="mt-4 flex gap-2">{selectedOrder.status !== "contacted" && selectedOrder.status !== "completed" && <button onClick={() => handleStatus(selectedOrder.id, "contacted")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">{t.markContacted}</button>}{selectedOrder.status !== "completed" && <button onClick={() => handleStatus(selectedOrder.id, "completed")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">{t.markCompleted}</button>}</div>
            <div className="mt-6"><h3 className="text-sm font-semibold text-slate-900">{t.statusNotes}</h3><div className="mt-2 flex gap-2"><input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t.notePlaceholder} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={addNote} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{t.saveNote}</button></div><div className="mt-3 space-y-2">{(notesByOrder[selectedOrder.id] || []).length === 0 ? <p className="text-sm text-slate-500">{t.noNotes}</p> : (notesByOrder[selectedOrder.id] || []).map((note, idx) => (<div key={`${selectedOrder.id}-${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2"><p className="text-sm text-slate-700">{note.text}</p><p className="mt-1 text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</p></div>))}</div></div>
            <button onClick={() => setSelectedOrder(null)} className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">{t.close}</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
