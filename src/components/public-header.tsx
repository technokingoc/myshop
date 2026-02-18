"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";
import { LanguageSwitch } from "@/components/language-switch";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    home: "Home",
    pricing: "Pricing",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    startFree: "Start free",
  },
  pt: {
    home: "Início",
    pricing: "Preços",
    login: "Entrar",
    register: "Criar conta",
    dashboard: "Painel",
    startFree: "Começar grátis",
  },
};

export function PublicHeader() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.session) setLoggedIn(true); })
      .catch(() => {});
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/pricing", label: t.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold tracking-tight text-slate-900 hover:bg-slate-100"
          >
            <Home className="h-4 w-4 text-slate-600" />
            <span>MyShop</span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              >
                {t.dashboard}
              </Link>
            ) : (
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === "/login"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                {t.login}
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitch />
          {loggedIn ? (
            <Link href="/dashboard" className="ui-btn ui-btn-primary">
              {t.dashboard}
            </Link>
          ) : (
            <Link href="/register" className="ui-btn ui-btn-primary">
              {t.startFree}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitch />
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {loggedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {t.dashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {t.login}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {t.register}
                </Link>
              </>
            )}
          </div>
          <div className="mt-3">
            {loggedIn ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="ui-btn ui-btn-primary w-full justify-center">
                {t.dashboard}
              </Link>
            ) : (
              <Link href="/register" onClick={() => setOpen(false)} className="ui-btn ui-btn-primary w-full justify-center">
                {t.startFree}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
