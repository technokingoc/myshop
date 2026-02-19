"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Package,
  User,
  Calendar,
  FileText,
  Minus,
  Plus,
  RotateCcw,
  Truck,
  AlertTriangle,
  Settings,
} from "lucide-react";

type StockHistoryEntry = {
  id: number;
  changeType: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  notes: string;
  createdAt: string;
  createdByName?: string;
  productName?: string;
  variantName?: string;
  orderId?: number;
};

const dict = {
  en: {
    title: "Stock History",
    description: "View all stock changes and adjustments",
    searchPlaceholder: "Search by product, reason, or user...",
    allTypes: "All Types",
    adjustment: "Adjustment",
    sale: "Sale",
    restock: "Restock",
    return: "Return",
    damage: "Damage",
    transfer: "Transfer",
    initial: "Initial",
    dateRange: "Date Range",
    export: "Export History",
    product: "Product",
    type: "Type",
    change: "Change",
    before: "Before",
    after: "After",
    reason: "Reason",
    user: "User",
    date: "Date",
    notes: "Notes",
    orderId: "Order ID",
    noHistoryFound: "No stock history found",
    loadingHistory: "Loading stock history...",
    showMore: "Show More",
    showLess: "Show Less",
    variant: "Variant",
    items: "items",
    quantityIncrease: "Quantity Increase",
    quantityDecrease: "Quantity Decrease",
    noChange: "No Change",
    systemAdjustment: "System Adjustment",
    unknownUser: "Unknown User",
  },
  pt: {
    title: "Histórico de Estoque",
    description: "Visualizar todas as mudanças e ajustes de estoque",
    searchPlaceholder: "Pesquisar por produto, motivo ou usuário...",
    allTypes: "Todos os Tipos",
    adjustment: "Ajuste",
    sale: "Venda",
    restock: "Reposição",
    return: "Devolução",
    damage: "Dano",
    transfer: "Transferência",
    initial: "Inicial",
    dateRange: "Período",
    export: "Exportar Histórico",
    product: "Produto",
    type: "Tipo",
    change: "Mudança",
    before: "Antes",
    after: "Depois",
    reason: "Motivo",
    user: "Usuário",
    date: "Data",
    notes: "Notas",
    orderId: "ID do Pedido",
    noHistoryFound: "Nenhum histórico de estoque encontrado",
    loadingHistory: "Carregando histórico de estoque...",
    showMore: "Mostrar Mais",
    showLess: "Mostrar Menos",
    variant: "Variante",
    items: "itens",
    quantityIncrease: "Aumento de Quantidade",
    quantityDecrease: "Diminuição de Quantidade",
    noChange: "Sem Mudança",
    systemAdjustment: "Ajuste do Sistema",
    unknownUser: "Usuário Desconhecido",
  },
};

export function StockHistory() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (offset = 0) => {
    try {
      setLoading(offset === 0);
      setLoadingMore(offset > 0);
      
      const params = new URLSearchParams({
        limit: "50",
        offset: offset.toString(),
      });
      
      const response = await fetch(`/api/inventory/stock-history?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (offset === 0) {
          setHistory(data);
        } else {
          setHistory(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === 50);
      }
    } catch (error) {
      console.error('Failed to load stock history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    loadHistory(history.length);
  };

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sale':
        return TrendingDown;
      case 'restock':
        return TrendingUp;
      case 'return':
        return RotateCcw;
      case 'transfer':
        return Truck;
      case 'damage':
        return AlertTriangle;
      case 'adjustment':
        return Settings;
      default:
        return Package;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sale':
        return 'text-red-600 bg-red-50';
      case 'restock':
        return 'text-green-600 bg-green-50';
      case 'return':
        return 'text-blue-600 bg-blue-50';
      case 'transfer':
        return 'text-purple-600 bg-purple-50';
      case 'damage':
        return 'text-orange-600 bg-orange-50';
      case 'adjustment':
        return 'text-slate-600 bg-slate-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Product', 'Type', 'Before', 'Change', 'After', 'Reason', 'User', 'Notes'].join(','),
      ...history.map(entry => [
        entry.createdAt,
        `"${entry.productName || 'Unknown'}${entry.variantName ? ' - ' + entry.variantName : ''}"`,
        entry.changeType,
        entry.quantityBefore,
        entry.quantityChange,
        entry.quantityAfter,
        `"${entry.reason}"`,
        `"${entry.createdByName || t.unknownUser}"`,
        `"${entry.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter history based on search and type
  const filteredHistory = history.filter(entry => {
    const matchesSearch = !searchTerm || 
      (entry.productName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.variantName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.createdByName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || entry.changeType.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
              <p className="text-slate-600 text-sm">{t.description}</p>
            </div>
            <button
              onClick={exportHistory}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {t.export}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">{t.allTypes}</option>
              <option value="adjustment">{t.adjustment}</option>
              <option value="sale">{t.sale}</option>
              <option value="restock">{t.restock}</option>
              <option value="return">{t.return}</option>
              <option value="damage">{t.damage}</option>
              <option value="transfer">{t.transfer}</option>
              <option value="initial">{t.initial}</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="p-12 text-center">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-500">{t.loadingHistory}</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{t.noHistoryFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.type}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.change}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.reason}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.user}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.date}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredHistory.map((entry) => {
                  const Icon = getChangeTypeIcon(entry.changeType);
                  const isExpanded = expandedRows.has(entry.id);
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {entry.productName || 'Unknown Product'}
                          </p>
                          {entry.variantName && (
                            <p className="text-sm text-slate-500">{entry.variantName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getChangeTypeColor(entry.changeType)}`}>
                          <Icon className="h-3 w-3" />
                          {entry.changeType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-slate-600">
                            {entry.quantityBefore}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.quantityChange > 0 ? (
                              <Plus className="h-3 w-3 text-green-600" />
                            ) : entry.quantityChange < 0 ? (
                              <Minus className="h-3 w-3 text-red-600" />
                            ) : null}
                            <span className={`font-mono text-sm font-medium ${
                              entry.quantityChange > 0 ? 'text-green-600' : 
                              entry.quantityChange < 0 ? 'text-red-600' : 'text-slate-500'
                            }`}>
                              {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                            </span>
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {entry.quantityAfter}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900 max-w-xs truncate">
                          {entry.reason || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {entry.createdByName || t.unknownUser}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(entry.notes || entry.orderId) && (
                          <button
                            onClick={() => toggleRowExpansion(entry.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            {isExpanded ? t.showLess : t.showMore}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expanded row details */}
            {filteredHistory.map((entry) => {
              const isExpanded = expandedRows.has(entry.id);
              
              if (!isExpanded || (!entry.notes && !entry.orderId)) {
                return null;
              }

              return (
                <div key={`${entry.id}-expanded`} className="border-b border-slate-200 bg-slate-50">
                  <div className="px-6 py-4 space-y-3">
                    {entry.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">{t.notes}:</h4>
                        <p className="text-sm text-slate-600 bg-white rounded-lg p-3 border">
                          {entry.notes}
                        </p>
                      </div>
                    )}
                    {entry.orderId && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">{t.orderId}:</h4>
                        <span className="inline-flex items-center gap-1 font-mono text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                          #{entry.orderId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredHistory.length > 0 && (
          <div className="p-6 border-t border-slate-200 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : `Load More ${t.items}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}