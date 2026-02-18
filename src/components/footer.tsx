"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Home } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    tagline: "Your store, online in minutes.",
    product: "Product",
    pricing: "Pricing",
    register: "Register",
    login: "Login",
    stores: "Browse Stores",
    company: "Company",
    about: "About",
    contact: "Contact",
    powered: "Powered by MyShop",
  },
  pt: {
    tagline: "Sua loja, online em minutos.",
    product: "Produto",
    pricing: "Preços",
    register: "Criar conta",
    login: "Entrar",
    stores: "Explorar Lojas",
    company: "Empresa",
    about: "Sobre",
    contact: "Contacto",
    powered: "Desenvolvido por MyShop",
  },
};

export function Footer() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Home className="h-4 w-4 text-slate-600" />
              MyShop
            </Link>
            <p className="mt-2 text-sm text-slate-500">{t.tagline}</p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.product}</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">{t.pricing}</Link></li>
              <li><Link href="/stores" className="text-sm text-slate-600 hover:text-slate-900">{t.stores}</Link></li>
              <li><Link href="/register" className="text-sm text-slate-600 hover:text-slate-900">{t.register}</Link></li>
              <li><Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">{t.login}</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.company}</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="#" className="text-sm text-slate-600 hover:text-slate-900">{t.about}</Link></li>
              <li><Link href="#" className="text-sm text-slate-600 hover:text-slate-900">{t.contact}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {t.powered}
        </div>
      </div>
    </footer>
  );
}
