"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import {
  Package, TrendingDown, AlertTriangle, Clock, Settings, RefreshCw,
  PackageX, AlertCircle, ChevronRight, Bell, BellOff, Eye, EyeOff,
  ArrowUp, ArrowDown, BarChart3, Target, Calendar, User
} from "lucide-react";

type InventoryAlert = {
  id: number;
  type: 'low_stock' | 'out_of_stock' | 'restock_due';
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  currentStock: number;
  threshold: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
};

type StockOverview = {
  total: number;
  healthy: number;
  atRisk: number;
  outOfStock: number;
  trends: {
    healthyTrend: number;
    atRiskTrend: number;
    outOfStockTrend: number;
  };
};

type RestockSuggestion = {
  id: number;
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  currentStock: number;
  suggestedQuantity: number;
  salesVelocity: number;
  daysOfStock: number;
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  supplier?: string;
};

const dict = {
  en: {
    title: "Inventory Alerts & Stock Management",
    subtitle: "Monitor stock levels, manage alerts, and optimize inventory",
    stockOverview: "Stock Overview",
    alerts: "Active Alerts",
    restockSuggestions: "Restock Suggestions",
    settings: "Alert Settings",
    
    // Overview stats
    totalProducts: "Total Products",
    healthyStock: "Healthy Stock",
    atRisk: "At Risk",
    outOfStock: "Out of Stock",
    
    // Alert types
    lowStock: "Low Stock",
    outOfStockAlert: "Out of Stock",
    restockDue: "Restock Due",
    
    // Severity levels
    high: "High",
    medium: "Medium",
    low: "Low",
    
    // Status
    active: "Active",
    acknowledged: "Acknowledged",
    resolved: "Resolved",
    
    // Actions
    viewProduct: "View Product",
    acknowledge: "Acknowledge",
    resolve: "Resolve",
    createReminder: "Create Reminder",
    adjustStock: "Adjust Stock",
    hideOutOfStock: "Hide Out of Stock Products",
    showOutOfStock: "Show Out of Stock Products",
    
    // Restock suggestions
    suggestedReorder: "Suggested Reorder",
    salesVelocity: "Sales Velocity",
    daysOfStock: "Days of Stock",
    estimatedCost: "Estimated Cost",
    supplier: "Supplier",
    orderNow: "Order Now",
    snooze: "Snooze",
    
    // Settings
    autoHideOutOfStock: "Auto-hide out of stock products",
    lowStockThresholds: "Low Stock Thresholds",
    alertFrequency: "Alert Frequency",
    emailNotifications: "Email Notifications",
    inAppNotifications: "In-App Notifications",
    
    // Time periods
    perDay: "per day",
    perWeek: "per week",
    daysRemaining: "days remaining",
    
    // Status messages
    loading: "Loading...",
    error: "Error loading data",
    noAlerts: "No active alerts",
    noSuggestions: "No restock suggestions at this time",
    allGood: "All products have healthy stock levels",
    
    // Trends
    trending: "trending",
    up: "up",
    down: "down",
    stable: "stable",
  },
  pt: {
    title: "Alertas de Inventário e Gestão de Stock",
    subtitle: "Monitorizar níveis de stock, gerir alertas e otimizar inventário",
    stockOverview: "Visão Geral do Stock",
    alerts: "Alertas Ativos",
    restockSuggestions: "Sugestões de Reposição",
    settings: "Configurações de Alertas",
    
    // Overview stats
    totalProducts: "Total de Produtos",
    healthyStock: "Stock Saudável",
    atRisk: "Em Risco",
    outOfStock: "Sem Stock",
    
    // Alert types
    lowStock: "Stock Baixo",
    outOfStockAlert: "Sem Stock",
    restockDue: "Reposição Devida",
    
    // Severity levels
    high: "Alto",
    medium: "Médio",
    low: "Baixo",
    
    // Status
    active: "Ativo",
    acknowledged: "Reconhecido",
    resolved: "Resolvido",
    
    // Actions
    viewProduct: "Ver Produto",
    acknowledge: "Reconhecer",
    resolve: "Resolver",
    createReminder: "Criar Lembrete",
    adjustStock: "Ajustar Stock",
    hideOutOfStock: "Ocultar Produtos Sem Stock",
    showOutOfStock: "Mostrar Produtos Sem Stock",
    
    // Restock suggestions
    suggestedReorder: "Reposição Sugerida",
    salesVelocity: "Velocidade de Vendas",
    daysOfStock: "Dias de Stock",
    estimatedCost: "Custo Estimado",
    supplier: "Fornecedor",
    orderNow: "Encomendar Agora",
    snooze: "Adiar",
    
    // Settings
    autoHideOutOfStock: "Ocultar automaticamente produtos sem stock",
    lowStockThresholds: "Limites de Stock Baixo",
    alertFrequency: "Frequência de Alertas",
    emailNotifications: "Notificações por Email",
    inAppNotifications: "Notificações na App",
    
    // Time periods
    perDay: "por dia",
    perWeek: "por semana",
    daysRemaining: "dias restantes",
    
    // Status messages
    loading: "A carregar...",
    error: "Erro ao carregar dados",
    noAlerts: "Sem alertas ativos",
    noSuggestions: "Sem sugestões de reposição neste momento",
    allGood: "Todos os produtos têm níveis saudáveis de stock",
    
    // Trends
    trending: "tendência",
    up: "subida",
    down: "descida",
    stable: "estável",
  },
};

