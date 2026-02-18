"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Check, X, ArrowRight, Crown } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";
import { fetchSession, type AuthSession } from "@/lib/auth";

const dict = {
  en: {
    title: "Pricing",
    subtitle: "Choose the plan that fits your business. Upgrade or downgrade anytime.",
    getStarted: "Get started",
    currentPlan: "Current plan",
    upgrade: "Upgrade",
    comparisonTitle: "Feature comparison",
    ctaTitle: "Ready to start?",
    ctaSub: "Create your store in minutes. No credit card required for the free plan.",
    ctaBtn: "Create your store",
    comingSoonTitle: "Coming soon",
    comingSoonMsg: "Payments are not yet available. Please contact us to upgrade your plan.",
    close: "Close",
    contactUs: "Contact us",
    mostPopular: "Most popular",
  },
  pt: {
    title: "Preços",
    subtitle: "Escolha o plano ideal para o seu negócio. Mude a qualquer momento.",
    getStarted: "Começar",
    currentPlan: "Plano atual",
    upgrade: "Upgrade",
    comparisonTitle: "Comparação de funcionalidades",
    ctaTitle: "Pronto para começar?",
    ctaSub: "Crie a sua loja em minutos. Não é necessário cartão de crédito para o plano grátis.",
    ctaBtn: "Criar a sua loja",
    comingSoonTitle: "Em breve",
    comingSoonMsg: "Pagamentos ainda não estão disponíveis. Contacte-nos para fazer upgrade do seu plano.",
    close: "Fechar",
    contactUs: "Contacte-nos",
    mostPopular: "Mais popular",
  },
};

const planOrder: PlanId[] = ["free", "pro", "business"];

export default function PricingPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSession().then(async (s) => {
      setSession(s);
      if (s) {
        try {
          const res = await fetch("/api/dashboard/stats", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setCurrentPlan(data.plan || "free");
          }
        } catch {}
      }
    });
  }, []);

  const plans = planOrder.map((id) => PLANS[id]);

  // Gather all unique feature keys
  const allFeatureKeys = Array.from(
    new Set(plans.flatMap((p) => p.features.map((f) => f.key)))
  );

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
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPro = plan.id === "pro";
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  isPro
                    ? "border-indigo-500 bg-white shadow-lg ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white"
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    {t.mostPopular}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{plan.name[lang]}</h2>
                  {plan.id === "business" && <Crown className="h-4 w-4 text-violet-500" />}
                </div>
                <p className="mt-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-slate-500">{plan.period[lang]}</span>
                </p>
                <p className="mt-2 text-sm text-slate-600">{plan.description[lang]}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f.key} className="flex items-start gap-2 text-sm text-slate-700">
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300" />
                      )}
                      <span className={f.included ? "" : "text-slate-400"}>{f.label[lang]}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="mt-6 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
                    {t.currentPlan}
                  </div>
                ) : plan.id === "free" ? (
                  <Link
                    href="/setup"
                    className="mt-6 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t.getStarted}
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    className={`mt-6 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                      isPro
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {t.upgrade}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-bold">{t.comparisonTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 pr-4 font-medium text-slate-600">&nbsp;</th>
                  {plans.map((p) => (
                    <th key={p.id} className="pb-3 px-4 font-semibold text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${p.badge}`}>
                        {p.name[lang]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatureKeys.map((key) => (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700">
                      {plans[0].features.find((f) => f.key === key)?.label[lang] || key}
                    </td>
                    {plans.map((p) => {
                      const feature = p.features.find((f) => f.key === key);
                      return (
                        <td key={p.id} className="py-3 px-4 text-center">
                          {feature?.included ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )}
                        </td>
                      );
                    })}
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

      {/* Coming soon modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowModal(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">{t.comingSoonTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.comingSoonMsg}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {t.close}
              </button>
              <a href="mailto:support@myshop.co.mz" className="flex-1 rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700">
                {t.contactUs}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
