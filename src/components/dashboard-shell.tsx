"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import {
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
    quickOrders: "Orders",
    quickCatalog: "Catalog",
    quickStorefront: "Store",
    quickSettings: "Settings",
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
    quickOrders: "Pedidos",
    quickCatalog: "Catálogo",
    quickStorefront: "Loja",
    quickSettings: "Definições",
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

  const navItems = [
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, icon: Package, href: "/#catalog", key: "catalog" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 lg:hidden" onClick={() => setMobileNavOpen(false)}>
            <nav className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <span className="font-semibold text-slate-900">MyShop</span>
                <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              <ul className="mt-2 space-y-1 px-2">{navItems.map((item) => <li key={item.key}><a href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${item.key === activePage ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`} onClick={() => setMobileNavOpen(false)}><item.icon className="h-4 w-4" />{item.label}</a></li>)}</ul>
            </nav>
          </div>
        )}

        <aside className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-56 border-r border-slate-200 bg-white lg:block">
          <ul className="mt-4 space-y-1 px-2">{navItems.map((item) => <li key={item.key}><a href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${item.key === activePage ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><item.icon className="h-4 w-4" />{item.label}</a></li>)}</ul>
        </aside>

        <main className="lg:ml-56">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><Menu className="h-5 w-5" /></button><h1 className="font-semibold text-slate-900">{navItems.find((n) => n.key === activePage)?.label || "Dashboard"}</h1></div>
          <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-2 px-4 pt-4 sm:px-6 lg:px-8">
            <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-lg border border-slate-300 bg-white p-2 text-slate-700"><Bell className="h-4 w-4" />{events.length > 0 && <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] text-white">{events.length}</span>}</button>
            <button onClick={() => { clearSession(); window.location.href = "/login"; }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><LogOut className="h-4 w-4" />{t.logout}</button>
          </div>
          {notifOpen && <div className="mx-auto mt-2 w-full max-w-5xl px-4 sm:px-6 lg:px-8"><div className="rounded-xl border border-slate-200 bg-white p-3"><h3 className="text-sm font-semibold text-slate-800">{t.notifications}</h3><ul className="mt-2 space-y-2">{events.length === 0 ? <li className="text-sm text-slate-500">{t.noNotifications}</li> : events.map((evt) => <li key={evt.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><p className="text-slate-800">{evt.message}</p><p className="text-xs text-slate-400">{new Date(evt.createdAt).toLocaleString()}</p></li>)}</ul></div></div>}
          <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">{children}</div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
            <div className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-2">
              <a href="/dashboard/orders" className="rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-medium text-slate-700">{t.quickOrders}</a>
              <a href="/#catalog" className="rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-medium text-slate-700">{t.quickCatalog}</a>
              <a href={slug ? `/s/${slug}` : "/"} className="rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-medium text-slate-700">{t.quickStorefront}</a>
              <a href="/dashboard/settings" className="rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-medium text-slate-700">{t.quickSettings}</a>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
