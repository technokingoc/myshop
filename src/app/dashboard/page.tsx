"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { DashboardShell } from "@/components/dashboard-shell";
import { BarChart3, Package, ShoppingCart, ExternalLink, Store, TrendingUp, Clock, Users } from "lucide-react";

type Seller = { id: number; slug: string; name: string; ownerName?: string };
type CatalogItem = { id: number; status: "Draft" | "Published" };

type SetupData = { storeName: string; storefrontSlug: string };
type SetupPersisted = { step: number; done: boolean; data: SetupData };

const dict = {
  en: { welcome: "Welcome back", storeStats: "Store overview", totalProducts: "Total products", publishedItems: "Published", draftItems: "Drafts", totalViews: "Page views", recentOrders: "Recent orders", noOrders: "No orders yet. Share your storefront to start receiving order intents.", catalogMgmt: "Catalog management", catalogDesc: "Add, edit, or remove products and services from your store.", manageCatalog: "Manage catalog", storefront: "Your storefront", storefrontDesc: "View and share your public store page with customers.", viewStorefront: "View storefront", copyLink: "Copy link", settings: "Settings", settingsDesc: "Update your store identity, business details, and social channels.", editSettings: "Edit settings", notSetup: "Store not configured", notSetupHint: "Complete the store setup first.", goSetup: "Go to setup", linkCopied: "Link copied!" },
  pt: { welcome: "Bem-vindo de volta", storeStats: "Visão geral da loja", totalProducts: "Total de produtos", publishedItems: "Publicados", draftItems: "Rascunhos", totalViews: "Visualizações", recentOrders: "Pedidos recentes", noOrders: "Nenhum pedido ainda. Partilhe a sua loja para começar a receber intenções de compra.", catalogMgmt: "Gestão de catálogo", catalogDesc: "Adicione, edite ou remova produtos e serviços da sua loja.", manageCatalog: "Gerir catálogo", storefront: "A sua loja", storefrontDesc: "Veja e partilhe a página pública da sua loja com clientes.", viewStorefront: "Ver loja", copyLink: "Copiar link", settings: "Configurações", settingsDesc: "Atualize a identidade da loja, dados do negócio e canais sociais.", editSettings: "Editar configurações", notSetup: "Loja não configurada", notSetupHint: "Conclua a configuração da loja primeiro.", goSetup: "Ir para configuração", linkCopied: "Link copiado!" },
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

  useEffect(() => {
    const rawSetup = localStorage.getItem("myshop_setup_v2");
    if (!rawSetup) return setHydrated(true);

    let parsed: SetupPersisted | null = null;
    try { parsed = JSON.parse(rawSetup); setSetup(parsed); } catch { setHydrated(true); return; }

    const slug = parsed?.data?.storefrontSlug;
    if (!slug) return setHydrated(true);

    Promise.all([
      fetch(`/api/sellers/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/catalog?sellerSlug=${slug}`).then((r) => r.json()),
    ]).then(async ([s, c]) => {
      if (s?.id) {
        setSeller(s);
        localStorage.setItem("myshop_seller_id", String(s.id));
        const o = await fetch(`/api/orders?sellerId=${s.id}`).then((r) => r.json());
        if (Array.isArray(o)) setOrdersCount(o.length);
      }
      if (Array.isArray(c)) setCatalog(c);
    }).finally(() => setHydrated(true));
  }, []);

  if (!hydrated) return null;

  if (!setup?.done) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Store className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t.notSetup}</h1>
        <p className="mt-2 text-slate-600">{t.notSetupHint}</p>
        <button onClick={() => router.push("/")} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white">{t.goSetup}</button>
      </main>
    );
  }

  const slug = seller?.slug || setup.data.storefrontSlug || "myshop-demo";
  const storeName = seller?.name || setup.data.storeName;
  const owner = seller?.ownerName || "Seller";
  const storefrontUrl = `/s/${slug}`;
  const fullUrl = `https://myshop-amber.vercel.app${storefrontUrl}`;
  const published = catalog.filter((i) => i.status === "Published").length;
  const drafts = catalog.filter((i) => i.status === "Draft").length;

  const copyStorefrontLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    });
  };

  return (
    <DashboardShell activePage="dashboard">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">{t.welcome}, {owner}</h1><p className="mt-1 text-sm text-slate-600">{storeName} — @{slug}</p></div>
      <section className="mb-8"><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><BarChart3 className="h-4 w-4" />{t.storeStats}</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard icon={Package} label={t.totalProducts} value={String(catalog.length)} /><StatCard icon={TrendingUp} label={t.publishedItems} value={String(published)} /><StatCard icon={Clock} label={t.draftItems} value={String(drafts)} /><StatCard icon={Users} label={t.totalViews} value="—" muted /></div></section>
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShoppingCart className="h-4 w-4" />{t.recentOrders}</h2><p className="mt-3 text-sm text-slate-500">{ordersCount > 0 ? `${ordersCount} ${lang === "pt" ? "pedidos" : "orders"}` : t.noOrders}</p></section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5"><Package className="h-5 w-5 text-indigo-600" /><h3 className="mt-3 font-semibold text-slate-900">{t.catalogMgmt}</h3><p className="mt-1 text-sm text-slate-600">{t.catalogDesc}</p><a href="/#catalog" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white">{t.manageCatalog}</a></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><Store className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 font-semibold text-slate-900">{t.storefront}</h3><p className="mt-1 text-sm text-slate-600">{t.storefrontDesc}</p><div className="mt-4 flex flex-wrap gap-2"><a href={storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white"><ExternalLink className="h-3.5 w-3.5" />{t.viewStorefront}</a><button onClick={copyStorefrontLink} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700">{linkCopied ? t.linkCopied : t.copyLink}</button></div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><Store className="h-5 w-5 text-slate-500" /><h3 className="mt-3 font-semibold text-slate-900">{t.settings}</h3><p className="mt-1 text-sm text-slate-600">{t.settingsDesc}</p><a href="/dashboard/settings" className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700">{t.editSettings}</a></div>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, muted }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; muted?: boolean }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><Icon className="h-4 w-4 text-slate-400" /><p className={`mt-2 text-2xl font-bold ${muted ? "text-slate-400" : "text-slate-900"}`}>{value}</p><p className="mt-0.5 text-xs text-slate-500">{label}</p></div>;
}
