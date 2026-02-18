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
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { LanguageSwitch } from "@/components/language-switch";
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

/* ── Compact mobile sidebar nav item ── */
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
      className={`group flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium leading-none transition-colors ${
        active
          ? "bg-indigo-50/90 text-slate-900"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        <item.icon className={`h-3.5 w-3.5 ${active ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"}`} />
      </span>
      <span>{item.label}</span>
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
    return "dashboard";
  }, [pathname]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);

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

  useEffect(() => {
    if (!setup?.sellerId) return;
    const source = new EventSource(`/api/notifications/stream?sellerId=${setup.sellerId}`);
    source.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as LiveEvent;
        setEvents((prev) => [payload, ...prev].slice(0, 20));
      } catch {}
    });
    return () => source.close();
  }, [setup?.sellerId]);

  useEffect(() => {
    setNotifOpen(false);
  }, [pathname]);

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
    { label: t.coupons, icon: TicketPercent, href: "/dashboard/coupons", key: "coupons" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  const accountItems = [
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
  ];

  /* Desktop dropdown groups */
  const storeDropdownItems = [
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, icon: Package, href: "/dashboard/catalog", key: "catalog" },
    { label: t.coupons, icon: TicketPercent, href: "/dashboard/coupons", key: "coupons" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  const insightsDropdownItems = [
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
  ];

  const publicTopNavItems = [
    { label: t.setup, href: "/setup", key: "setup" },
    { label: t.pricing, href: "/pricing", key: "pricing" },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {/* ── Mobile sidebar ── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute left-0 top-0 h-full w-72 bg-white px-3 py-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Compact profile card */}
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {ownerInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{t.profileLabel}</p>
                      <p className="truncate text-sm font-semibold text-slate-900">{storeName}</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Close menu">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.storeGroup}</p>
              <ul className="space-y-1">
                {storeItems.map((item) => (
                  <li key={item.key}>
                    <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t.accountGroup}</p>
                <ul className="space-y-1">
                  {accountItems.map((item) => (
                    <li key={item.key}>
                      <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                    </li>
                  ))}
                </ul>
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
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label={t.notifications}
                  aria-expanded={notifOpen}
                >
                  <Bell className="h-4 w-4" />
                  {events.length > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </button>

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

                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-md">
                    <h3 className="text-sm font-semibold text-slate-800">{t.notifications}</h3>
                    <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {events.length === 0 ? (
                        <li className="text-sm text-slate-500">{t.noNotifications}</li>
                      ) : (
                        events.map((evt) => (
                          <li key={evt.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <p className="text-slate-800">{evt.message}</p>
                            <p className="text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString()}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>

          {/* ── Mobile bottom nav ── */}
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <ul className="grid grid-cols-5">
              {[...storeItems.slice(0, 3), ...accountItems].map((item) => {
                const active = item.key === activePage;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-14 flex-col items-center justify-center gap-1 text-xs ${active ? "text-slate-900" : "text-slate-500"}`}
                    >
                      <item.icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </main>
      </div>
    </AuthGate>
  );
}
