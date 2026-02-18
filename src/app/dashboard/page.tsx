"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { DbMigrationGuard } from "@/components/db-migration-guard";
import {
  Package,
  ShoppingCart,
  ExternalLink,
  Store,
  TrendingUp,
  Clock,
  Users,
  CheckSquare,
  Database,
  ShieldAlert,
  ArrowRight,
  TriangleAlert,
  X,
  Compass,
  Sparkles,
  BookOpen,
} from "lucide-react";

type Seller = { id: number; slug: string; name: string; ownerName?: string };
type CatalogItem = { id: number; status: "Draft" | "Published" };
type DbHealth = {
  ok: boolean;
  connected: boolean;
  missingTables: string[];
  errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY";
  suggestion?: string;
  checkedAt?: string;
};

type SetupData = {
  storeName: string;
  storefrontSlug: string;
  ownerName?: string;
  paymentLink?: string;
};
type SetupPersisted = { step: number; done: boolean; data: SetupData };

const dict = {
  en: {
    hello: "Hello",
    subtitle: "Here's a clean view of your store operations and next best actions.",
    totalProducts: "Total products",
    publishedItems: "Published",
    draftItems: "Drafts",
    totalViews: "Page views",
    notSetup: "Store not configured",
    notSetupHint: "Complete the store setup first.",
    goSetup: "Go to setup",
    linkCopied: "Link copied!",
    pendingTitle: "Pending setup tasks",
    pendingSubtitle: "Finish these to unlock a complete storefront experience.",
    checklistDone: "Done",
    checklistTodo: "Pending",
    checklistStore: "Store profile completed",
    checklistCatalog: "At least one published catalog item",
    checklistPayment: "Payment link configured",
    thingsToDo: "Things to do",
    quickTour: "Take a quick tour",
    quickTourHint: "Explore key areas and keep your storefront sharp.",
    openOrders: "Open orders",
    openCatalog: "Open catalog",
    openSettings: "Open settings",
    viewStorefront: "View storefront",
    copyLink: "Copy link",
    discoverTitle: "Discover features",
    discoverSub: "Lightweight improvements that make your seller workflow smoother.",
    dbPanelTitle: "Database diagnostics",
    dbHealthy: "All critical tables are available.",
    dbIssue: "There is a database readiness issue affecting operations.",
    dbMissing: "Missing tables",
    dbSuggestion: "Suggested action",
    cards: {
      analytics: {
        title: "Track performance",
        desc: "Review trends and spot what customers engage with the most.",
        cta: "Go to analytics",
      },
      trust: {
        title: "Improve trust signals",
        desc: "Add better product descriptions and images to improve conversion.",
        cta: "Update catalog",
      },
      response: {
        title: "Respond faster",
        desc: "Keep response times low by checking notifications and order notes daily.",
        cta: "Open orders",
      },
    },
  },
  pt: {
    hello: "Olá",
    subtitle: "Aqui está uma visão limpa das operações da sua loja e próximos passos.",
    totalProducts: "Total de produtos",
    publishedItems: "Publicados",
    draftItems: "Rascunhos",
    totalViews: "Visualizações",
    notSetup: "Loja não configurada",
    notSetupHint: "Conclua a configuração da loja primeiro.",
    goSetup: "Ir para configuração",
    linkCopied: "Link copiado!",
    pendingTitle: "Tarefas pendentes de configuração",
    pendingSubtitle: "Conclua estas tarefas para desbloquear uma experiência completa da loja.",
    checklistDone: "Concluído",
    checklistTodo: "Pendente",
    checklistStore: "Perfil da loja concluído",
    checklistCatalog: "Pelo menos um item do catálogo publicado",
    checklistPayment: "Link de pagamento configurado",
    thingsToDo: "Coisas para fazer",
    quickTour: "Faça um tour rápido",
    quickTourHint: "Explore as áreas principais e mantenha a sua loja afiada.",
    openOrders: "Abrir pedidos",
    openCatalog: "Abrir catálogo",
    openSettings: "Abrir configurações",
    viewStorefront: "Ver loja",
    copyLink: "Copiar link",
    discoverTitle: "Descobrir funcionalidades",
    discoverSub: "Melhorias leves que tornam o fluxo do vendedor mais eficiente.",
    dbPanelTitle: "Diagnóstico da base de dados",
    dbHealthy: "Todas as tabelas críticas estão disponíveis.",
    dbIssue: "Existe um problema de prontidão da base de dados que afeta operações.",
    dbMissing: "Tabelas em falta",
    dbSuggestion: "Ação sugerida",
    cards: {
      analytics: {
        title: "Acompanhar desempenho",
        desc: "Veja tendências e identifique o que os clientes mais procuram.",
        cta: "Ir para análises",
      },
      trust: {
        title: "Melhorar sinais de confiança",
        desc: "Adicione melhores descrições e imagens para aumentar conversão.",
        cta: "Atualizar catálogo",
      },
      response: {
        title: "Responder mais rápido",
        desc: "Mantenha tempos de resposta baixos verificando notificações diariamente.",
        cta: "Abrir pedidos",
      },
    },
  },
};

