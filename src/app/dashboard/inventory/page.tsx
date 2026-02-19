"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import {
  Package, TrendingDown, AlertTriangle, Clock, Plus, 
  History, Settings, RefreshCw, ArrowUpCircle, ArrowDownCircle,
  PackageCheck, PackageX, Eye, AlertCircle, ChevronRight
} from "lucide-react";

type LowStockProduct = {
  id: number;
  name: string;
  type: 'product' | 'variant';
  currentStock: number;
  threshold: number;
  variantName?: string;
  hasReminder: boolean;
};

type StockAdjustment = {
  productId?: number;
  variantId?: number;
  quantityChange: number;
  changeType: string;
  reason: string;
  notes: string;
};

const dict = {
  en: {
    title: "Inventory Management",
    subtitle: "Track stock levels, manage reminders, and view history",
    lowStock: "Low Stock Products",
    outOfStock: "Out of Stock",
    totalProducts: "Total Products",
    averageStock: "Average Stock",
    stockAdjustments: "Stock Adjustments",
    restockReminders: "Restock Reminders",
    stockHistory: "Stock History",
    quickActions: "Quick Actions",
    viewAll: "View All",
    addAdjustment: "Add Adjustment",
    createReminder: "Create Reminder",
    noLowStock: "No products are running low on stock",
    noLowStockDesc: "All your products have adequate stock levels",
    items: "items",
    item: "item",
    variant: "variant",
    loading: "Loading...",
    error: "Error loading data",
    urgent: "Urgent",
    attention: "Needs Attention",
    hasReminder: "Has reminder",
    noReminder: "No reminder set",
    createReminderAction: "Create reminder",
    viewProduct: "View product",
    recentAdjustments: "Recent Adjustments",
    activeReminders: "Active Reminders",
    nextRestock: "Next suggested restock",
    adjustStock: "Adjust Stock",
    manageReminders: "Manage Reminders",
  },
  pt: {
    title: "Gestão de Inventário",
    subtitle: "Acompanhar níveis de stock, gerir lembretes e ver histórico",
    lowStock: "Produtos com Stock Baixo",
    outOfStock: "Sem Stock",
    totalProducts: "Total de Produtos",
    averageStock: "Stock Médio",
    stockAdjustments: "Ajustes de Stock",
    restockReminders: "Lembretes de Reposição",
    stockHistory: "Histórico de Stock",
    quickActions: "Ações Rápidas",
    viewAll: "Ver Tudo",
    addAdjustment: "Adicionar Ajuste",
    createReminder: "Criar Lembrete",
    noLowStock: "Nenhum produto está com stock baixo",
    noLowStockDesc: "Todos os seus produtos têm níveis adequados de stock",
    items: "itens",
    item: "item",
    variant: "variante",
    loading: "A carregar...",
    error: "Erro ao carregar dados",
    urgent: "Urgente",
    attention: "Precisa de Atenção",
    hasReminder: "Tem lembrete",
    noReminder: "Sem lembrete",
    createReminderAction: "Criar lembrete",
    viewProduct: "Ver produto",
    recentAdjustments: "Ajustes Recentes",
    activeReminders: "Lembretes Ativos",
    nextRestock: "Próxima reposição sugerida",
    adjustStock: "Ajustar Stock",
    manageReminders: "Gerir Lembretes",
  },
};

