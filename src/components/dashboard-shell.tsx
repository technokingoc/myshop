"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
  Store,
  Menu,
  X,
} from "lucide-react";

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
type SetupPersisted = { step: number; done: boolean; data: SetupData };

const STORAGE_SETUP = "myshop_setup_v2";

const dict = {
  en: {
    dashboard: "Dashboard",
    catalog: "Catalog",
    orders: "Orders",
    analytics: "Analytics",
    settings: "Settings",
    storefront: "Storefront",
  },
  pt: {
    dashboard: "Painel",
    catalog: "Catálogo",
    orders: "Pedidos",
    analytics: "Análises",
    settings: "Configurações",
    storefront: "Loja",
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETUP);
      if (raw) setSetup(JSON.parse(raw));
    } catch {}
  }, []);

  const slug = useMemo(() => {
    if (!setup?.data) return "";
    return setup.data.storefrontSlug || sanitizeSlug(setup.data.storeName) || "myshop-demo";
  }, [setup]);

  const navItems = [
    { label: t.dashboard, icon: LayoutDashboard, href: "/dashboard", key: "dashboard" },
    { label: t.orders, icon: ShoppingCart, href: "/dashboard/orders", key: "orders" },
    { label: t.catalog, icon: Package, href: "/#catalog", key: "catalog" },
    { label: t.analytics, icon: BarChart3, href: "/dashboard/analytics", key: "analytics" },
    { label: t.settings, icon: Settings, href: "/dashboard/settings", key: "settings" },
    { label: t.storefront, icon: Store, href: slug ? `/s/${slug}` : "/", key: "storefront" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <nav className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <span className="font-semibold text-slate-900">MyShop</span>
              <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="mt-2 space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      item.key === activePage ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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

      <aside className="fixed left-0 top-[57px] hidden h-[calc(100vh-57px)] w-56 border-r border-slate-200 bg-white lg:block">
        <ul className="mt-4 space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  item.key === activePage ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="lg:ml-56">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-slate-900">
            {navItems.find((n) => n.key === activePage)?.label || "Dashboard"}
          </h1>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
