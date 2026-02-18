"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Check, X, ArrowRight } from "lucide-react";

const dict = {
  en: {
    title: "Pricing",
    subtitle: "Choose the plan that fits your business. Upgrade or downgrade anytime.",
    paypalNote:
      "PayPal checkout opens an external PayPal page. MyShop does not process or store card details.",
    getStarted: "Get started",
    contactSales: "Contact sales",
    freeName: "Free",
    freePrice: "$0",
    freePeriod: "forever",
    freeDesc: "Perfect for trying out MyShop with a small catalog.",
    starterName: "Starter",
    starterPrice: "$9",
    starterPeriod: "/ month",
    starterDesc: "For sellers ready to grow their online presence.",
    starterBadge: "Most popular",
    proName: "Pro",
    proPrice: "$29",
    proPeriod: "/ month",
    proDesc: "For established sellers who need full power.",
    comparisonTitle: "Feature comparison",
    features: {
      storefronts: "Storefronts",
      products: "Products / services",
      customSlug: "Custom slug",
      socialButtons: "Social CTA buttons",
      shareableLink: "Shareable link",
      paypal: "PayPal payment link",
      customDomain: "Custom domain",
      analytics: "Analytics dashboard",
      prioritySupport: "Priority support",
      dedicatedSupport: "Dedicated support",
    },
    freeFeatures: {
      storefronts: "1",
      products: "Up to 10",
      customSlug: false,
      socialButtons: true,
      shareableLink: true,
      paypal: false,
      customDomain: false,
      analytics: false,
      prioritySupport: false,
      dedicatedSupport: false,
    },
    starterFeatures: {
      storefronts: "1",
      products: "Up to 50",
      customSlug: true,
      socialButtons: true,
      shareableLink: true,
      paypal: true,
      customDomain: false,
      analytics: false,
      prioritySupport: true,
      dedicatedSupport: false,
    },
    proFeatures: {
      storefronts: "Unlimited",
      products: "Unlimited",
      customSlug: true,
      socialButtons: true,
      shareableLink: true,
      paypal: true,
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      dedicatedSupport: true,
    },
    ctaTitle: "Ready to start?",
    ctaSub: "Create your store in minutes. No credit card required for the free plan.",
    ctaBtn: "Create your store",
  },
  pt: {
    title: "Preços",
    subtitle: "Escolha o plano ideal para o seu negócio. Mude a qualquer momento.",
    paypalNote:
      "O checkout PayPal abre numa página externa do PayPal. O MyShop não processa nem guarda dados de cartão.",
    getStarted: "Começar",
    contactSales: "Contactar vendas",
    freeName: "Grátis",
    freePrice: "$0",
    freePeriod: "para sempre",
    freeDesc: "Perfeito para experimentar o MyShop com um catálogo pequeno.",
    starterName: "Inicial",
    starterPrice: "$9",
    starterPeriod: "/ mês",
    starterDesc: "Para vendedores prontos a crescer online.",
    starterBadge: "Mais popular",
    proName: "Pro",
    proPrice: "$29",
    proPeriod: "/ mês",
    proDesc: "Para vendedores estabelecidos que precisam de tudo.",
    comparisonTitle: "Comparação de funcionalidades",
    features: {
      storefronts: "Vitrines",
      products: "Produtos / serviços",
      customSlug: "Slug personalizado",
      socialButtons: "Botões CTA sociais",
      shareableLink: "Link partilhável",
      paypal: "Link de pagamento PayPal",
      customDomain: "Domínio próprio",
      analytics: "Painel de analytics",
      prioritySupport: "Suporte prioritário",
      dedicatedSupport: "Suporte dedicado",
    },
    freeFeatures: {
      storefronts: "1",
      products: "Até 10",
      customSlug: false,
      socialButtons: true,
      shareableLink: true,
      paypal: false,
      customDomain: false,
      analytics: false,
      prioritySupport: false,
      dedicatedSupport: false,
    },
    starterFeatures: {
      storefronts: "1",
      products: "Até 50",
      customSlug: true,
      socialButtons: true,
      shareableLink: true,
      paypal: true,
      customDomain: false,
      analytics: false,
      prioritySupport: true,
      dedicatedSupport: false,
    },
    proFeatures: {
      storefronts: "Ilimitadas",
      products: "Ilimitados",
      customSlug: true,
      socialButtons: true,
      shareableLink: true,
      paypal: true,
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      dedicatedSupport: true,
    },
    ctaTitle: "Pronto para começar?",
    ctaSub: "Crie a sua loja em minutos. Não é necessário cartão de crédito para o plano grátis.",
    ctaBtn: "Criar a sua loja",
  },
};

const PAYPAL_URL = "https://www.paypal.com/paypalme/myshopapp";

const featureKeys = [
  "storefronts",
  "products",
  "customSlug",
  "socialButtons",
  "shareableLink",
  "paypal",
  "customDomain",
  "analytics",
  "prioritySupport",
  "dedicatedSupport",
] as const;

export default function PricingPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  const plans = [
    {
      name: t.freeName,
      price: t.freePrice,
      period: t.freePeriod,
      desc: t.freeDesc,
      badge: null,
      accent: false,
      features: t.freeFeatures,
      cta: t.getStarted,
      href: "/setup",
    },
    {
      name: t.starterName,
      price: t.starterPrice,
      period: t.starterPeriod,
      desc: t.starterDesc,
      badge: t.starterBadge,
      accent: true,
      features: t.starterFeatures,
      cta: t.getStarted,
      href: PAYPAL_URL,
    },
    {
      name: t.proName,
      price: t.proPrice,
      period: t.proPeriod,
      desc: t.proDesc,
      badge: null,
      accent: false,
      features: t.proFeatures,
      cta: t.getStarted,
      href: PAYPAL_URL,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{t.title}</h1>
          <p className="mt-3 text-slate-600">{t.subtitle}</p>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.accent
                  ? "border-slate-900 bg-white shadow-lg"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="ml-1 text-sm text-slate-500">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">{plan.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {featureKeys.map((key) => {
                  const val = plan.features[key];
                  const label = t.features[key];
                  if (val === false) return null;
                  return (
                    <li key={key} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span>
                        {label}
                        {typeof val === "string" && val !== "true" ? `: ${val}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <a
                href={plan.href}
                target={plan.href.startsWith("http") ? "_blank" : undefined}
                rel={plan.href.startsWith("http") ? "noreferrer" : undefined}
                className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  plan.accent
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* PayPal note */}
        <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-500">
          {t.paypalNote}
        </p>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-bold">{t.comparisonTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 pr-4 font-medium text-slate-600">&nbsp;</th>
                  <th className="pb-3 px-4 font-semibold text-center">{t.freeName}</th>
                  <th className="pb-3 px-4 font-semibold text-center">{t.starterName}</th>
                  <th className="pb-3 px-4 font-semibold text-center">{t.proName}</th>
                </tr>
              </thead>
              <tbody>
                {featureKeys.map((key) => (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700">{t.features[key]}</td>
                    <td className="py-3 px-4 text-center">
                      <FeatureCell value={t.freeFeatures[key]} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FeatureCell value={t.starterFeatures[key]} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FeatureCell value={t.proFeatures[key]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold">{t.ctaTitle}</h2>
          <p className="mt-2 text-slate-600">{t.ctaSub}</p>
          <Link
            href="/setup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            {t.ctaBtn}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  if (value === false) return <X className="mx-auto h-4 w-4 text-slate-300" />;
  return <span className="text-slate-700">{value}</span>;
}
