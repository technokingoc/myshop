"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  BarChart3,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Target,
  UserCheck,
  Award,
  RefreshCw,
} from "lucide-react";

const dict = {
  en: {
    title: "Seller Analytics Dashboard",
    subtitle: "Comprehensive insights into your store performance and customer behavior.",
    // Periods
    period7d: "7 days",
    period30d: "30 days",
    period90d: "90 days",
    periodAll: "All time",
    // Group by
    groupByDay: "Daily",
    groupByWeek: "Weekly", 
    groupByMonth: "Monthly",
    // Metrics
    orders: "Orders",
    revenue: "Revenue",
    avgOrder: "Avg Order Value",
    customers: "Customers",
    conversionRate: "Conversion Rate",
    storeViews: "Store Views",
    // Charts
    revenueChart: "Revenue Analysis",
    topProducts: "Top Selling Products",
    customerDemographics: "Customer Demographics",
    conversionFunnel: "Conversion Funnel",
    // Table headers
    product: "Product",
    orderCount: "Orders",
    revenueLabel: "Revenue",
    uniqueCustomers: "Customers",
    avgOrderValue: "AOV",
    // Customer segments
    newCustomers: "New",
    repeatCustomers: "Returning",
    championCustomers: "Champions",
    loyalCustomers: "Loyal",
    // Funnel stages
    statusPlaced: "Order Placed",
    statusContacted: "Contacted",
    statusConfirmed: "Confirmed",
    statusShipped: "Shipped", 
    statusDelivered: "Delivered",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    // Export
    exportReport: "Export Report",
    exportSuccess: "Report exported successfully",
    // Period comparison
    comparedToPrevious: "vs previous period",
    periodComparison: "Period Comparison",
    current: "Current",
    previous: "Previous",
    change: "Change",
    // States
    noData: "No data for this period",
    placeholder: "—",
    loading: "Loading analytics...",
    // Metrics descriptions
    ordersDesc: "Total orders received",
    revenueDesc: "Total revenue generated", 
    avgOrderDesc: "Average value per order",
    customersDesc: "Unique customers",
    conversionDesc: "Orders completed rate",
    storeViewsDesc: "Store page views",
  },
  pt: {
    title: "Painel de Análises do Vendedor",
    subtitle: "Insights abrangentes sobre o desempenho da sua loja e comportamento dos clientes.",
    // Periods  
    period7d: "7 dias",
    period30d: "30 dias",
    period90d: "90 dias",
    periodAll: "Todo período",
    // Group by
    groupByDay: "Diário",
    groupByWeek: "Semanal",
    groupByMonth: "Mensal",
    // Metrics
    orders: "Pedidos",
    revenue: "Receita",
    avgOrder: "Valor Médio",
    customers: "Clientes",
    conversionRate: "Taxa de Conversão",
    storeViews: "Visualizações",
    // Charts
    revenueChart: "Análise de Receita",
    topProducts: "Produtos Mais Vendidos", 
    customerDemographics: "Demografia de Clientes",
    conversionFunnel: "Funil de Conversão",
    // Table headers
    product: "Produto", 
    orderCount: "Pedidos",
    revenueLabel: "Receita",
    uniqueCustomers: "Clientes",
    avgOrderValue: "VMV",
    // Customer segments
    newCustomers: "Novos",
    repeatCustomers: "Recorrentes",
    championCustomers: "Champions",
    loyalCustomers: "Leais",
    // Funnel stages
    statusPlaced: "Pedido Feito",
    statusContacted: "Contactado",
    statusConfirmed: "Confirmado", 
    statusShipped: "Enviado",
    statusDelivered: "Entregue",
    statusCompleted: "Concluído",
    statusCancelled: "Cancelado",
    // Export
    exportReport: "Exportar Relatório",
    exportSuccess: "Relatório exportado com sucesso",
    // Period comparison
    comparedToPrevious: "vs período anterior",
    periodComparison: "Comparação de Período",
    current: "Atual",
    previous: "Anterior", 
    change: "Mudança",
    // States
    noData: "Sem dados para este período",
    placeholder: "—",
    loading: "A carregar análises...",
    // Metrics descriptions
    ordersDesc: "Total de pedidos recebidos",
    revenueDesc: "Receita total gerada",
    avgOrderDesc: "Valor médio por pedido",
    customersDesc: "Clientes únicos",
    conversionDesc: "Taxa de pedidos concluídos",
    storeViewsDesc: "Visualizações da loja",
  },
};

