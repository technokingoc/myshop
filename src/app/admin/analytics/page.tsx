"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, ShoppingCart, 
  MessageSquare, Calendar, ArrowUp, ArrowDown, Activity
} from "lucide-react";

const dict = {
  en: {
    title: "Platform Analytics",
    subtitle: "Comprehensive platform performance metrics",
    overview: "Overview",
    revenue: "Revenue Analysis",
    growth: "Growth Metrics",
    totalRevenue: "Total Revenue",
    totalUsers: "Total Users",
    totalStores: "Total Stores",
    totalOrders: "Total Orders",
    totalProducts: "Total Products",
    totalReviews: "Total Reviews",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    monthlyRevenue: "Monthly Revenue",
    newUsers: "New Users",
    newStores: "New Stores",
    orderConversion: "Order Conversion",
    avgOrderValue: "Avg Order Value",
    topStores: "Top Performing Stores",
    storeName: "Store Name",
    orders: "Orders",
    storeRevenue: "Revenue",
    noData: "No data available",
    change: "Change",
  },
  pt: {
    title: "Análise da Plataforma",
    subtitle: "Métricas abrangentes do desempenho da plataforma",
    overview: "Visão Geral",
    revenue: "Análise de Receita",
    growth: "Métricas de Crescimento",
    totalRevenue: "Receita Total",
    totalUsers: "Total de Utilizadores",
    totalStores: "Total de Lojas",
    totalOrders: "Total de Pedidos",
    totalProducts: "Total de Produtos",
    totalReviews: "Total de Avaliações",
    thisMonth: "Este Mês",
    lastMonth: "Mês Passado",
    monthlyRevenue: "Receita Mensal",
    newUsers: "Novos Utilizadores",
    newStores: "Novas Lojas",
    orderConversion: "Conversão de Pedidos",
    avgOrderValue: "Valor Médio do Pedido",
    topStores: "Lojas com Melhor Desempenho",
    storeName: "Nome da Loja",
    orders: "Pedidos",
    storeRevenue: "Receita",
    noData: "Sem dados disponíveis",
    change: "Mudança",
  },
};

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalUsers: number;
    totalStores: number;
    totalOrders: number;
    totalProducts: number;
    totalReviews: number;
    currency: string;
  };
  monthly: {
    currentMonth: {
      revenue: number;
      users: number;
      stores: number;
      orders: number;
    };
    previousMonth: {
      revenue: number;
      users: number;
      stores: number;
      orders: number;
    };
    avgOrderValue: number;
    orderConversion: number;
  };
  topStores: Array<{
    id: number;
    name: string;
    slug: string;
    orders: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const maxRevenue = data?.monthlyRevenue ? Math.max(...data.monthlyRevenue.map(m => m.revenue)) : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      {/* Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.overview}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalRevenue}</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.overview.totalRevenue, data.overview.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalUsers}</p>
                <p className="text-lg font-bold text-gray-900">{data.overview.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalStores}</p>
                <p className="text-lg font-bold text-gray-900">{data.overview.totalStores.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalOrders}</p>
                <p className="text-lg font-bold text-gray-900">{data.overview.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalProducts}</p>
                <p className="text-lg font-bold text-gray-900">{data.overview.totalProducts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-500">{t.totalReviews}</p>
                <p className="text-lg font-bold text-gray-900">{data.overview.totalReviews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.growth}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.monthlyRevenue}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.monthly.currentMonth.revenue, data.overview.currency)}
                </p>
              </div>
              <div className={`flex items-center text-sm ${
                calculateChange(data.monthly.currentMonth.revenue, data.monthly.previousMonth.revenue) >= 0 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateChange(data.monthly.currentMonth.revenue, data.monthly.previousMonth.revenue) >= 0 
                  ? <ArrowUp className="h-4 w-4 mr-1" /> 
                  : <ArrowDown className="h-4 w-4 mr-1" />
                }
                {Math.abs(calculateChange(data.monthly.currentMonth.revenue, data.monthly.previousMonth.revenue))}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.newUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{data.monthly.currentMonth.users}</p>
              </div>
              <div className={`flex items-center text-sm ${
                calculateChange(data.monthly.currentMonth.users, data.monthly.previousMonth.users) >= 0 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateChange(data.monthly.currentMonth.users, data.monthly.previousMonth.users) >= 0 
                  ? <ArrowUp className="h-4 w-4 mr-1" /> 
                  : <ArrowDown className="h-4 w-4 mr-1" />
                }
                {Math.abs(calculateChange(data.monthly.currentMonth.users, data.monthly.previousMonth.users))}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.newStores}</p>
                <p className="text-2xl font-bold text-gray-900">{data.monthly.currentMonth.stores}</p>
              </div>
              <div className={`flex items-center text-sm ${
                calculateChange(data.monthly.currentMonth.stores, data.monthly.previousMonth.stores) >= 0 
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateChange(data.monthly.currentMonth.stores, data.monthly.previousMonth.stores) >= 0 
                  ? <ArrowUp className="h-4 w-4 mr-1" /> 
                  : <ArrowDown className="h-4 w-4 mr-1" />
                }
                {Math.abs(calculateChange(data.monthly.currentMonth.stores, data.monthly.previousMonth.stores))}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t.avgOrderValue}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.monthly.avgOrderValue, data.overview.currency)}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {data.monthly.orderConversion.toFixed(1)}% conv
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
            {t.monthlyRevenue}
          </h3>
          <div className="h-64">
            {data.monthlyRevenue.length > 0 ? (
              <div className="flex items-end space-x-2 h-full">
                {data.monthlyRevenue.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ 
                        height: `${(item.revenue / maxRevenue) * 200}px`,
                        minHeight: item.revenue > 0 ? '4px' : '0px'
                      }}
                    />
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      {item.month.slice(5)}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {formatCurrency(item.revenue, data.overview.currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t.noData}
              </div>
            )}
          </div>
        </div>

        {/* Top Stores */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            {t.topStores}
          </h3>
          <div className="space-y-3">
            {data.topStores.length > 0 ? (
              data.topStores.map((store, index) => (
                <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-sm text-gray-500">{store.orders} {t.orders}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(store.revenue, data.overview.currency)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">{t.noData}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}