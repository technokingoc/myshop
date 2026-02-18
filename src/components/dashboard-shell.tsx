"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";
import { clearSession } from "@/lib/auth";

type SetupData = {
  storeName: string;
  storefrontSlug: string;
  ownerName: string;
  businessType: string;
  currency: string;
  city: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
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
    notifications: "Notifications",
    noNotifications: "No notifications yet",
    logout: "Logout",
    hello: "Welcome back",
    context: "Manage your store operations",
  },
  pt: {
    dashboard: "Painel",
    catalog: "Catálogo",
    orders: "Pedidos",
    settings: "Configurações",
    storefront: "Loja",
    notifications: "Notificações",
    noNotifications: "Sem notificações",
    logout: "Sair",
    hello: "Bem-vindo de volta",
    context: "Gerencie as operações da sua loja",
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

export function DashboardShell({
  activePage,
  children,
}: {
  activePage: string;
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const t = dict[lang];
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

  const ownerName = setup?.data?.ownerName || "Seller";

  const navItems = [
    { label: t.dashboard, icon: LayoutDashboard, href: "/dashboard", key: "dashboard" },
    { label: t.catalog, icon: Package, href: "/dashboard/catalog", key: "catalog" },
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
  ];

  const mobileItems = navItems.filter((n) => ["orders", "catalog", "storefront", "settings"].includes(n.key));

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav
              className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
                <div>
                  <p className="text-sm text-slate-500">MyShop</p>
                  <p className="text-base font-semibold text-slate-900">{ownerName}</p>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="mt-3 space-y-1.5 px-3">
                {navItems.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
                        item.key === activePage
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">MyShop Seller</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{setup?.data?.storeName || "MyShop"}</h2>
            <p className="mt-1 text-sm text-slate-500">@{slug || "store"}</p>
          </div>
          <ul className="mt-4 space-y-1.5 px-3">
            {navItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
                    item.key === activePage
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="pb-28 lg:ml-72 lg:pb-8">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{t.hello}, {ownerName}</p>
                  <p className="truncate text-xs text-slate-500">{t.context}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <Bell className="h-4 w-4" />
                  {events.length > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] text-white">
                      {events.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    clearSession();
                    window.location.href = "/login";
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            </div>
          </header>

          {notifOpen && (
            <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
              <div className={`grid gap-1 ${mobileItems.length > 4 ? "grid-cols-5" : "grid-cols-4"}`}>
                {mobileItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[11px] font-medium transition ${
                      item.key === activePage
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="mb-0.5 h-4 w-4" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
