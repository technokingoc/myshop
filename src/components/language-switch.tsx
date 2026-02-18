"use client";

import { useLanguage } from "@/lib/language";

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex rounded-full border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur">
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
          lang === "en"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("pt")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
          lang === "pt"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        aria-pressed={lang === "pt"}
      >
        PT
      </button>
    </div>
  );
}
