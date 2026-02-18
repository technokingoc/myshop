"use client";

import { Search, Download, List, LayoutGrid } from "lucide-react";
import type { OrderStatus, DateRange, OrderItem } from "./types";
import { ALL_STATUSES, statusColorMap } from "./types";

type Props = {
  filter: "all" | OrderStatus;
  setFilter: (f: "all" | OrderStatus) => void;
  search: string;
  setSearch: (s: string) => void;
  dateRange: DateRange;
  setDateRange: (d: DateRange) => void;
  viewMode: "list" | "pipeline";
  setViewMode: (m: "list" | "pipeline") => void;
  orders: OrderItem[];
  onExport: () => void;
  t: Record<string, string>;
  // bulk
  selectedCount?: number;
  onBulkStatus?: (status: OrderStatus) => void;
};

export function OrderFilters({
  filter, setFilter, search, setSearch,
  dateRange, setDateRange, viewMode, setViewMode,
  orders, onExport, t,
  selectedCount = 0, onBulkStatus,
}: Props) {
  const statusCounts: Record<string, number> = { all: orders.length };
  for (const s of ALL_STATUSES) statusCounts[s] = orders.filter((o) => o.status === s).length;

  const dateFilters: { key: DateRange; label: string }[] = [
    { key: "today", label: t.dateToday || "Today" },
    { key: "7d", label: t.date7d || "7d" },
    { key: "30d", label: t.date30d || "30d" },
    { key: "all", label: t.dateAll || "All" },
  ];

  const filterKeys: ("all" | OrderStatus)[] = ["all", ...ALL_STATUSES];

  return (
    <div className="space-y-3 mb-4">
      {/* Top row: search + view toggle + export */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full outline-none bg-transparent" />
        </label>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setViewMode("list")} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("pipeline")} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${viewMode === "pipeline" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
        <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Download className="h-3.5 w-3.5" />{t.exportCsv}
        </button>
      </div>

      {/* Status pills + date range */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {filterKeys.map((key) => {
          const active = filter === key;
          const count = statusCounts[key] || 0;
          const colors = key !== "all" ? statusColorMap[key] : null;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                active
                  ? colors ? `${colors.badge} ring-1 ring-current/20` : "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}>
              {t[`filter${key.charAt(0).toUpperCase() + key.slice(1)}`] || key}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/30" : "bg-slate-100"}`}>{count}</span>
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {dateFilters.map((d) => (
          <button key={d.key} onClick={() => setDateRange(d.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${dateRange === d.key ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:bg-slate-100"}`}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && onBulkStatus && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
          <span className="font-medium text-slate-700">{selectedCount} {t.selected || "selected"}</span>
          <select onChange={(e) => { if (e.target.value) onBulkStatus(e.target.value as OrderStatus); e.target.value = ""; }}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
            <option value="">{t.bulkChangeStatus || "Change status"}</option>
            {ALL_STATUSES.filter(s => s !== "cancelled").map(s => (
              <option key={s} value={s}>{t[s] || s}</option>
            ))}
            <option value="cancelled">{t.cancelled || "Cancelled"}</option>
          </select>
        </div>
      )}
    </div>
  );
}
