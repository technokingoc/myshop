"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/language";

const copy = {
  en: {
    title: "We hit a temporary storefront issue",
    hint: "Please try again. If this continues, contact the seller directly.",
    retry: "Try again",
  },
  pt: {
    title: "Encontrámos um problema temporário na loja",
    hint: "Tente novamente. Se continuar, contacte o vendedor diretamente.",
    retry: "Tentar novamente",
  },
};

export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLanguage();
  const t = copy[lang];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-slate-600">{t.hint}</p>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          <RotateCcw className="h-4 w-4" />
          {t.retry}
        </button>
      </section>
    </main>
  );
}
