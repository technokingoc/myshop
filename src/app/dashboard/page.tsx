"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { fetchSession, type AuthSession } from "@/lib/auth";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { FAB } from "@/components/fab";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  Plus,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  Store,
} from "lucide-react";

type DashboardStats = {
  orderCount: number;
  revenue: number;
  productCount: number;
  publishedCount: number;
  storeViews: number;
  plan: string;
  hasLogo: boolean;
  hasBanner: boolean;
  recentOrders: {
    id: number;
    customerName: string;
    customerContact: string;
    message: string;
    itemId: number | null;
    status: string;
    createdAt: string;
    itemName: string | null;
    itemPrice: string | null;
  }[];
};

const dict = {
  en: {
    welcome: "Welcome back",
    overview: "Business overview",
    totalOrders: "Total Orders",
    revenue: "Revenue",
    activeProducts: "Active Products",
    storeViews: "Store Views",
    planBadge: "Plan",
    upgrade: "Upgrade",
    recentOrders: "Recent Orders",
    noOrders: "No orders yet. Share your storefront to start receiving orders.",
    customer: "Customer",
    item: "Item",
    status: "Status",
    date: "Date",
    viewAll: "View all orders",
    quickActions: "Quick Actions",
    addProduct: "Add Product",
    viewStorefront: "View Storefront",
    exportOrders: "Export Orders",
    storeHealth: "Store Health",
    profileComplete: "Profile complete",
    hasProducts: "Has published products",
    hasOrders: "Has received orders",
    complete: "Complete",
    incomplete: "Incomplete",
    healthGood: "Your store is fully set up!",
    healthNeeds: "Complete these to improve your store",
    loading: "Loading dashboard...",
    notSetup: "Store not configured",
    notSetupHint: "Log in to access your dashboard.",
    goLogin: "Go to login",
    statusNew: "New",
    statusContacted: "Contacted",
    statusCompleted: "Completed",
    na: "N/A",
  },
  pt: {
    welcome: "Bem-vindo de volta",
    overview: "Visão geral do negócio",
    totalOrders: "Total de Pedidos",
    revenue: "Receita",
    activeProducts: "Produtos Activos",
    storeViews: "Visitas à Loja",
    planBadge: "Plano",
    upgrade: "Upgrade",
    recentOrders: "Pedidos Recentes",
    noOrders: "Ainda sem pedidos. Partilhe a sua loja para começar a receber pedidos.",
    customer: "Cliente",
    item: "Item",
    status: "Estado",
    date: "Data",
    viewAll: "Ver todos os pedidos",
    quickActions: "Acções Rápidas",
    addProduct: "Adicionar Produto",
    viewStorefront: "Ver Loja",
    exportOrders: "Exportar Pedidos",
    storeHealth: "Saúde da Loja",
    profileComplete: "Perfil completo",
    hasProducts: "Tem produtos publicados",
    hasOrders: "Recebeu pedidos",
    complete: "Concluído",
    incomplete: "Pendente",
    healthGood: "A sua loja está totalmente configurada!",
    healthNeeds: "Complete estes itens para melhorar a sua loja",
    loading: "A carregar painel...",
    notSetup: "Loja não configurada",
    notSetupHint: "Faça login para aceder ao seu painel.",
    goLogin: "Ir para login",
    statusNew: "Novo",
    statusContacted: "Contactado",
    statusCompleted: "Concluído",
    na: "N/D",
  },
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

export default function DashboardPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession().then(async (s) => {
      setSession(s);
      if (s) {
        try {
          const res = await fetch("/api/dashboard/stats", { credentials: "include" });
          if (res.ok) setStats(await res.json());
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Store className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">{t.notSetup}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.notSetupHint}</p>
        <Link href="/login" className="ui-btn ui-btn-primary mt-6 inline-flex">
          {t.goLogin}
        </Link>
      </div>
    );
  }

  const slug = session.sellerSlug;
  const storeName = session.storeName;
  const data = stats ?? {
    orderCount: 0,
    revenue: 0,
    productCount: 0,
    publishedCount: 0,
    storeViews: 0,
    plan: "free",
    hasLogo: false,
    hasBanner: false,
    recentOrders: [],
  };

  const healthChecks = [
    { label: t.profileComplete, done: Boolean(storeName && slug) },
    { label: t.hasProducts, done: data.publishedCount > 0 },
    { label: t.hasOrders, done: data.orderCount > 0 },
  ];
  const healthScore = healthChecks.filter((h) => h.done).length;
  const allHealthy = healthScore === healthChecks.length;

  const statusLabel = (s: string) => {
    if (s === "new") return t.statusNew;
    if (s === "contacted") return t.statusContacted;
    if (s === "completed") return t.statusCompleted;
    return s;
  };

  const showOnboarding = !data.hasLogo || !data.hasBanner || data.publishedCount === 0 || data.orderCount === 0;

  return (
    <>
      {/* Onboarding Checklist */}
      {showOnboarding && (
        <OnboardingChecklist
          data={{
            hasLogo: Boolean(data.hasLogo),
            hasBanner: Boolean(data.hasBanner),
            productCount: data.productCount,
            publishedCount: data.publishedCount,
            orderCount: data.orderCount,
          }}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.welcome}, {storeName} 👋
          </h1>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            data.plan === "business" ? "bg-violet-100 text-violet-700" : data.plan === "pro" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
          }`}>
            {(data.plan || "free").charAt(0).toUpperCase() + (data.plan || "free").slice(1)} {t.planBadge}
          </span>
          {data.plan === "free" && (
            <Link href="/pricing" className="text-xs font-medium text-green-600 hover:text-green-700">
              {t.upgrade} →
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t.overview}</p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShoppingCart} label={t.totalOrders} value={String(data.orderCount)} color="text-blue-600 bg-blue-50" />
        <StatCard icon={DollarSign} label={t.revenue} value={`$${data.revenue.toFixed(2)}`} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={Package} label={t.activeProducts} value={String(data.publishedCount)} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={Eye} label={t.storeViews} value={data.storeViews > 0 ? String(data.storeViews) : "—"} color="text-slate-500 bg-slate-50" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{t.recentOrders}</h2>
            <Link href="/dashboard/orders" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              {t.viewAll} →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t.noOrders}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {order.customerName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {order.itemName || t.na} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusColors[order.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Health */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">{t.storeHealth}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {allHealthy ? t.healthGood : t.healthNeeds}
          </p>
          <div className="mt-3 space-y-2">
            {healthChecks.map((check) => (
              <div
                key={check.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  {check.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-slate-700">{check.label}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    check.done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {check.done ? t.complete : t.incomplete}
                </span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(healthScore / healthChecks.length) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {healthScore}/{healthChecks.length}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/dashboard/catalog"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          <Plus className="h-4 w-4 text-indigo-600" />
          {t.addProduct}
        </Link>
        <a
          href={`/s/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          <ExternalLink className="h-4 w-4 text-indigo-600" />
          {t.viewStorefront}
        </a>
        <Link
          href="/api/orders/export.csv"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-green-200 hover:bg-green-50/50"
        >
          <Download className="h-4 w-4 text-green-600" />
          {t.exportOrders}
        </Link>
      </div>
      
      {/* FAB for mobile */}
      <FAB href="/dashboard/catalog" icon={Plus}>
        Add Product
      </FAB>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  const [iconColor, bgColor] = color.split(" ");
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-300">
      <div className="flex items-center justify-between">
        <div className={`inline-flex rounded-xl p-3 ${bgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}
