"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { StoreCard } from "@/components/store-card";
import { Footer } from "@/components/footer";
import {
  ArrowRight,
  UserPlus,
  Package,
  Rocket,
  Store,
  ShoppingBag,
  ClipboardCheck,
  Users,
} from "lucide-react";

const dict = {
  en: {
    heroTitle: "Your store, online in minutes",
    heroSub: "Create a professional storefront, showcase products, and connect with customers — no technical skills needed.",
    heroCta: "Create your store",
    heroBrowse: "Browse stores",
    featuredTitle: "Featured Stores",
    featuredSub: "Discover stores already thriving on MyShop",
    howTitle: "How it works",
    howSub: "Three simple steps to start selling",
    step1Title: "Create your account",
    step1Desc: "Sign up in seconds with just your name and email.",
    step2Title: "Add your products",
    step2Desc: "Upload photos, set prices, and organize your catalog.",
    step3Title: "Start selling",
    step3Desc: "Share your store link and receive orders instantly.",
    statsTitle: "Trusted by sellers everywhere",
    statSellers: "Sellers",
    statProducts: "Products",
    statOrders: "Orders fulfilled",
    viewAll: "View all stores",
    noStores: "Be the first to create a store!",
  },
  pt: {
    heroTitle: "Sua loja, online em minutos",
    heroSub: "Crie uma vitrine profissional, mostre produtos e conecte-se com clientes — sem precisar de habilidades técnicas.",
    heroCta: "Criar sua loja",
    heroBrowse: "Explorar lojas",
    featuredTitle: "Lojas em Destaque",
    featuredSub: "Descubra lojas que já prosperam no MyShop",
    howTitle: "Como funciona",
    howSub: "Três passos simples para começar a vender",
    step1Title: "Crie sua conta",
    step1Desc: "Cadastre-se em segundos com seu nome e email.",
    step2Title: "Adicione produtos",
    step2Desc: "Envie fotos, defina preços e organize o catálogo.",
    step3Title: "Comece a vender",
    step3Desc: "Compartilhe o link da loja e receba pedidos instantaneamente.",
    statsTitle: "Confiado por vendedores em todo lugar",
    statSellers: "Vendedores",
    statProducts: "Produtos",
    statOrders: "Pedidos realizados",
    viewAll: "Ver todas as lojas",
    noStores: "Seja o primeiro a criar uma loja!",
  },
};

interface StoreData {
  slug: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessType?: string;
  productCount: number;
  avgRating: number;
  reviewCount: number;
}

interface Stats {
  sellers: number;
  products: number;
  orders: number;
}

export default function HomePage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/stores?limit=6")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setStores(d.stores || []);
          setCategories(d.categories || []);
        }
      })
      .catch(() => {});

    fetch("/api/stores/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  const steps = [
    { icon: UserPlus, title: t.step1Title, desc: t.step1Desc },
    { icon: Package, title: t.step2Title, desc: t.step2Desc },
    { icon: Rocket, title: t.step3Title, desc: t.step3Desc },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {t.heroSub}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="ui-btn ui-btn-primary"
            >
              {t.heroCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#stores"
              className="ui-btn ui-btn-secondary"
            >
              {t.heroBrowse}
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (stats.sellers > 0 || stats.products > 0) && (
        <section className="border-y border-slate-200/60 bg-slate-50/50">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 py-6 sm:gap-16">
            {[
              { val: stats.sellers, label: t.statSellers, icon: Users },
              { val: stats.products, label: t.statProducts, icon: ShoppingBag },
              { val: stats.orders, label: t.statOrders, icon: ClipboardCheck },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 text-center">
                <s.icon className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-xl font-bold text-slate-900">{s.val}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className="ui-section">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="ui-h2">{t.howTitle}</h2>
            <p className="ui-lead mt-2">{t.howSub}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="mb-1 block text-xs font-semibold text-indigo-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <section id="stores" className="ui-section pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="ui-h2">{t.featuredTitle}</h2>
            <p className="ui-lead mt-2">{t.featuredSub}</p>
          </div>

          {/* Category pills */}
          {categories.length > 1 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/stores?category=${encodeURIComponent(cat!)}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {stores.length > 0 ? (
            <>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard key={store.slug} store={store} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/stores"
                  className="ui-btn ui-btn-secondary"
                >
                  {t.viewAll}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-10 text-center">
              <Store className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">{t.noStores}</p>
              <Link href="/register" className="ui-btn ui-btn-primary mt-4">
                {t.heroCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="ui-section pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="ui-panel px-6 py-12 text-center sm:px-10">
            <h2 className="ui-h2">{lang === "pt" ? "Pronto para começar a vender?" : "Ready to start selling?"}</h2>
            <p className="ui-lead mx-auto mt-3 max-w-2xl">
              {lang === "pt"
                ? "Junte-se a vendedores que querem uma presença online mais profissional."
                : "Join sellers who want a cleaner, more professional online presence."}
            </p>
            <Link href="/register" className="ui-btn ui-btn-primary mt-8">
              {t.heroCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
