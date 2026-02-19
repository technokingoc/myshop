"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Home, Mail, HelpCircle, FileText, Shield, Store } from "lucide-react";

const dict = {
  en: {
    about: "About",
    aboutText: "MyShop connects local businesses with customers in their community, making it easier to discover and support local commerce.",
    quickLinks: "Quick Links",
    support: "Support",
    contact: "Contact",
    home: "Home",
    stores: "Stores",
    pricing: "Pricing",
    register: "Start Selling",
    help: "Help Center",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    guidelines: "Community Guidelines",
    email: "support@myshop.local",
    phone: "+1 (555) 123-4567",
    copyright: "© 2024 MyShop. All rights reserved.",
    poweredBy: "Made with ❤️ for local businesses"
  },
  pt: {
    about: "Sobre",
    aboutText: "MyShop conecta negócios locais com clientes na sua comunidade, facilitando a descoberta e apoio ao comércio local.",
    quickLinks: "Links Rápidos",
    support: "Suporte",
    contact: "Contato",
    home: "Início",
    stores: "Lojas",
    pricing: "Preços",
    register: "Começar a Vender",
    help: "Central de Ajuda",
    terms: "Termos de Serviço",
    privacy: "Política de Privacidade",
    guidelines: "Diretrizes da Comunidade",
    email: "suporte@myshop.local",
    phone: "+1 (555) 123-4567",
    copyright: "© 2024 MyShop. Todos os direitos reservados.",
    poweredBy: "Feito com ❤️ para negócios locais"
  },
};

export function Footer() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);

  return (
    <footer className="border-t border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        {/* Main footer content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          
          {/* About section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Home className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">MyShop</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              {t.aboutText}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t.quickLinks}</h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: t.home, icon: Home },
                { href: "/stores", label: t.stores, icon: Store },
                { href: "/pricing", label: t.pricing, icon: FileText },
                { href: "/register", label: t.register, icon: Store },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link 
                    href={href} 
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-green-600 transition-colors duration-150"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t.support}</h4>
            <ul className="space-y-3">
              {[
                { href: "/help", label: t.help, icon: HelpCircle },
                { href: "/terms", label: t.terms, icon: FileText },
                { href: "/privacy", label: t.privacy, icon: Shield },
                { href: "/guidelines", label: t.guidelines, icon: FileText },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link 
                    href={href} 
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-green-600 transition-colors duration-150"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">{t.contact}</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`mailto:${t.email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-green-600 transition-colors duration-150"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {t.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-500">{t.copyright}</p>
            <p className="text-xs text-slate-500">{t.poweredBy}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}