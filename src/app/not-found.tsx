"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Home, ArrowLeft } from "lucide-react";

const dict = {
  en: {
    code: "404",
    title: "Page not found",
    desc: "Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.",
    home: "Back to home",
  },
  pt: {
    code: "404",
    title: "Página não encontrada",
    desc: "Desculpe, não conseguimos encontrar a página que procura. Pode ter sido movida ou não existe.",
    home: "Voltar ao início",
  },
};

export default function NotFound() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-200">{t.code}</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-2 max-w-md text-slate-600">{t.desc}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.home}
        </Link>
      </div>
    </div>
  );
}
