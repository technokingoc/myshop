"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Store,
  Menu,
  X,
  Bell,
  LogOut,
  BarChart3,
  Home,
  ChevronDown,
  TicketPercent,
  MessageSquare,
  Megaphone,
  Zap,
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { LanguageSwitch } from "@/components/language-switch";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { clearSession, fetchSession, type AuthSession } from "@/lib/auth";

type SetupData = {
  storeName: string;
  storefrontSlug: string;
  ownerName: string;
};
type SetupPersisted = { step: number; done: boolean; data: SetupData; sellerId?: number };
type LiveEvent = { id: string; message: string; createdAt: string };

const STORAGE_SETUP = "myshop_setup_v2";

const dict = {
  en: {
    home: "Home",
    dashboard: "Dashboard",
    catalog: "Catalog",
    orders: "Orders",
    settings: "Settings",
    storefront: "Storefront",
    analytics: "Analytics",
    coupons: "Coupons",
    promotions: "Promotions",
    flashSales: "Flash Sales",
    reviews: "Reviews",
    setup: "Setup",
    pricing: "Pricing",
    notifications: "Notifications",
    noNotifications: "No notifications yet",
    logout: "Logout",
    storeGroup: "STORE",
    accountGroup: "ACCOUNT",
    profileLabel: "MYSHOP SELLER",
    openStorefront: "Open storefront",
    store: "Store",
    insights: "Insights",
    more: "More",
  },
  pt: {
    home: "Início",
    dashboard: "Painel",
    catalog: "Catálogo",
    orders: "Pedidos",
    settings: "Configurações",
    storefront: "Loja",
    analytics: "Análises",
    coupons: "Cupons",
    promotions: "Promoções",
    flashSales: "Vendas Relâmpago",
    reviews: "Avaliações",
    setup: "Configurar",
    pricing: "Preços",
    notifications: "Notificações",
    noNotifications: "Sem notificações",
    logout: "Sair",
    storeGroup: "LOJA",
    accountGroup: "CONTA",
    profileLabel: "VENDEDOR MYSHOP",
    openStorefront: "Abrir loja",
    store: "Loja",
    insights: "Informações",
    more: "Mais",
  },
};

function sanitizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ── Enhanced mobile sidebar nav item ── */
function NavItem({
  item,
  activePage,
  onClick,
}: {
  item: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; key: string };
  activePage: string;
  onClick?: () => void;
}) {
  const active = item.key === activePage;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-indigo-100 text-indigo-900 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-lg transition-colors ${
        active ? "bg-indigo-200/50" : "group-hover:bg-slate-100"
      }`}>
        <item.icon className={`h-4 w-4 ${active ? "text-indigo-700" : "text-slate-500 group-hover:text-slate-700"}`} />
      </span>
      <span className="font-semibold">{item.label}</span>
    </Link>
  );
}

/* ── Desktop dropdown component ── */
function NavDropdown({
  label,
  items,
  activePage,
}: {
  label: string;
  items: { label: string; icon: React.ComponentType<{ className?: string }>; href: string; key: string }[];
  activePage: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = items.some((i) => i.key === activePage);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, close]);

  // Close on route change
  const pathname = usePathname();
  useEffect(() => { close(); }, [pathname, close]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[12rem] rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-200/60">
          {items.map((item) => {
            const active = item.key === activePage;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50/80 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const t = dict[lang];
  const activePage = useMemo(() => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/dashboard/orders")) return "orders";
    if (pathname.startsWith("/dashboard/catalog")) return "catalog";
    if (pathname.startsWith("/dashboard/settings")) return "settings";
    if (pathname.startsWith("/dashboard/analytics")) return "analytics";
    if (pathname.startsWith("/dashboard/coupons")) return "coupons";
    if (pathname.startsWith("/dashboard/promotions")) return "promotions";
    if (pathname.startsWith("/dashboard/flash-sales")) return "flash-sales";
    if (pathname.startsWith("/dashboard/reviews")) return "reviews";
    if (pathname.startsWith("/dashboard/notifications")) return "notifications";
    return "dashboard";
  }, [pathname]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [setup, setSetup] = useState<SetupPersisted | null>(null);

  useEffect(() => {
    // Try localStorage first for legacy setup data
    try {
      const raw = localStorage.getItem(STORAGE_SETUP);
      if (raw) setSetup(JSON.parse(raw));
    } catch {}
    // Also fetch from auth session for cookie-based auth
    fetchSession().then((session) => {
      if (session) {
        setSetup((prev) => {
          const base = prev ?? { step: 4, done: true, data: { storeName: "", storefrontSlug: "", ownerName: "" } };
          return {
            ...base,
            sellerId: session.sellerId,
            data: {
              ...base.data,
              storeName: base.data.storeName || session.storeName || "",
              storefrontSlug: base.data.storefrontSlug || session.sellerSlug || "",
              ownerName: base.data.ownerName || "",
            },
          };
        });
      }
    });
  }, []);

  const slug = useMemo(() => {
    if (!setup?.data) return "";
    return setup.data.storefrontSlug || sanitizeSlug(setup.data.storeName) || "myshop-demo";
  }, [setup]);

  const storeName = setup?.data?.storeName || "MyShop";
  const ownerName = setup?.data?.ownerName || "Seller";
  const ownerInitial = ownerName.charAt(0).toUpperCase() || "S";

  const storeItems = [
    { label: t.dashboard, icon: LayoutDashboard, href: "/dashboard", key: "dashboard" },
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, icon: Package, href: "/dashboard/catalog", key: "catalog" },
    { label: t.reviews, icon: MessageSquare, href: "/dashboard/reviews", key: "reviews" },
    { label: t.coupons, icon: TicketPercent, href: "/dashboard/coupons", key: "coupons" },
    { label: t.promotions, icon: Megaphone, href: "/dashboard/promotions", key: "promotions" },
    { label: t.flashSales, icon: Zap, href: "/dashboard/flash-sales", key: "flash-sales" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  const accountItems = [
    { label: t.notifications, icon: Bell, href: "/dashboard/notifications", key: "notifications" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
  ];

  /* Desktop dropdown groups */
  const storeDropdownItems = [
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, icon: Package, href: "/dashboard/catalog", key: "catalog" },
    { label: t.reviews, icon: MessageSquare, href: "/dashboard/reviews", key: "reviews" },
    { label: t.coupons, icon: TicketPercent, href: "/dashboard/coupons", key: "coupons" },
    { label: t.promotions, icon: Megaphone, href: "/dashboard/promotions", key: "promotions" },
    { label: t.flashSales, icon: Zap, href: "/dashboard/flash-sales", key: "flash-sales" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  const insightsDropdownItems = [
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
    { label: t.notifications, icon: Bell, href: "/dashboard/notifications", key: "notifications" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
  ];

  const publicTopNavItems = [
    { label: t.setup, href: "/setup", key: "setup" },
    { label: t.pricing, href: "/pricing", key: "pricing" },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {/* ── Enhanced Mobile sidebar ── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                {/* Enhanced profile card */}
                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5">
                        <span className="text-sm font-bold text-indigo-600">{ownerInitial}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-wide text-indigo-600/80">{t.profileLabel}</p>
                        <p className="truncate text-lg font-bold text-slate-900">{storeName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileNavOpen(false)} 
                      className="rounded-lg p-2 text-slate-600 hover:bg-white/60 transition-colors" 
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    <div>
                      <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t.storeGroup}</p>
                      <ul className="space-y-1">
                        {storeItems.map((item) => (
                          <li key={item.key}>
                            <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t.accountGroup}</p>
                      <ul className="space-y-1">
                        {accountItems.map((item) => (
                          <li key={item.key}>
                            <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer with logout */}
                <div className="border-t border-slate-100 p-4">
                  <button
                    onClick={async () => {
                      await clearSession();
                      window.location.href = "/login";
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </button>
                </div>
              </div>
            </nav>
          </div>
        )}

        <main className="relative z-10 pb-24 lg:pb-8">
          {/* ── Header ── */}
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
            <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3 lg:gap-4">
                <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </button>

                <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold tracking-tight text-slate-900 hover:bg-slate-100" aria-label="MyShop home">
                  <Home className="h-4 w-4 text-slate-600" />
                  <span>MyShop</span>
                </Link>

                {/* Desktop nav with dropdowns */}
                <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Seller navigation">
                  {/* Dashboard — direct link */}
                  <Link
                    href="/dashboard"
                    aria-current={activePage === "dashboard" ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      activePage === "dashboard" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                    }`}
                  >
                    {t.dashboard}
                  </Link>

                  {/* Store dropdown */}
                  <NavDropdown label={t.store} items={storeDropdownItems} activePage={activePage} />

                  {/* Insights dropdown */}
                  <NavDropdown label={t.insights} items={insightsDropdownItems} activePage={activePage} />
                </nav>

                <div className="hidden h-5 w-px bg-slate-200 lg:block" aria-hidden="true" />

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
                  {publicTopNavItems.map((item) => (
                    <Link key={item.key} href={item.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100/70 hover:text-slate-700">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="relative flex items-center gap-2.5">
                <LanguageSwitch />
                <NotificationBell t={t} sellerId={setup?.sellerId} />

                <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 sm:flex">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">{ownerInitial}</div>
                  <span className="max-w-32 truncate text-xs font-medium text-slate-700">{storeName}</span>
                </div>

                <button
                  onClick={async () => {
                    await clearSession();
                    window.location.href = "/login";
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>

          {/* ── Enhanced Mobile bottom nav ── */}
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden">
            <div className="mx-auto max-w-md">
              <ul className="grid grid-cols-5 gap-1 px-2 py-1">
                {[...storeItems.slice(0, 3), ...accountItems.slice(0, 2)].map((item) => {
                  const active = item.key === activePage;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-all duration-200 ${
                          active 
                            ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </main>
      </div>
    </AuthGate>
  );
}