// Stock adjustment modal component
function StockAdjustmentModal({
  isOpen,
  onClose,
  onSave,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustment: StockAdjustment) => Promise<void>;
  loading: boolean;
}) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    quantityChange: 0,
    changeType: 'adjustment',
    reason: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(adjustment);
      setAdjustment({
        quantityChange: 0,
        changeType: 'adjustment',
        reason: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">{t.adjustStock}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity Change
              </label>
              <input
                type="number"
                value={adjustment.quantityChange}
                onChange={(e) => setAdjustment(prev => ({ 
                  ...prev, 
                  quantityChange: parseInt(e.target.value) || 0 
                }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter positive or negative number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Change Type
              </label>
              <select
                value={adjustment.changeType}
                onChange={(e) => setAdjustment(prev => ({ 
                  ...prev, 
                  changeType: e.target.value 
                }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="adjustment">Manual Adjustment</option>
                <option value="restock">Restock</option>
                <option value="return">Return</option>
                <option value="damage">Damage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Reason
              </label>
              <input
                type="text"
                value={adjustment.reason}
                onChange={(e) => setAdjustment(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Brief reason for this change"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={adjustment.notes}
                onChange={(e) => setAdjustment(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InventoryManagementPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();

  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  const loadLowStockProducts = useCallback(async () => {
    try {
      const products = await fetchJsonWithRetry<LowStockProduct[]>(
        "/api/inventory/low-stock",
        undefined,
        2,
        "inventory:low-stock"
      );
      setLowStockProducts(products);
    } catch (error) {
      console.error("Error loading low stock products:", error);
      toast.error(t.error);
    }
  }, [t.error, toast]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await loadLowStockProducts();
    } finally {
      setLoading(false);
    }
  }, [loadLowStockProducts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStockAdjustment = async (adjustment: StockAdjustment) => {
    setAdjustmentLoading(true);
    try {
      await fetchJsonWithRetry(
        "/api/inventory/adjust-stock",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustment),
        },
        2,
        "inventory:adjust-stock"
      );
      
      toast.success("Stock adjusted successfully");
      await loadData(); // Refresh data
    } catch (error) {
      console.error("Stock adjustment error:", error);
      toast.error("Failed to adjust stock");
      throw error; // Re-throw so modal can handle it
    } finally {
      setAdjustmentLoading(false);
    }
  };

  // Stats calculations
  const outOfStockCount = lowStockProducts.filter(p => p.currentStock === 0).length;
  const criticalCount = lowStockProducts.filter(p => p.currentStock > 0 && p.currentStock <= Math.floor(p.threshold * 0.5)).length;
  const lowStockCount = lowStockProducts.length - outOfStockCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {t.adjustStock}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.lowStock}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount}</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{t.outOfStock}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{outOfStockCount}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <PackageX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{criticalCount}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">With Reminders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {lowStockProducts.filter(p => p.hasReminder).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/inventory/history"
            className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200">
                  <History className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{t.stockHistory}</p>
                  <p className="text-sm text-slate-500">View all stock changes</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>

          <Link
            href="/dashboard/inventory/reminders"
            className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{t.manageReminders}</p>
                  <p className="text-sm text-slate-500">Set up restock alerts</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>

          <Link
            href="/dashboard/catalog"
            className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Products</p>
                  <p className="text-sm text-slate-500">Manage product catalog</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
            </div>
          </Link>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.attention}</h2>
              <p className="text-sm text-slate-500 mt-1">Products that need attention</p>
            </div>
            {lowStockProducts.length > 0 && (
              <Link
                href="/dashboard/catalog?filter=Low Stock"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {t.viewAll}
              </Link>
            )}
          </div>

          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <PackageCheck className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">{t.noLowStock}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.noLowStockDesc}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={`${product.type}_${product.id}`}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        product.currentStock === 0 
                          ? 'bg-red-100' 
                          : product.currentStock <= Math.floor(product.threshold * 0.5)
                          ? 'bg-red-100'
                          : 'bg-amber-100'
                      }`}>
                        {product.currentStock === 0 ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : product.currentStock <= Math.floor(product.threshold * 0.5) ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{product.name}</p>
                          {product.variantName && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                              {product.variantName}
                            </span>
                          )}
                          {product.currentStock === 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {product.currentStock} / {product.threshold} {product.currentStock === 1 ? t.item : t.items}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {product.hasReminder ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {t.hasReminder}
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/inventory/reminders?create=true&${product.type}Id=${product.id}`}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200"
                        >
                          {t.createReminderAction}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {lowStockProducts.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      href="/dashboard/catalog?filter=Low Stock"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View {lowStockProducts.length - 5} more products
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSave={handleStockAdjustment}
        loading={adjustmentLoading}
      />
    </>
  );
}