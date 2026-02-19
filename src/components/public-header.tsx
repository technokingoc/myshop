"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Home, Store, ShoppingBag, User, Plus } from "lucide-react";
import { LanguageSwitch } from "@/components/language-switch";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    home: "Home",
    stores: "Stores",
    pricing: "Pricing",
    login: "Sign In",
    register: "Register",
    dashboard: "Dashboard",
    startFree: "Start free",
    openStore: "Open Store",
    shopping: "Shopping",
    myStore: "My Store",
    switchToShopping: "Switch to Shopping",
    switchToSelling: "Switch to My Store",
    profile: "Profile",
    orders: "Orders",
    logout: "Sign Out",
  },
  pt: {
    home: "Início",
    stores: "Lojas",
    pricing: "Preços",
    login: "Entrar",
    register: "Criar conta",
    dashboard: "Painel",
    startFree: "Começar grátis",
    openStore: "Abrir Loja",
    shopping: "Compras",
    myStore: "Minha Loja",
    switchToShopping: "Mudar para Compras",
    switchToSelling: "Mudar para Minha Loja",
    profile: "Perfil",
    orders: "Encomendas",
    logout: "Sair",
  },
};

export function PublicHeader() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Determine current mode based on path
  const isSellerMode = pathname?.startsWith("/dashboard") || pathname?.startsWith("/seller");
  const isShoppingMode = !isSellerMode;

  useEffect(() => {
    fetch("/api/auth/unified/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success) {
          setSession(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => { 
    setOpen(false);
    setShowProfileMenu(false);
  }, [pathname]);

  const handleModeSwitch = (toSellerMode: boolean) => {
    if (toSellerMode && session?.hasStore) {
      router.push("/dashboard");
    } else if (toSellerMode && !session?.hasStore) {
      router.push("/open-store");
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/unified/logout", {
        method: "POST",
        credentials: "include",
      });
      setSession(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/stores", label: t.stores },
    { href: "/pricing", label: t.pricing },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 transition-all duration-200">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden transition-all duration-200 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            <div className="relative">
              <Menu className={`h-5 w-5 transition-all duration-200 ${open ? 'opacity-0 rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`h-5 w-5 absolute inset-0 transition-all duration-200 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-45 scale-75'}`} />
            </div>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold tracking-tight text-slate-900 hover:bg-slate-100"
          >
            <Home className="h-4 w-4 text-slate-600" />
            <span>MyShop</span>
          </Link>

          {/* Mode switcher - only show when logged in */}
          {session && (
            <div className="hidden md:flex items-center">
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 transition-all duration-200">
                <button
                  onClick={() => handleModeSwitch(false)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 max-w-24 truncate ${
                    isShoppingMode
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <ShoppingBag className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{t.shopping}</span>
                </button>
                <button
                  onClick={() => handleModeSwitch(true)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 max-w-24 truncate ${
                    isSellerMode
                      ? "bg-white text-slate-900 shadow-sm scale-105"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Store className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{session.hasStore ? t.myStore : t.openStore}</span>
                </button>
              </div>
            </div>
          )}

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
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200"></div>
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block">{session.name}</span>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100">
                    {session.email}
                  </div>
                  
                  {/* Mobile mode switcher */}
                  <div className="md:hidden border-b border-slate-100 p-2">
                    <button
                      onClick={() => handleModeSwitch(!isSellerMode)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {isSellerMode ? (
                        <>
                          <ShoppingBag className="h-3 w-3" />
                          {t.switchToShopping}
                        </>
                      ) : (
                        <>
                          <Store className="h-3 w-3" />
                          {session.hasStore ? t.switchToSelling : t.openStore}
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4" />
                    {t.profile}
                  </Link>
                  
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {t.orders}
                  </Link>

                  {session.hasStore && (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Store className="h-4 w-4" />
                      {t.dashboard}
                    </Link>
                  )}
                  
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                      {t.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {t.login}
              </Link>
              <Link href="/register" className="ui-btn ui-btn-primary">
                {t.startFree}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`border-t border-slate-200 bg-white md:hidden transition-all duration-200 overflow-hidden ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 min-h-[44px] flex items-center truncate"
              >
                {link.label}
              </Link>
            ))}
            
            {!session && (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 min-h-[44px] flex items-center truncate">
                  {t.login}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 min-h-[44px] flex items-center truncate">
                  {t.register}
                </Link>
              </>
            )}
          </div>
          
          {!session && (
            <div className="mt-3">
              <Link href="/register" onClick={() => setOpen(false)} className="ui-btn ui-btn-primary w-full justify-center min-h-[44px] text-sm truncate">
                {t.startFree}
              </Link>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}