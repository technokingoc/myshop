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
} from "lucide-react";

const dict = {
  en: {
    title: "Analytics",
    subtitle: "Track your store performance and customer engagement.",
    period7d: "7 days",
    period30d: "30 days",
    period90d: "90 days",
    periodAll: "All time",
    orders: "Orders",
    revenue: "Revenue",
    avgOrder: "Avg Order Value",
    storeViews: "Store Views",
    conversionRate: "Conversion Rate",
    ordersOverTime: "Orders over time",
    topProducts: "Top Products",
    product: "Product",
    orderCount: "Orders",
    revenueLabel: "Revenue",
    customers: "Customers",
    newCustomers: "New",
    repeatCustomers: "Returning",
    revenueByStatus: "Revenue by Status",
    status: "Status",
    count: "Count",
    noData: "No data for this period",
    placeholder: "—",
    statusNew: "New",
    statusContacted: "Contacted",
    statusCompleted: "Completed",
    loading: "Loading analytics...",
  },
  pt: {
    title: "Análises",
    subtitle: "Acompanhe o desempenho da sua loja e o envolvimento dos clientes.",
    period7d: "7 dias",
    period30d: "30 dias",
    period90d: "90 dias",
    periodAll: "Todo período",
    orders: "Pedidos",
    revenue: "Receita",
    avgOrder: "Valor Médio",
    storeViews: "Visualizações",
    conversionRate: "Taxa de Conversão",
    ordersOverTime: "Pedidos ao longo do tempo",
    topProducts: "Produtos Mais Vendidos",
    product: "Produto",
    orderCount: "Pedidos",
    revenueLabel: "Receita",
    customers: "Clientes",
    newCustomers: "Novos",
    repeatCustomers: "Recorrentes",
    revenueByStatus: "Receita por Estado",
    status: "Estado",
    count: "Quantidade",
    noData: "Sem dados para este período",
    placeholder: "—",
    statusNew: "Novo",
    statusContacted: "Contactado",
    statusCompleted: "Concluído",
    loading: "A carregar análises...",
  },
};

