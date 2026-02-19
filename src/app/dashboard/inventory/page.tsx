"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Package2, 
  AlertTriangle, 
  TrendingDown, 
  Plus, 
  Search, 
  Download, 
  Upload,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Warehouse,
  Bell,
  Settings,
} from "lucide-react";
import { BulkStockUpdate } from "@/components/inventory/bulk-stock-update";
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog";
import { StockHistory } from "@/components/inventory/stock-history";
import { RestockReminders } from "@/components/inventory/restock-reminders";

type Product = {
  id: number;
  name: string;
  type: 'product' | 'variant';
  currentStock: number;
  threshold: number;
  variantName?: string;
  hasReminder: boolean;
  price?: number;
  sku?: string;
};

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
};

type RestockReminder = {
  id: number;
  productName: string;
  variantName?: string;
  currentStock: number;
  triggerQuantity: number;
  targetQuantity: number;
  supplierName?: string;
  status: 'active' | 'snoozed' | 'disabled';
  lastTriggered?: string;
};

const dict = {
  en: {
    title: "Inventory Management",
    overview: "Overview",
    lowStockAlerts: "Low Stock Alerts",
    stockHistory: "Stock History",
    restockReminders: "Restock Reminders",
    bulkUpdate: "Bulk Update",
    totalProducts: "Total Products",
    lowStockItems: "Low Stock Items",
    outOfStockItems: "Out of Stock Items",
    needsRestock: "Needs Restock",
    product: "Product",
    variant: "Variant",
    currentStock: "Current Stock",
    threshold: "Threshold",
    status: "Status",
    actions: "Actions",
    inStock: "In Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    adjustStock: "Adjust Stock",
    viewHistory: "View History",
    setReminder: "Set Reminder",
    search: "Search products...",
    filter: "Filter",
    export: "Export",
    import: "Import",
    all: "All",
    active: "Active",
    snoozed: "Snoozed",
    disabled: "Disabled",
    supplier: "Supplier",
    target: "Target",
    triggered: "Last Triggered",
    changeType: "Type",
    change: "Change",
    reason: "Reason",
    date: "Date",
    by: "By",
    adjustment: "Adjustment",
    sale: "Sale",
    restock: "Restock",
    return: "Return",
    damage: "Damage",
    initial: "Initial",
    noDataFound: "No data found",
    loadingData: "Loading data...",
  },
  pt: {
    title: "Gestão de Inventário",
    overview: "Visão Geral",
    lowStockAlerts: "Alertas de Estoque Baixo",
    stockHistory: "Histórico de Estoque",
    restockReminders: "Lembretes de Reposição",
    bulkUpdate: "Atualização em Lote",
    totalProducts: "Total de Produtos",
    lowStockItems: "Itens com Estoque Baixo",
    outOfStockItems: "Itens Esgotados",
    needsRestock: "Necessita Reposição",
    product: "Produto",
    variant: "Variante",
    currentStock: "Estoque Atual",
    threshold: "Limite",
    status: "Estado",
    actions: "Ações",
    inStock: "Em Estoque",
    lowStock: "Estoque Baixo",
    outOfStock: "Esgotado",
    adjustStock: "Ajustar Estoque",
    viewHistory: "Ver Histórico",
    setReminder: "Definir Lembrete",
    search: "Pesquisar produtos...",
    filter: "Filtrar",
    export: "Exportar",
    import: "Importar",
    all: "Todos",
    active: "Ativo",
    snoozed: "Adiado",
    disabled: "Desabilitado",
    supplier: "Fornecedor",
    target: "Alvo",
    triggered: "Último Acionamento",
    changeType: "Tipo",
    change: "Mudança",
    reason: "Motivo",
    date: "Data",
    by: "Por",
    adjustment: "Ajuste",
    sale: "Venda",
    restock: "Reposição",
    return: "Devolução",
    damage: "Dano",
    initial: "Inicial",
    noDataFound: "Nenhum dado encontrado",
    loadingData: "Carregando dados...",
  },
};