type AnalyticsData = {
  period: string;
  groupBy: string;
  metrics: {
    orders: number;
    orderTrend: number;
    revenue: number;
    revenueTrend: number;
    avgOrderValue: number;
    customers: number;
    customerTrend: number;
    conversionRate: number;
    storeViews: number;
  };
  timeSeriesData: { date: string; count: number; revenue: number; uniqueCustomers: number }[];
  topProducts: { itemId: number; name: string; price: string; orderCount: number; revenue: number; uniqueCustomers: number; avgOrderValue: number }[];
  customerSegmentation: {
    total: number;
    new: number; 
    repeat: number;
    segments: { contact: string; orderCount: number; revenue: number; segment: string; avgOrderValue: number }[];
    demographics: { champion: number; loyal: number; repeat_: number; new_: number };
  };
  conversionFunnel: { status: string; count: number; revenue: number; conversionRate: number; dropOffRate: number }[];
  previousPeriodComparison: {
    orders: { current: number; previous: number; trend: number };
    revenue: { current: number; previous: number; trend: number };
    customers: { current: number; previous: number; trend: number };
    avgOrderValue: { current: number; previous: number; trend: number };
  };
};

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [period, setPeriod] = useState("30d");
  const [groupBy, setGroupBy] = useState("day");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/analytics?period=${period}&groupBy=${groupBy}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, groupBy]);

  const periods = [
    { key: "7d", label: t.period7d },
    { key: "30d", label: t.period30d },
    { key: "90d", label: t.period90d },
    { key: "all", label: t.periodAll },
  ];

  const groupByOptions = [
    { key: "day", label: t.groupByDay },
    { key: "week", label: t.groupByWeek }, 
    { key: "month", label: t.groupByMonth },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/dashboard/analytics?period=${period}&groupBy=${groupBy}&export=true`, { 
        credentials: "include" 
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setExporting(false);
  };

  const statusLabel = (s: string) => {
    const statusMap: Record<string, string> = {
      placed: t.statusPlaced,
      contacted: t.statusContacted,
      confirmed: t.statusConfirmed,
      shipped: t.statusShipped,
      delivered: t.statusDelivered,
      completed: t.statusCompleted,
      cancelled: t.statusCancelled,
    };
    return statusMap[s] || s;
  };

  const formatChartDate = (dateStr: string, groupBy: string) => {
    if (groupBy === 'week') {
      const [year, week] = dateStr.replace('W', '').split('W');
      return `W${week}/${year.slice(-2)}`;
    } else if (groupBy === 'month') {
      const [year, month] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
    } else {
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const maxChartValue = data ? Math.max(...data.timeSeriesData.map((d) => d.revenue), 1) : 1;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t.exportReport}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Period selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                period === p.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Group by selector */}
        <div className="flex gap-2">
          {groupByOptions.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroupBy(g.key)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                groupBy === g.key
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
        </div>
      ) : !data ? (
        <p className="py-10 text-center text-sm text-slate-500">{t.noData}</p>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <MetricCard
              icon={ShoppingCart}
              label={t.orders}
              description={t.ordersDesc}
              value={String(data.metrics.orders)}
              trend={data.metrics.orderTrend}
              color="text-green-600 bg-green-50"
            />
            <MetricCard
              icon={DollarSign}
              label={t.revenue}
              description={t.revenueDesc}
              value={`$${data.metrics.revenue.toFixed(2)}`}
              trend={data.metrics.revenueTrend}
              color="text-emerald-600 bg-emerald-50"
            />
            <MetricCard
              icon={TrendingUp}
              label={t.avgOrder}
              description={t.avgOrderDesc}
              value={`$${data.metrics.avgOrderValue.toFixed(2)}`}
              trend={data.previousPeriodComparison.avgOrderValue.trend}
              color="text-green-600 bg-green-50"
            />
            <MetricCard
              icon={Users}
              label={t.customers}
              description={t.customersDesc}
              value={String(data.metrics.customers)}
              trend={data.metrics.customerTrend}
              color="text-purple-600 bg-purple-50"
            />
            <MetricCard
              icon={Target}
              label={t.conversionRate}
              description={t.conversionDesc}
              value={`${data.metrics.conversionRate}%`}
              color="text-amber-600 bg-amber-50"
            />
            <MetricCard
              icon={Eye}
              label={t.storeViews}
              description={t.storeViewsDesc}
              value={data.metrics.storeViews > 0 ? String(data.metrics.storeViews) : t.placeholder}
              color="text-slate-500 bg-slate-50"
            />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.revenueChart}</h2>
              {data.timeSeriesData.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="flex items-end gap-1" style={{ height: 200 }}>
                  {data.timeSeriesData.map((d, i) => {
                    const pct = (d.revenue / maxChartValue) * 100;
                    const label = formatChartDate(d.date, data.groupBy);
                    return (
                      <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-green-500 to-green-400 transition-colors group-hover:from-green-600 group-hover:to-green-500"
                          style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
                          title={`${label}: ${d.count} orders, $${d.revenue.toFixed(2)} revenue, ${d.uniqueCustomers} customers`}
                        />
                        {(data.timeSeriesData.length <= 20 || i % Math.ceil(data.timeSeriesData.length / 12) === 0) && (
                          <span className="mt-2 text-[10px] text-slate-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Demographics */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.customerDemographics}</h2>
              {data.customerSegmentation.total === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{data.customerSegmentation.total}</p>
                    <p className="text-sm text-slate-500">{t.customers}</p>
                  </div>
                  
                  {/* Segment breakdown */}
                  <div className="space-y-3">
                    <SegmentBar
                      label={t.championCustomers}
                      count={data.customerSegmentation.demographics.champion}
                      total={data.customerSegmentation.total}
                      color="bg-purple-500"
                    />
                    <SegmentBar
                      label={t.loyalCustomers}
                      count={data.customerSegmentation.demographics.loyal}
                      total={data.customerSegmentation.total}
                      color="bg-green-500"
                    />
                    <SegmentBar
                      label={t.repeatCustomers}
                      count={data.customerSegmentation.demographics.repeat_}
                      total={data.customerSegmentation.total}
                      color="bg-emerald-500"
                    />
                    <SegmentBar
                      label={t.newCustomers}
                      count={data.customerSegmentation.demographics.new_}
                      total={data.customerSegmentation.total}
                      color="bg-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.topProducts}</h2>
              {data.topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium text-slate-500 border-b border-slate-100">
                        <th className="text-left pb-3">{t.product}</th>
                        <th className="text-center pb-3">{t.orderCount}</th>
                        <th className="text-right pb-3">{t.revenueLabel}</th>
                        <th className="text-right pb-3">{t.avgOrderValue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-slate-800 truncate">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.uniqueCustomers} customers</div>
                          </td>
                          <td className="py-3 text-center text-sm text-slate-600">{p.orderCount}</td>
                          <td className="py-3 text-right text-sm font-medium text-slate-800">
                            ${p.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-sm text-slate-600">
                            ${p.avgOrderValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Conversion Funnel */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.conversionFunnel}</h2>
              {data.conversionFunnel.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="space-y-4">
                  {data.conversionFunnel.map((stage, i) => {
                    const maxCount = Math.max(...data.conversionFunnel.map(s => s.count), 1);
                    const width = (stage.count / maxCount) * 100;
                    
                    const stageColors: Record<string, string> = {
                      placed: "bg-green-500",
                      contacted: "bg-cyan-500",
                      confirmed: "bg-green-500", 
                      shipped: "bg-purple-500",
                      delivered: "bg-emerald-500",
                      completed: "bg-green-500",
                      cancelled: "bg-red-500",
                    };

                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{statusLabel(stage.status)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">{stage.count}</span>
                            {stage.dropOffRate > 0 && (
                              <span className="text-xs text-red-600">-{stage.dropOffRate.toFixed(1)}%</span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${stageColors[stage.status] || "bg-slate-400"}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{stage.conversionRate.toFixed(1)}% of total</span>
                          <span>${stage.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Period Comparison */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.periodComparison}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ComparisonCard
                label={t.orders}
                current={data.previousPeriodComparison.orders.current}
                previous={data.previousPeriodComparison.orders.previous}
                trend={data.previousPeriodComparison.orders.trend}
              />
              <ComparisonCard
                label={t.revenue}
                current={`$${data.previousPeriodComparison.revenue.current.toFixed(2)}`}
                previous={`$${data.previousPeriodComparison.revenue.previous.toFixed(2)}`}
                trend={data.previousPeriodComparison.revenue.trend}
              />
              <ComparisonCard
                label={t.customers}
                current={data.previousPeriodComparison.customers.current}
                previous={data.previousPeriodComparison.customers.previous}
                trend={data.previousPeriodComparison.customers.trend}
              />
              <ComparisonCard
                label={t.avgOrder}
                current={`$${data.previousPeriodComparison.avgOrderValue.current.toFixed(2)}`}
                previous={`$${data.previousPeriodComparison.avgOrderValue.previous.toFixed(2)}`}
                trend={data.previousPeriodComparison.avgOrderValue.trend}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  description,
  value,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: string;
  trend?: number;
  color: string;
}) {
  const [iconColor, bgColor] = color.split(" ");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex rounded-lg p-2 ${bgColor}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <div className="mt-1 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

function SegmentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-600">{count}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ComparisonCard({ label, current, previous, trend }: { label: string; current: string | number; previous: string | number; trend: number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{current}</p>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-slate-500">vs {previous}</span>
        {trend !== 0 && (
          <span className={`inline-flex items-center gap-1 font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}