export default function DashboardPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const t = useMemo(() => dict[lang], [lang]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    const rawSetup = localStorage.getItem("myshop_setup_v2");
    if (!rawSetup) {
      setHydrated(true);
      return;
    }

    let parsed: SetupPersisted | null = null;
    try {
      parsed = JSON.parse(rawSetup);
      setSetup(parsed);
    } catch {
      setHydrated(true);
      return;
    }

    const health = await fetch("/api/health/db").then((r) => r.json()).catch(() => null);
    setDbHealth(health);

    const slug = parsed?.data?.storefrontSlug;
    if (!slug || (health && !health.ok)) {
      setHydrated(true);
      return;
    }

    Promise.all([
      fetch(`/api/sellers/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/catalog?sellerSlug=${slug}`).then((r) => r.json()),
    ])
      .then(async ([s, c]) => {
        if (s?.id) {
          setSeller(s);
          localStorage.setItem("myshop_seller_id", String(s.id));
          const o = await fetch(`/api/orders?sellerId=${s.id}`).then((r) => r.json());
          if (Array.isArray(o)) setOrdersCount(o.length);
        }
        if (Array.isArray(c)) setCatalog(c);
      })
      .finally(() => setHydrated(true));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!hydrated) return null;

  if (!setup?.done) {
    return (
      <main className="shell-empty">
        <div className="shell-empty-card">
          <Store className="shell-empty-icon" />
          <h1 className="shell-empty-title">{t.notSetup}</h1>
          <p className="shell-empty-subtitle">{t.notSetupHint}</p>
          <button onClick={() => router.push("/")} className="ui-btn ui-btn-primary shell-empty-cta">
            {t.goSetup}
          </button>
        </div>
      </main>
    );
  }

  const slug = seller?.slug || setup.data.storefrontSlug || "myshop-demo";
  const owner = seller?.ownerName || setup.data.ownerName || "Seller";
  const storefrontUrl = `/s/${slug}`;
  const fullUrl = `https://myshop-amber.vercel.app${storefrontUrl}`;
  const published = catalog.filter((i) => i.status === "Published").length;
  const drafts = catalog.filter((i) => i.status === "Draft").length;

  const checklist = [
    { key: "store", label: t.checklistStore, done: Boolean(setup?.data?.storeName && setup?.data?.storefrontSlug) },
    { key: "catalog", label: t.checklistCatalog, done: published > 0 },
    { key: "payment", label: t.checklistPayment, done: Boolean(setup?.data?.paymentLink) },
  ];

  const pendingCount = checklist.filter((i) => !i.done).length;

  const copyStorefrontLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    });
  };

  const discoveryCards = [
    { key: "analytics", icon: TrendingUp, ...t.cards.analytics, href: "/dashboard/analytics" },
    { key: "trust", icon: Sparkles, ...t.cards.trust, href: "/dashboard/catalog" },
    { key: "response", icon: BookOpen, ...t.cards.response, href: "/dashboard/orders" },
  ].filter((card) => !dismissed.includes(card.key));

  return (
    <>
      <DbMigrationGuard health={dbHealth} onRetry={fetchDashboardData} />

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t.hello}, {owner} 👋</h1>
        <p className="mt-2 text-sm text-slate-600">{t.subtitle}</p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label={t.totalProducts} value={String(catalog.length)} />
        <StatCard icon={TrendingUp} label={t.publishedItems} value={String(published)} />
        <StatCard icon={Clock} label={t.draftItems} value={String(drafts)} />
        <StatCard icon={Users} label={t.totalViews} value="—" muted />
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3.5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.pendingTitle} ({pendingCount})</p>
            <p className="mt-1 text-sm text-slate-600">{t.pendingSubtitle}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900">{t.thingsToDo}</h2>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.done ? t.checklistDone : t.checklistTodo}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">{t.quickTour}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.quickTourHint}</p>
          <div className="mt-4 grid gap-2">
            <Link href="/dashboard/orders" className="inline-flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{t.openOrders}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard/catalog" className="inline-flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{t.openCatalog}<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard/settings" className="inline-flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{t.openSettings}<ArrowRight className="h-4 w-4" /></Link>
            <a href={storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{t.viewStorefront}<ExternalLink className="h-4 w-4" /></a>
            <button onClick={copyStorefrontLink} className="inline-flex h-10 items-center justify-between rounded-md border border-transparent px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">{linkCopied ? t.linkCopied : t.copyLink}<Compass className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-slate-900">{t.discoverTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.discoverSub}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {discoveryCards.map((card) => (
            <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <card.icon className="h-5 w-5 text-blue-600" />
                <button onClick={() => setDismissed((prev) => [...prev, card.key])} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Dismiss card">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{card.desc}</p>
              <Link href={card.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-slate-900">
                {card.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {dbHealth && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Database className="h-4 w-4" />
            {t.dbPanelTitle}
          </h2>
          <div className={`mt-3 rounded-lg border p-3 text-sm ${dbHealth.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="flex items-center gap-2 font-medium">
              {dbHealth.ok ? <CheckSquare className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              {dbHealth.ok ? t.dbHealthy : t.dbIssue}
            </p>
            {!dbHealth.ok && (
              <>
                <p className="mt-2"><span className="font-semibold">{t.dbMissing}:</span> {dbHealth.missingTables.join(", ") || "-"}</p>
                <p className="mt-1"><span className="font-semibold">{t.dbSuggestion}:</span> {dbHealth.suggestion || "-"}</p>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function StatCard({ icon: Icon, label, value, muted }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className={`mt-2 text-2xl font-semibold ${muted ? "text-slate-400" : "text-slate-900"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
