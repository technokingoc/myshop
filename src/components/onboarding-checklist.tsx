"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    title: "Getting Started",
    subtitle: "Complete these steps to set up your store",
    dismiss: "Dismiss",
    complete: "complete",
    accountCreated: "Account created",
    addLogo: "Add store logo",
    addBanner: "Add store banner",
    addProduct: "Add your first product",
    publishProduct: "Publish your first product",
    getOrder: "Get your first order",
    allDone: "You're all set! 🎉",
    allDoneSub: "Your store is fully configured. Start sharing it!",
  },
  pt: {
    title: "Primeiros Passos",
    subtitle: "Complete estes passos para configurar a sua loja",
    dismiss: "Dispensar",
    complete: "concluído",
    accountCreated: "Conta criada",
    addLogo: "Adicionar logotipo da loja",
    addBanner: "Adicionar banner da loja",
    addProduct: "Adicionar o primeiro produto",
    publishProduct: "Publicar o primeiro produto",
    getOrder: "Receber o primeiro pedido",
    allDone: "Tudo pronto! 🎉",
    allDoneSub: "A sua loja está totalmente configurada. Comece a partilhá-la!",
  },
};

type OnboardingData = {
  hasLogo: boolean;
  hasBanner: boolean;
  productCount: number;
  publishedCount: number;
  orderCount: number;
};

export function OnboardingChecklist({ data }: { data: OnboardingData }) {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [dismissed, setDismissed] = useState(false);

  const steps = useMemo(() => [
    { label: t.accountCreated, done: true, href: "/dashboard" },
    { label: t.addLogo, done: data.hasLogo, href: "/dashboard/settings" },
    { label: t.addBanner, done: data.hasBanner, href: "/dashboard/settings" },
    { label: t.addProduct, done: data.productCount > 0, href: "/dashboard/catalog" },
    { label: t.publishProduct, done: data.publishedCount > 0, href: "/dashboard/catalog" },
    { label: t.getOrder, done: data.orderCount > 0, href: "/dashboard/orders" },
  ], [t, data]);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t.title}</h2>
            <p className="text-xs text-slate-500">{allDone ? t.allDoneSub : t.subtitle}</p>
          </div>
        </div>
        {allDone && (
          <button onClick={() => setDismissed(true)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-indigo-600">{pct}% {t.complete}</span>
          <span className="text-slate-400">{doneCount}/{steps.length}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-indigo-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {!allDone && (
        <div className="mt-3 space-y-1">
          {steps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                step.done
                  ? "text-slate-400"
                  : "text-slate-700 hover:bg-indigo-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
                <span className={step.done ? "line-through" : ""}>{step.label}</span>
              </div>
              {!step.done && <ChevronRight className="h-4 w-4 text-slate-300" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
