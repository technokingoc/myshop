"use client";

import { useState, useEffect, useMemo } from "react";
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
  ExternalLink,
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { LanguageSwitch } from "@/components/language-switch";
import { clearSession } from "@/lib/auth";

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
    dashboard: "Dashboard",
    catalog: "Catalog",
    orders: "Orders",
    settings: "Settings",
    storefront: "Storefront",
    analytics: "Analytics",
    notifications: "Notifications",
    noNotifications: "No notifications yet",
    logout: "Logout",
    storeGroup: "STORE",
    accountGroup: "ACCOUNT",
    profileLabel: "MYSHOP SELLER",
    openStorefront: "Open storefront",
  },
  pt: {
    dashboard: "Painel",
    catalog: "Catálogo",
    orders: "Pedidos",
    settings: "Configurações",
    storefront: "Loja",
    analytics: "Análises",
    notifications: "Notificações",
    noNotifications: "Sem notificações",
    logout: "Sair",
    storeGroup: "LOJA",
    accountGroup: "CONTA",
    profileLabel: "VENDEDOR MYSHOP",
    openStorefront: "Abrir loja",
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
      className={`group flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium leading-none transition-colors ${
        active
          ? "bg-indigo-50/90 text-slate-900"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <item.icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700"}`} />
      </span>
      <span className="translate-y-[0.5px]">{item.label}</span>
    </Link>
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
    return "dashboard";
  }, [pathname]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETUP);
      if (raw) setSetup(JSON.parse(raw));
    } catch {}
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
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  const accountItems = [
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
  ];

  const topNavItems = [
    { label: t.dashboard, href: "/dashboard", key: "dashboard" },
    { label: t.orders, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, href: "/dashboard/catalog", key: "catalog" },
    { label: t.analytics, href: "/dashboard/analytics", key: "analytics" },
    { label: t.settings, href: "/dashboard/settings", key: "settings" },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute left-0 top-0 h-full w-80 bg-white px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {ownerInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t.profileLabel}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{storeName}</p>
                      <p className="truncate text-xs text-slate-500">@{slug || "store"}</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="ui-caption mb-3 px-1">{t.storeGroup}</p>
              <ul className="space-y-2">
                {storeItems.map((item) => (
                  <li key={item.key}>
                    <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="ui-caption mb-3 px-1">{t.accountGroup}</p>
                <ul className="space-y-2">
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

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] overflow-hidden border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
          <div className="shrink-0 px-5 pt-6 pb-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4.5">
              <div className="flex min-h-[82px] items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700">
                  {ownerInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t.profileLabel}</p>
                  <h2 className="mt-1 truncate text-[15px] font-semibold text-slate-900">{storeName}</h2>
                  <p className="mt-0.5 truncate text-sm text-slate-500">@{slug || "store"}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <p className="ui-caption mb-3 px-1">{t.storeGroup}</p>
            <ul className="space-y-2">
              {storeItems.map((item) => (
                <li key={item.key}>
                  <NavItem item={item} activePage={activePage} />
                </li>
              ))}
            </ul>

            <div className="mt-9 border-t border-slate-200 pt-6">
              <p className="ui-caption mb-3 px-1">{t.accountGroup}</p>
              <ul className="space-y-2">
                {accountItems.map((item) => (
                  <li key={item.key}>
                    <NavItem item={item} activePage={activePage} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="relative z-10 pb-24 lg:ml-[19rem] lg:pb-8">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
            <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
                <nav className="hidden items-center gap-1 lg:flex">
                  {topNavItems.map((item) => {
                    const active = item.key === activePage;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="relative flex items-center gap-2.5">
                <LanguageSwitch />
                <a
                  href={slug ? `/s/${slug}` : "/"}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.openStorefront}
                </a>
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {events.length > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </button>
                <button
                  onClick={() => {
                    clearSession();
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

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <ul className="grid grid-cols-5">
              {[...storeItems.slice(0, 3), ...accountItems].map((item) => {
                const active = item.key === activePage;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
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
