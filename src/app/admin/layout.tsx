"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { LanguageSwitch } from "@/components/language-switch";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  Shield,
  FolderTree,
  MapPin,
} from "lucide-react";
import { clearSession, fetchSession, type AuthSession } from "@/lib/auth";

const dict = {
  en: {
    brand: "MyShop Admin",
    dashboard: "Dashboard",
    sellers: "Sellers",
    orders: "Orders",
    products: "Products",
    categories: "Categories",
    locations: "Locations",
    reviews: "Reviews",
    settings: "Settings",
    logout: "Logout",
    backToSite: "Back to site",
    forbidden: "Access denied. Admin role required.",
    loading: "Loading...",
  },
  pt: {
    brand: "MyShop Admin",
    dashboard: "Painel",
    sellers: "Vendedores",
    orders: "Pedidos",
    products: "Produtos",
    categories: "Categorias",
    locations: "Localizações",
    reviews: "Avaliações",
    settings: "Configurações",
    logout: "Sair",
    backToSite: "Voltar ao site",
    forbidden: "Acesso negado. Função de administrador necessária.",
    loading: "A carregar...",
  },
};

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "sellers", href: "/admin/sellers", icon: Users },
  { key: "orders", href: "/admin/orders", icon: ShoppingCart },
  { key: "products", href: "/admin/products", icon: Package },
  { key: "categories", href: "/admin/categories", icon: FolderTree },
  { key: "locations", href: "/admin/locations", icon: MapPin },
  { key: "reviews", href: "/admin/reviews", icon: MessageSquare },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden" | "unauth">("loading");

  const activePage = useMemo(() => {
    if (pathname === "/admin") return "dashboard";
    const seg = pathname.split("/")[2];
    return seg || "dashboard";
  }, [pathname]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    fetchSession().then((s) => {
      if (!s) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        setStatus("unauth");
        return;
      }
      setSession(s);
      if (s.role === "admin") {
        setStatus("ok");
      } else {
        setStatus("forbidden");
      }
    });
  }, [pathname, router]);

  if (status === "loading" || status === "unauth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">{t.loading}</p>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <Shield className="h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">{t.forbidden}</p>
        <Link href="/" className="text-sm text-violet-600 hover:underline">{t.backToSite}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <nav className="absolute left-0 top-0 h-full w-64 bg-slate-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{t.brand}</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav items={navItems} activePage={activePage} t={t} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-56 bg-slate-900 lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-4">
          <Shield className="h-5 w-5 text-violet-400" />
          <span className="text-sm font-bold text-white">{t.brand}</span>
        </div>
        <nav className="p-3">
          <SidebarNav items={navItems} activePage={activePage} t={t} />
        </nav>
        <div className="absolute bottom-0 left-0 w-full border-t border-slate-800 p-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
            <Home className="h-3.5 w-3.5" />
            {t.backToSite}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-slate-500 lg:hidden">{t.brand}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-violet-50/50 px-2.5 py-1.5 sm:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                {(session?.storeName || "A").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700">{session?.email}</span>
            </div>
            <button
              onClick={async () => { await clearSession(); window.location.href = "/login"; }}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <ul className="grid grid-cols-8">
            {navItems.map((item) => {
              const active = item.key === activePage;
              const label = t[item.key as keyof typeof t] || item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-violet-700" : "text-slate-500"}`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-violet-600" : "text-slate-400"}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function SidebarNav({
  items,
  activePage,
  t,
}: {
  items: typeof navItems;
  activePage: string;
  t: Record<string, string>;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = item.key === activePage;
        const label = t[item.key as keyof typeof t] || item.key;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-600/20 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-violet-400" : "text-slate-500"}`} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
