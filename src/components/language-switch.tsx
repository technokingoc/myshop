"use client";

import { useLanguage } from "@/lib/language";

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition sm:text-sm ${
          lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("pt")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition sm:text-sm ${
          lang === "pt" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        PT
      </button>
    </div>
  );
}
