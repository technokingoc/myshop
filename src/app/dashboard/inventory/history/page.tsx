"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import {
  ArrowLeft, History, TrendingUp, TrendingDown, Package, 
  RefreshCw, Calendar, User, Filter, Search, Download,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, ShoppingCart,
  Truck, AlertTriangle, Settings
} from "lucide-react";

type StockHistoryEntry = {
  id: number;
  changeType: 'adjustment' | 'sale' | 'restock' | 'return' | 'damage' | 'transfer' | 'initial';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  notes: string;
  orderId?: number;
  batchNumber?: string;
  expirationDate?: Date;
  costPrice?: number;
  createdBy?: number;
  createdAt: Date;
  createdByName?: string;
};

const dict = {
  en: {
    title: "Stock History",
    subtitle: "View all stock changes and adjustments over time",
    backToInventory: "Back to Inventory",
    allChanges: "All Changes",
    adjustments: "Adjustments",
    sales: "Sales",
    restocks: "Restocks",
    returns: "Returns",
    damage: "Damage",
    transfers: "Transfers",
    search: "Search by reason, notes, or batch number...",
    export: "Export",
    refresh: "Refresh",
    filterByType: "Filter by Type",
    filterByDate: "Filter by Date",
    noHistory: "No stock history found",
    noHistoryDesc: "Stock changes will appear here as they happen",
    loading: "Loading stock history...",
    error: "Error loading stock history",
    changeType: "Change Type",
    before: "Before",
    change: "Change",
    after: "After",
    reason: "Reason",
    date: "Date",
    user: "User",
    batchNumber: "Batch #",
    costPrice: "Cost Price",
    orderRef: "Order",
    notes: "Notes",
    increase: "Increase",
    decrease: "Decrease",
  },
  pt: {
    title: "Histórico de Stock",
    subtitle: "Ver todas as alterações e ajustes de stock ao longo do tempo",
    backToInventory: "Voltar ao Inventário",
    allChanges: "Todas as Alterações",
    adjustments: "Ajustes",
    sales: "Vendas",
    restocks: "Reposições",
    returns: "Devoluções",
    damage: "Danos",
    transfers: "Transferências",
    search: "Pesquisar por motivo, notas ou número de lote...",
    export: "Exportar",
    refresh: "Actualizar",
    filterByType: "Filtrar por Tipo",
    filterByDate: "Filtrar por Data",
    noHistory: "Nenhum histórico de stock encontrado",
    noHistoryDesc: "As alterações de stock aparecerão aqui conforme acontecem",
    loading: "A carregar histórico de stock...",
    error: "Erro ao carregar histórico de stock",
    changeType: "Tipo de Alteração",
    before: "Antes",
    change: "Alteração",
    after: "Depois",
    reason: "Motivo",
    date: "Data",
    user: "Utilizador",
    batchNumber: "Lote #",
    costPrice: "Preço de Custo",
    orderRef: "Pedido",
    notes: "Notas",
    increase: "Aumento",
    decrease: "Diminuição",
  },
};

function ChangeTypeIcon({ type, size = 4 }: { type: string; size?: number }) {
  const iconClass = `h-${size} w-${size}`;
  
  switch (type) {
    case 'sale':
      return <ShoppingCart className={iconClass} />;
    case 'restock':
      return <ArrowUpCircle className={iconClass} />;
    case 'return':
      return <RotateCcw className={iconClass} />;
    case 'damage':
      return <AlertTriangle className={iconClass} />;
    case 'transfer':
      return <Truck className={iconClass} />;
    case 'adjustment':
    default:
      return <Settings className={iconClass} />;
  }
}

