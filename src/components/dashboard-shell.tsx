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
  Search,
  CircleHelp,
  BarChart3,
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
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
      className={`group relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span className={`absolute inset-y-2 left-0 w-0.5 rounded-full ${active ? "bg-slate-900" : "bg-transparent"}`} />
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
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

  const slug = useMemo(() => {
    if (!setup?.data) return "";
    return setup.data.storefrontSlug || sanitizeSlug(setup.data.storeName) || "myshop-demo";
  }, [setup]);

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

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute left-0 top-0 h-full w-80 bg-white px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.08em] text-slate-400">MyShop Seller</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{setup?.data?.storeName || "MyShop"}</p>
                </div>
                <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="ui-caption mb-2">{t.storeGroup}</p>
              <ul className="space-y-1.5">
                {storeItems.map((item) => (
                  <li key={item.key}>
                    <NavItem item={item} activePage={activePage} onClick={() => setMobileNavOpen(false)} />
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="ui-caption mb-2">{t.accountGroup}</p>
                <ul className="space-y-1.5">
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

        <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">MyShop Seller</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">{setup?.data?.storeName || "MyShop"}</h2>
            <p className="mt-1 text-sm text-slate-500">@{slug || "store"}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <p className="ui-caption mb-2">{t.storeGroup}</p>
            <ul className="space-y-2">
              {storeItems.map((item) => (
                <li key={item.key}>
                  <NavItem item={item} activePage={activePage} />
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-200 px-4 pb-5 pt-5">
            <p className="ui-caption mb-2">{t.accountGroup}</p>
            <ul className="space-y-2">
              {accountItems.map((item) => (
                <li key={item.key}>
                  <NavItem item={item} activePage={activePage} />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="pb-24 lg:ml-72 lg:pb-8">
          <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Help">
                  <CircleHelp className="h-4 w-4" />
                </button>
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            </div>
          </header>

          {notifOpen && (
            <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-800">{t.notifications}</h3>
                <ul className="mt-2 space-y-2">
                  {events.length === 0 ? (
                    <li className="text-sm text-slate-500">{t.noNotifications}</li>
                  ) : (
                    events.map((evt) => (
                      <li key={evt.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <p className="text-slate-800">{evt.message}</p>
                        <p className="text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString()}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>

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
                      <item.icon className={`h-4 w-4 ${active ? "text-slate-900" : "text-slate-400"}`} />
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
