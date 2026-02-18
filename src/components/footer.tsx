"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    powered: "Powered by MyShop",
    pricing: "Pricing",
    stores: "Stores",
    register: "Register",
    login: "Login",
  },
  pt: {
    powered: "Desenvolvido por MyShop",
    pricing: "Preços",
    stores: "Lojas",
    register: "Criar conta",
    login: "Entrar",
  },
};

export function Footer() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} {t.powered}</p>
        <nav className="flex gap-4">
          {[
            { href: "/stores", label: t.stores },
            { href: "/pricing", label: t.pricing },
            { href: "/register", label: t.register },
            { href: "/login", label: t.login },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="text-xs text-slate-400 hover:text-slate-600">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