export default function InventoryAlertsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stockOverview, setStockOverview] = useState<StockOverview | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [autoHideOutOfStock, setAutoHideOutOfStock] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'restock_due'>('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load stock overview
      const overviewResponse = await fetchJsonWithRetry('/api/inventory/stock-overview');
      if (overviewResponse.success) {
        setStockOverview(overviewResponse.data);
      }
      
      // Load active alerts
      const alertsResponse = await fetchJsonWithRetry('/api/inventory/alerts');
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data);
      }
      
      // Load restock suggestions
      const suggestionsResponse = await fetchJsonWithRetry('/api/inventory/restock-suggestions');
      if (suggestionsResponse.success) {
        setRestockSuggestions(suggestionsResponse.data);
      }
      
      // Load settings
      const settingsResponse = await fetchJsonWithRetry('/api/inventory/settings');
      if (settingsResponse.success) {
        setAutoHideOutOfStock(settingsResponse.data.autoHideOutOfStock || false);
      }
      
    } catch (error) {
      showToast(t.error, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t.error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetchJsonWithRetry(`/api/inventory/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      
      if (response.success) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged' as const } 
            : alert
        ));
        showToast('Alert acknowledged', 'success');
      } else {
        showToast('Failed to acknowledge alert', 'error');
      }
    } catch (error) {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      const response = await fetchJsonWithRetry(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      
      if (response.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        showToast('Alert resolved', 'success');
        loadData(); // Refresh data to update overview
      } else {
        showToast('Failed to resolve alert', 'error');
      }
    } catch (error) {
      showToast('Failed to resolve alert', 'error');
    }
  };

  const handleToggleAutoHide = async () => {
    try {
      const newValue = !autoHideOutOfStock;
      const response = await fetchJsonWithRetry('/api/inventory/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoHideOutOfStock: newValue }),
      });
      
      if (response.success) {
        setAutoHideOutOfStock(newValue);
        showToast(
          newValue ? t.hideOutOfStock : t.showOutOfStock, 
          'success'
        );
      } else {
        showToast('Failed to update setting', 'error');
      }
    } catch (error) {
      showToast('Failed to update setting', 'error');
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    alertFilter === 'all' || alert.type === alertFilter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTrend = (trend: number) => {
    if (trend > 0) return { icon: ArrowUp, color: 'text-green-600', text: `+${trend}%` };
    if (trend < 0) return { icon: ArrowDown, color: 'text-red-600', text: `${trend}%` };
    return { icon: null, color: 'text-gray-600', text: '0%' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-2 text-gray-600">{t.subtitle}</p>
      </div>

      {/* Stock Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.totalProducts}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stockOverview?.total || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.healthyStock}</p>
              <p className="text-2xl font-bold text-green-600">
                {stockOverview?.healthy || 0}
              </p>
              {stockOverview?.trends.healthyTrend !== undefined && (
                <div className="flex items-center mt-1">
                  {(() => {
                    const trend = formatTrend(stockOverview.trends.healthyTrend);
                    return (
                      <>
                        {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                        <span className={`text-xs ${trend.color}`}>{trend.text}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <PackageCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.atRisk}</p>
              <p className="text-2xl font-bold text-amber-600">
                {stockOverview?.atRisk || 0}
              </p>
              {stockOverview?.trends.atRiskTrend !== undefined && (
                <div className="flex items-center mt-1">
                  {(() => {
                    const trend = formatTrend(stockOverview.trends.atRiskTrend);
                    return (
                      <>
                        {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                        <span className={`text-xs ${trend.color}`}>{trend.text}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.outOfStock}</p>
              <p className="text-2xl font-bold text-red-600">
                {stockOverview?.outOfStock || 0}
              </p>
              {stockOverview?.trends.outOfStockTrend !== undefined && (
                <div className="flex items-center mt-1">
                  {(() => {
                    const trend = formatTrend(stockOverview.trends.outOfStockTrend);
                    return (
                      <>
                        {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                        <span className={`text-xs ${trend.color}`}>{trend.text}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <PackageX className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Settings Toggle */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-medium">{t.autoHideOutOfStock}</span>
          </div>
          <button
            onClick={handleToggleAutoHide}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              autoHideOutOfStock ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoHideOutOfStock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Alerts */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{t.alerts}</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                >
                  <option value="all">All Alerts</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="restock_due">Restock Due</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.noAlerts}</p>
                <p className="text-sm text-gray-500 mt-2">{t.allGood}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                            {t[alert.type as keyof typeof t] as string}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-white">
                            {t[alert.severity as keyof typeof t] as string}
                          </span>
                        </div>
                        <h4 className="font-medium">
                          {alert.productName}
                          {alert.variantName && (
                            <span className="text-sm font-normal ml-2">
                              ({alert.variantName})
                            </span>
                          )}
                        </h4>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {t.acknowledge}
                            </button>
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {t.resolve}
                            </button>
                          </>
                        )}
                        <Link
                          href={`/dashboard/catalog?highlight=${alert.productId}`}
                          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          {t.viewProduct}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Restock Suggestions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t.restockSuggestions}</h2>
          </div>
          
          <div className="p-6">
            {restockSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t.noSuggestions}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {restockSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                            {t[suggestion.priority as keyof typeof t] as string}
                          </span>
                        </div>
                        <h4 className="font-medium">
                          {suggestion.productName}
                          {suggestion.variantName && (
                            <span className="text-sm font-normal ml-2">
                              ({suggestion.variantName})
                            </span>
                          )}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-600">{t.suggestedReorder}</p>
                            <p className="font-medium">{suggestion.suggestedQuantity} units</p>
                          </div>
                          <div>
                            <p className="text-gray-600">{t.daysOfStock}</p>
                            <p className="font-medium">{suggestion.daysOfStock} {t.daysRemaining}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">{t.salesVelocity}</p>
                            <p className="font-medium">{suggestion.salesVelocity} {t.perDay}</p>
                          </div>
                          {suggestion.estimatedCost && (
                            <div>
                              <p className="text-gray-600">{t.estimatedCost}</p>
                              <p className="font-medium">${suggestion.estimatedCost.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                        
                        {suggestion.supplier && (
                          <p className="text-sm text-gray-600 mt-2">
                            {t.supplier}: {suggestion.supplier}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          {t.orderNow}
                        </button>
                        <button className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                          {t.snooze}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/inventory"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="font-medium">Inventory Overview</h4>
              <p className="text-sm text-gray-600">Manage all inventory</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Link>

        <Link
          href="/dashboard/catalog"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium">Product Catalog</h4>
              <p className="text-sm text-gray-600">Edit products & variants</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <TrendingDown className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-medium">Sales Analytics</h4>
              <p className="text-sm text-gray-600">View sales velocity</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Link>
      </div>
    </div>
  );
}