"use client";

import { useLanguage } from "@/lib/language";
import { DashboardShell } from "@/components/dashboard-shell";
import { BarChart3, Eye, ShoppingCart, TrendingUp, Clock } from "lucide-react";

const dict = {
  en: {
    title: "Analytics",
    subtitle: "Track your store performance and customer engagement.",
    comingSoon: "Coming soon",
    comingSoonDesc: "Full analytics with charts and insights are on the way. For now, here's a preview of what's coming.",
    views: "Store views",
    orders: "Total orders",
    conversion: "Conversion rate",
    returning: "Returning visitors",
    viewsValue: "—",
    ordersValue: "—",
    conversionValue: "— %",
    returningValue: "—",
    placeholder: "Real-time data will appear here once analytics tracking is enabled.",
  },
  pt: {
    title: "Análises",
    subtitle: "Acompanhe o desempenho da sua loja e o envolvimento dos clientes.",
    comingSoon: "Em breve",
    comingSoonDesc: "Análises completas com gráficos e insights estão a caminho. Por agora, veja uma pré-visualização.",
    views: "Visualizações da loja",
    orders: "Total de pedidos",
    conversion: "Taxa de conversão",
    returning: "Visitantes recorrentes",
    viewsValue: "—",
    ordersValue: "—",
    conversionValue: "— %",
    returningValue: "—",
    placeholder: "Dados em tempo real aparecerão aqui quando o rastreamento de análises estiver ativado.",
  },
};

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];

  const cards = [
    { label: t.views, value: t.viewsValue, icon: Eye, color: "text-blue-600" },
    { label: t.orders, value: t.ordersValue, icon: ShoppingCart, color: "text-emerald-600" },
    { label: t.conversion, value: t.conversionValue, icon: TrendingUp, color: "text-amber-600" },
    { label: t.returning, value: t.returningValue, icon: BarChart3, color: "text-indigo-600" },
  ];

  return (
    <DashboardShell activePage="analytics">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">{t.comingSoon}</span>
        </div>
        <p className="mt-1 text-sm text-amber-700">{t.comingSoonDesc}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <card.icon className={`h-5 w-5 ${card.color}`} />
            <p className="mt-3 text-2xl font-bold text-slate-400">{card.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{t.placeholder}</p>
      </div>
    </DashboardShell>
  );
}
