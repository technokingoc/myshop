"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import {
  Store,
  ShoppingBag,
  Share2,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const dict = {
  en: {
    heroBadge: "Built for informal sellers & micro businesses",
    heroTitle: "Your professional storefront, live in minutes",
    heroSub:
      "MyShop helps small sellers create trusted online storefronts, organize products, and share social ordering links — no technical skills required.",
    heroCta: "Get started free",
    heroSecondary: "See pricing",

    vpTitle: "Everything you need to sell online",
    vpSub: "Simple tools designed for small businesses and independent sellers.",
    vp1Title: "Beautiful storefront",
    vp1Desc:
      "Create a professional product catalog with images, descriptions, and pricing. Share your unique link with customers.",
    vp2Title: "Social selling",
    vp2Desc:
      "Connect WhatsApp, Instagram, and Facebook so customers can reach you on the channels they already use.",
    vp3Title: "Quick setup",
    vp3Desc:
      "Three simple steps to configure your store. No coding, no hosting, no complexity. Just your products and your brand.",

    pricingTitle: "Simple, transparent pricing",
    pricingSub: "Start free, upgrade when you're ready.",
    free: "Free",
    freePrice: "$0",
    freePeriod: "forever",
    freeBullets: [
      "1 storefront",
      "Up to 10 products",
      "Social CTA buttons",
      "Shareable link",
    ],
    starter: "Starter",
    starterPrice: "$9",
    starterPeriod: "/ month",
    starterBullets: [
      "1 storefront with custom slug",
      "Up to 50 products/services",
      "Social CTA buttons",
      "PayPal payment link",
      "Priority support",
    ],
    starterBadge: "Popular",
    pro: "Pro",
    proPrice: "$29",
    proPeriod: "/ month",
    proBullets: [
      "Unlimited storefronts",
      "Unlimited products/services",
      "Custom domain support",
      "Analytics dashboard",
      "PayPal + future payment methods",
      "Dedicated support",
    ],
    viewAll: "View all plan details",

    ctaTitle: "Ready to start selling?",
    ctaSub: "Join thousands of small sellers who trust MyShop to power their online presence.",
    ctaBtn: "Create your store",
  },
  pt: {
    heroBadge: "Feito para vendedores informais e micro negócios",
    heroTitle: "A sua loja profissional, online em minutos",
    heroSub:
      "O MyShop ajuda pequenos vendedores a criar vitrines online confiáveis, organizar produtos e partilhar links sociais — sem precisar de conhecimentos técnicos.",
    heroCta: "Começar grátis",
    heroSecondary: "Ver preços",

    vpTitle: "Tudo o que precisa para vender online",
    vpSub: "Ferramentas simples pensadas para pequenos negócios e vendedores independentes.",
    vp1Title: "Vitrine profissional",
    vp1Desc:
      "Crie um catálogo profissional com imagens, descrições e preços. Partilhe o seu link único com os clientes.",
    vp2Title: "Vendas sociais",
    vp2Desc:
      "Conecte WhatsApp, Instagram e Facebook para que os clientes o contactem nos canais que já usam.",
    vp3Title: "Configuração rápida",
    vp3Desc:
      "Três passos simples para configurar a sua loja. Sem código, sem hosting, sem complexidade. Apenas os seus produtos e a sua marca.",

    pricingTitle: "Preços simples e transparentes",
    pricingSub: "Comece grátis, faça upgrade quando estiver pronto.",
    free: "Grátis",
    freePrice: "$0",
    freePeriod: "para sempre",
    freeBullets: [
      "1 vitrine",
      "Até 10 produtos",
      "Botões CTA sociais",
      "Link partilhável",
    ],
    starter: "Inicial",
    starterPrice: "$9",
    starterPeriod: "/ mês",
    starterBullets: [
      "1 vitrine com slug personalizado",
      "Até 50 produtos/serviços",
      "Botões CTA sociais",
      "Link de pagamento PayPal",
      "Suporte prioritário",
    ],
    starterBadge: "Popular",
    pro: "Pro",
    proPrice: "$29",
    proPeriod: "/ mês",
    proBullets: [
      "Vitrines ilimitadas",
      "Produtos/serviços ilimitados",
      "Suporte a domínio próprio",
      "Painel de analytics",
      "PayPal + métodos futuros",
      "Suporte dedicado",
    ],
    viewAll: "Ver todos os detalhes dos planos",

    ctaTitle: "Pronto para começar a vender?",
    ctaSub: "Junte-se a milhares de pequenos vendedores que confiam no MyShop para a sua presença online.",
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
    {
      name: t.free,
      price: t.freePrice,
      period: t.freePeriod,
      bullets: t.freeBullets,
      badge: null,
      accent: false,
    },
    {
      name: t.starter,
      price: t.starterPrice,
      period: t.starterPeriod,
      bullets: t.starterBullets,
      badge: t.starterBadge,
      accent: true,
    },
    {
      name: t.pro,
      price: t.proPrice,
      period: t.proPeriod,
      bullets: t.proBullets,
      badge: null,
      accent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:text-sm">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            {t.heroBadge}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {t.heroTitle}
          </h1>
          <p className="mt-5 text-base text-slate-600 sm:text-lg">
            {t.heroSub}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800"
            >
              {t.heroCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium transition hover:bg-slate-50"
            >
              {t.heroSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.vpTitle}</h2>
            <p className="mt-2 text-slate-600">{t.vpSub}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-3">
                  <vp.icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="font-semibold">{vp.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{vp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.pricingTitle}</h2>
            <p className="mt-2 text-slate-600">{t.pricingSub}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.accent
                    ? "border-slate-900 bg-white shadow-md"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-slate-500">{plan.period}</span>
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/setup"
                  className={`mt-6 block w-full rounded-lg px-4 py-2 text-center text-sm font-semibold transition ${
                    plan.accent
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.heroCta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/pricing"
              className="text-sm font-medium text-indigo-600 underline underline-offset-2"
            >
              {t.viewAll} →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.ctaTitle}</h2>
          <p className="mt-3 text-slate-600">{t.ctaSub}</p>
          <Link
            href="/setup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            {t.ctaBtn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