function StockStatusBadge({ currentStock, threshold }: { currentStock: number; threshold: number }) {
  const { lang } = useLanguage();
  const t = dict[lang];

  if (currentStock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" />
        {t.outOfStock}
      </span>
    );
  }

  if (currentStock <= threshold) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
        <AlertCircle className="h-3 w-3" />
        {t.lowStock}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
      <CheckCircle className="h-3 w-3" />
      {t.inStock}
    </span>
  );
}

function OverviewCards({ 
  lowStockProducts, 
  loading 
}: { 
  lowStockProducts: Product[]; 
  loading: boolean 
}) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const totalProducts = 150; // TODO: Get from API
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = lowStockProducts.filter(p => p.currentStock === 0).length;
  const needsRestockCount = lowStockProducts.filter(p => !p.hasReminder && p.currentStock > 0).length;

  const cards = [
    { title: t.totalProducts, value: totalProducts, icon: Package2, color: "blue" },
    { title: t.lowStockItems, value: lowStockCount, icon: AlertTriangle, color: "orange" },
    { title: t.outOfStockItems, value: outOfStockCount, icon: XCircle, color: "red" },
    { title: t.needsRestock, value: needsRestockCount, icon: TrendingDown, color: "purple" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{card.title}</p>
              <p className="text-3xl font-bold text-slate-900">
                {loading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </p>
            </div>
            <div className={`rounded-lg p-3 bg-${card.color}-50`}>
              <card.icon className={`h-6 w-6 text-${card.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LowStockTable({ products, loading }: { products: Product[]; loading: boolean }) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.variantName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "outOfStock" && product.currentStock === 0) ||
                         (statusFilter === "lowStock" && product.currentStock > 0 && product.currentStock <= product.threshold);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t.lowStockAlerts}</h3>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{t.lowStockAlerts}</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="lowStock">{t.lowStock}</option>
              <option value="outOfStock">{t.outOfStock}</option>
            </select>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center">
          <Package2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{t.noDataFound}</p>
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
                  {t.currentStock}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t.threshold}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr key={`${product.type}-${product.id}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      {product.variantName && (
                        <p className="text-sm text-slate-500">{product.variantName}</p>
                      )}
                      <span className="inline-flex mt-1 items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {product.type === 'product' ? t.product : t.variant}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">{product.currentStock}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-slate-600">{product.threshold}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StockStatusBadge currentStock={product.currentStock} threshold={product.threshold} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowAdjustmentModal(true)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t.adjustStock}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      {!product.hasReminder && (
                        <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Bell className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [activeTab, setActiveTab] = useState("overview");
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // State for stock adjustment modal

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/low-stock');
      if (response.ok) {
        const data = await response.json();
        setLowStockProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: t.overview, icon: Package2 },
    { id: "alerts", label: t.lowStockAlerts, icon: AlertTriangle },
    { id: "history", label: t.stockHistory, icon: Clock },
    { id: "reminders", label: t.restockReminders, icon: Bell },
    { id: "bulk", label: t.bulkUpdate, icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="text-slate-600">Manage your inventory, track stock levels, and set up restock reminders</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" />
            {t.export}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Upload className="h-4 w-4" />
            {t.import}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4" />
            {t.adjustStock}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <OverviewCards lowStockProducts={lowStockProducts} loading={loading} />
          <LowStockTable products={lowStockProducts} loading={loading} />
        </div>
      )}

      {activeTab === "alerts" && (
        <LowStockTable products={lowStockProducts} loading={loading} />
      )}

      {activeTab === "history" && <StockHistory />}

      {activeTab === "reminders" && <RestockReminders />}

      {activeTab === "bulk" && <BulkStockUpdate />}

      {/* Stock Adjustment Modal is already included above */}
    </div>
  );
}