type AnalyticsData = {
  period: string;
  metrics: {
    orders: number;
    orderTrend: number;
    revenue: number;
    revenueTrend: number;
    avgOrderValue: number;
    storeViews: number;
    conversionRate: number;
  };
  dailyOrders: { date: string; count: number; revenue: number }[];
  topProducts: { itemId: number; name: string; price: string; orderCount: number; revenue: number }[];
  customers: { total: number; new: number; repeat: number };
  revenueByStatus: { status: string; count: number; revenue: number }[];
};

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/analytics?period=${period}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const periods = [
    { key: "7d", label: t.period7d },
    { key: "30d", label: t.period30d },
    { key: "90d", label: t.period90d },
    { key: "all", label: t.periodAll },
  ];

  const statusLabel = (s: string) => {
    if (s === "new") return t.statusNew;
    if (s === "contacted") return t.statusContacted;
    if (s === "completed") return t.statusCompleted;
    return s;
  };

  const maxDailyCount = data ? Math.max(...data.dailyOrders.map((d) => d.count), 1) : 1;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
        </div>
      ) : !data ? (
        <p className="py-10 text-center text-sm text-slate-500">{t.noData}</p>
      ) : (
        <>
          {/* Metrics cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              icon={ShoppingCart}
              label={t.orders}
              value={String(data.metrics.orders)}
              trend={data.metrics.orderTrend}
              color="text-blue-600 bg-blue-50"
            />
            <MetricCard
              icon={DollarSign}
              label={t.revenue}
              value={`$${data.metrics.revenue.toFixed(2)}`}
              trend={data.metrics.revenueTrend}
              color="text-emerald-600 bg-emerald-50"
            />
            <MetricCard
              icon={TrendingUp}
              label={t.avgOrder}
              value={`$${data.metrics.avgOrderValue.toFixed(2)}`}
              color="text-indigo-600 bg-indigo-50"
            />
            <MetricCard
              icon={Eye}
              label={t.storeViews}
              value={data.metrics.storeViews > 0 ? String(data.metrics.storeViews) : t.placeholder}
              color="text-slate-500 bg-slate-50"
            />
            <MetricCard
              icon={Users}
              label={t.conversionRate}
              value={data.metrics.conversionRate > 0 ? `${data.metrics.conversionRate}%` : t.placeholder}
              color="text-amber-600 bg-amber-50"
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {/* Orders over time chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">{t.ordersOverTime}</h2>
              {data.dailyOrders.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="mt-4 flex items-end gap-[2px]" style={{ height: 160 }}>
                  {data.dailyOrders.map((d, i) => {
                    const pct = (d.count / maxDailyCount) * 100;
                    const barDate = new Date(d.date);
                    const label = `${barDate.getMonth() + 1}/${barDate.getDate()}`;
                    return (
                      <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                        <div
                          className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-600"
                          style={{ height: `${Math.max(pct, 2)}%`, minHeight: 2 }}
                          title={`${label}: ${d.count} orders, $${d.revenue.toFixed(2)}`}
                        />
                        {/* Show label for every Nth bar to avoid clutter */}
                        {(data.dailyOrders.length <= 14 || i % Math.ceil(data.dailyOrders.length / 10) === 0) && (
                          <span className="mt-1 text-[9px] text-slate-400">{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">{t.customers}</h2>
              {data.customers.total === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-3xl font-bold text-slate-900">{data.customers.total}</p>
                      <p className="text-xs text-slate-500">{t.customers}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-emerald-600">{data.customers.new}</p>
                        <p className="text-xs text-slate-500">{t.newCustomers}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-indigo-600">{data.customers.repeat}</p>
                        <p className="text-xs text-slate-500">{t.repeatCustomers}</p>
                      </div>
                    </div>
                  </div>
                  {/* Simple pie-like bar */}
                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(data.customers.new / data.customers.total) * 100}%` }}
                    />
                    <div
                      className="bg-indigo-500 transition-all"
                      style={{ width: `${(data.customers.repeat / data.customers.total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">{t.newCustomers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="text-slate-600">{t.repeatCustomers}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {/* Top products */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">{t.topProducts}</h2>
              {data.topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="mt-3">
                  <div className="grid grid-cols-[1fr_60px_80px] gap-2 text-xs font-medium text-slate-500">
                    <span>{t.product}</span>
                    <span className="text-center">{t.orderCount}</span>
                    <span className="text-right">{t.revenueLabel}</span>
                  </div>
                  <div className="mt-2 divide-y divide-slate-100">
                    {data.topProducts.map((p, i) => (
                      <div key={i} className="grid grid-cols-[1fr_60px_80px] items-center gap-2 py-2.5">
                        <span className="truncate text-sm font-medium text-slate-800">{p.name}</span>
                        <span className="text-center text-sm text-slate-600">{p.orderCount}</span>
                        <span className="text-right text-sm font-medium text-slate-800">${p.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue by status */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">{t.revenueByStatus}</h2>
              {data.revenueByStatus.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t.noData}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {data.revenueByStatus.map((r, i) => {
                    const maxRev = Math.max(...data.revenueByStatus.map((x) => x.revenue), 1);
                    const pct = (r.revenue / maxRev) * 100;
                    const statusColors: Record<string, string> = {
                      new: "bg-blue-500",
                      contacted: "bg-amber-500",
                      completed: "bg-emerald-500",
                    };
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{statusLabel(r.status)}</span>
                          <span className="text-slate-600">
                            {r.count} · ${r.revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${statusColors[r.status] || "bg-slate-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
  value,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
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
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <div className="mt-0.5 flex items-center gap-1">
        <p className="text-xs text-slate-500">{label}</p>
        {trend !== undefined && trend !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