function ChangeTypeBadge({ type, lang }: { type: string; lang: 'en' | 'pt' }) {
  const t = dict[lang];
  const typeLabels: Record<string, Record<string, string>> = {
    adjustment: { en: 'Adjustment', pt: 'Ajuste' },
    sale: { en: 'Sale', pt: 'Venda' },
    restock: { en: 'Restock', pt: 'Reposição' },
    return: { en: 'Return', pt: 'Devolução' },
    damage: { en: 'Damage', pt: 'Dano' },
    transfer: { en: 'Transfer', pt: 'Transferência' },
    initial: { en: 'Initial', pt: 'Inicial' },
  };

  const label = typeLabels[type]?.[lang] || type;
  
  const colorClasses: Record<string, string> = {
    adjustment: 'bg-slate-100 text-slate-700',
    sale: 'bg-green-100 text-green-700',
    restock: 'bg-green-100 text-green-700',
    return: 'bg-purple-100 text-purple-700',
    damage: 'bg-red-100 text-red-700',
    transfer: 'bg-amber-100 text-amber-700',
    initial: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClasses[type] || colorClasses.adjustment}`}>
      <ChangeTypeIcon type={type} size={3} />
      {label}
    </span>
  );
}

export default function StockHistoryPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();

  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonWithRetry<StockHistoryEntry[]>(
        "/api/inventory/stock-history",
        undefined,
        2,
        "inventory:stock-history"
      );
      setHistory(data);
    } catch (error) {
      console.error("Error loading stock history:", error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter and search history
  const filteredHistory = history.filter((entry) => {
    // Type filter
    if (typeFilter !== "all" && entry.changeType !== typeFilter) {
      return false;
    }

    // Date filter (simple - could be enhanced)
    if (dateFilter) {
      const entryDate = new Date(entry.createdAt).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      if (entryDate !== filterDate) {
        return false;
      }
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      return (
        entry.reason.toLowerCase().includes(searchLower) ||
        entry.notes.toLowerCase().includes(searchLower) ||
        (entry.batchNumber && entry.batchNumber.toLowerCase().includes(searchLower)) ||
        (entry.createdByName && entry.createdByName.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const changeTypeCounts = {
    all: history.length,
    adjustment: history.filter(h => h.changeType === 'adjustment').length,
    sale: history.filter(h => h.changeType === 'sale').length,
    restock: history.filter(h => h.changeType === 'restock').length,
    return: history.filter(h => h.changeType === 'return').length,
    damage: history.filter(h => h.changeType === 'damage').length,
    transfer: history.filter(h => h.changeType === 'transfer').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToInventory}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {t.export}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto mt-4">
          {[
            ['all', t.allChanges, changeTypeCounts.all],
            ['adjustment', t.adjustments, changeTypeCounts.adjustment],
            ['sale', t.sales, changeTypeCounts.sale],
            ['restock', t.restocks, changeTypeCounts.restock],
            ['return', t.returns, changeTypeCounts.return],
            ['damage', t.damage, changeTypeCounts.damage],
            ['transfer', t.transfers, changeTypeCounts.transfer],
          ].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(String(key))}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                typeFilter === key
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.noHistory}</h3>
            <p className="mt-2 text-sm text-slate-500">{t.noHistoryDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.changeType}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.before}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.change}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.after}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.reason}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.date}</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-900">{t.user}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <ChangeTypeBadge type={entry.changeType} lang={lang} />
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {entry.quantityBefore}
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-1 text-sm font-medium ${
                        entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.quantityChange > 0 ? (
                          <ArrowUpCircle className="h-4 w-4" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4" />
                        )}
                        {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                      {entry.quantityAfter}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-900">
                        {entry.reason || '-'}
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-slate-500 mt-1">
                          {entry.notes}
                        </div>
                      )}
                      {entry.orderId && (
                        <div className="text-xs text-green-600 mt-1">
                          Order #{entry.orderId}
                        </div>
                      )}
                      {entry.batchNumber && (
                        <div className="text-xs text-slate-500 mt-1">
                          {t.batchNumber}: {entry.batchNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString(lang === 'pt' ? 'pt-MZ' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {entry.createdByName || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}