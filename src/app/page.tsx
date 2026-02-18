"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Store, Share2, Zap, ArrowRight, Check, Sparkles } from "lucide-react";

const dict = {
  en: {
    heroBadge: "Built for informal sellers & micro businesses",
    heroTitle: "A premium storefront presence, ready in minutes",
    heroSub:
      "MyShop helps small sellers build trusted online storefronts, organize products, and capture order intent with a clean, professional customer experience.",
    heroCta: "Get started free",
    heroSecondary: "See pricing",
    vpTitle: "Everything you need to sell online",
    vpSub: "Simple tools with professional execution.",
    vp1Title: "Premium storefront",
    vp1Desc: "Launch a clean product catalog with images, descriptions, pricing and clear ordering actions.",
    vp2Title: "Social-first conversion",
    vp2Desc: "Connect WhatsApp, Instagram and Facebook so buyers can contact you instantly.",
    vp3Title: "Fast onboarding",
    vp3Desc: "Set up your store in guided steps without technical complexity.",
    pricingTitle: "Simple, transparent pricing",
    pricingSub: "Start free. Upgrade only when growth demands it.",
    free: "Free",
    freePrice: "$0",
    freePeriod: "forever",
    freeBullets: ["1 storefront", "Up to 10 products", "Social CTA buttons", "Shareable link"],
    starter: "Starter",
    starterPrice: "$9",
    starterPeriod: "/ month",
    starterBullets: ["Up to 50 products/services", "Custom slug", "PayPal link", "Priority support"],
    starterBadge: "Popular",
    pro: "Pro",
    proPrice: "$29",
    proPeriod: "/ month",
    proBullets: ["Unlimited storefronts", "Unlimited products/services", "Custom domain", "Analytics + dedicated support"],
    ctaTitle: "Ready to start selling?",
    ctaSub: "Join sellers who want a cleaner, more trusted online presence.",
    ctaBtn: "Create your store",
  },
  pt: {
    heroBadge: "Feito para vendedores informais e micro negócios",
    heroTitle: "Uma presença premium para a sua loja, pronta em minutos",
    heroSub:
      "O MyShop ajuda pequenos vendedores a criar vitrines online confiáveis, organizar produtos e captar intenções de compra com uma experiência profissional.",
    heroCta: "Começar grátis",
    heroSecondary: "Ver preços",
    vpTitle: "Tudo o que precisa para vender online",
    vpSub: "Ferramentas simples com execução profissional.",
    vp1Title: "Vitrine premium",
    vp1Desc: "Lance um catálogo limpo com imagens, descrições, preços e ações claras de pedido.",
    vp2Title: "Conversão social",
    vp2Desc: "Conecte WhatsApp, Instagram e Facebook para contacto imediato dos clientes.",
    vp3Title: "Onboarding rápido",
    vp3Desc: "Configure a sua loja em passos guiados sem complexidade técnica.",
    pricingTitle: "Preços simples e transparentes",
    pricingSub: "Comece grátis. Faça upgrade apenas quando crescer.",
    free: "Grátis",
    freePrice: "$0",
    freePeriod: "para sempre",
    freeBullets: ["1 vitrine", "Até 10 produtos", "Botões CTA sociais", "Link partilhável"],
    starter: "Inicial",
    starterPrice: "$9",
    starterPeriod: "/ mês",
    starterBullets: ["Até 50 produtos/serviços", "Slug personalizado", "Link PayPal", "Suporte prioritário"],
    starterBadge: "Popular",
    pro: "Pro",
    proPrice: "$29",
    proPeriod: "/ mês",
    proBullets: ["Vitrines ilimitadas", "Produtos/serviços ilimitados", "Domínio próprio", "Analytics + suporte dedicado"],
    ctaTitle: "Pronto para começar a vender?",
    ctaSub: "Junte-se a vendedores que querem uma presença online mais confiável.",
    ctaBtn: "Criar a sua loja",
  },
};

export default function LandingPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  const valueProps = [
    { icon: Store, title: t.vp1Title, desc: t.vp1Desc },
    { icon: Share2, title: t.vp2Title, desc: t.vp2Desc },
    { icon: Zap, title: t.vp3Title, desc: t.vp3Desc },
  ];

  const plans = [
    { name: t.free, price: t.freePrice, period: t.freePeriod, bullets: t.freeBullets, badge: null, accent: false },
    { name: t.starter, price: t.starterPrice, period: t.starterPeriod, bullets: t.starterBullets, badge: t.starterBadge, accent: true },
    { name: t.pro, price: t.proPrice, period: t.proPeriod, bullets: t.proBullets, badge: null, accent: false },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <section className="ui-section">
        <div className="ui-container">
          <div className="ui-panel mx-auto max-w-5xl px-6 py-14 text-center sm:px-10 sm:py-20">
            <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t.heroBadge}
            </p>
            <h1 className="ui-h1 mx-auto max-w-4xl">{t.heroTitle}</h1>
            <p className="ui-lead mx-auto mt-6 max-w-2xl">{t.heroSub}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/setup" className="ui-btn ui-btn-primary">{t.heroCta}<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className="ui-btn ui-btn-secondary">{t.heroSecondary}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ui-section pt-0">
        <div className="ui-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="ui-h2">{t.vpTitle}</h2>
            <p className="ui-lead mt-3">{t.vpSub}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {valueProps.map((vp) => (
              <article key={vp.title} className="ui-card p-6">
                <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-3"><vp.icon className="h-5 w-5 text-slate-700" /></div>
                <h3 className="text-base font-semibold text-slate-900">{vp.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{vp.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section pt-0">
        <div className="ui-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="ui-h2">{t.pricingTitle}</h2>
            <p className="ui-lead mt-3">{t.pricingSub}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative rounded-2xl border p-6 ${plan.accent ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white"}`}>
                {plan.badge && <span className="absolute -top-3 left-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{plan.badge}</span>}
                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2"><span className="text-3xl font-semibold text-slate-900">{plan.price}</span><span className="ml-1 text-sm text-slate-500">{plan.period}</span></p>
                <ul className="mt-5 space-y-2.5">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />{b}</li>
                  ))}
                </ul>
                <Link href="/setup" className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ${plan.accent ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}>{t.heroCta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-section pt-0">
        <div className="ui-container">
          <div className="ui-panel mx-auto max-w-4xl px-6 py-12 text-center sm:px-10">
            <h2 className="ui-h2">{t.ctaTitle}</h2>
            <p className="ui-lead mx-auto mt-3 max-w-2xl">{t.ctaSub}</p>
            <Link href="/setup" className="ui-btn ui-btn-primary mt-8">{t.ctaBtn}<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
