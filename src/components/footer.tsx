"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { LanguageSwitch } from "@/components/language-switch";

const dict = {
  en: {
    about: "About",
    aboutText:
      "MyShop is a simple storefront builder for informal sellers and micro businesses. Create, share, and sell — no technical skills required.",
    links: "Links",
    home: "Home",
    pricing: "Pricing",
    setup: "Get started",
    dashboard: "Dashboard",
    legal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    contact: "Contact",
    contactText: "Have questions? Reach out to us.",
    contactEmail: "hello@myshop.app",
    language: "Language",
    copyright: "MyShop. All rights reserved.",
  },
  pt: {
    about: "Sobre",
    aboutText:
      "O MyShop é um construtor de vitrines simples para vendedores informais e micro negócios. Crie, partilhe e venda — sem precisar de conhecimentos técnicos.",
    links: "Links",
    home: "Início",
    pricing: "Preços",
    setup: "Começar",
    dashboard: "Painel",
    legal: "Legal",
    terms: "Termos de Serviço",
    privacy: "Política de Privacidade",
    contact: "Contacto",
    contactText: "Tem perguntas? Entre em contacto connosco.",
    contactEmail: "hello@myshop.app",
    language: "Idioma",
    copyright: "MyShop. Todos os direitos reservados.",
  },
};

export function Footer() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.about}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.aboutText}</p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.links}</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-slate-900 transition">
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition">
                  {t.pricing}
                </Link>
              </li>
              <li>
                <Link href="/setup" className="text-slate-600 hover:text-slate-900 transition">
                  {t.setup}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition">
                  {t.dashboard}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.legal}</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li>
                <span className="text-slate-400 cursor-default">{t.terms}</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-default">{t.privacy}</span>
              </li>
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">{t.contact}</h3>
            <p className="mt-1 text-sm text-slate-600">{t.contactText}</p>
            <p className="mt-1 text-sm text-slate-500">{t.contactEmail}</p>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.language}</h3>
            <div className="mt-2">
              <LanguageSwitch />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
          © {year} {t.copyright}
        </div>
      </div>
    </footer>
  );
}
