"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Heart, Package, LogOut, Store, MapPin, MessageSquare, Settings } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: { 
    profile: "Profile", wishlist: "Wishlist", orders: "Orders", addresses: "Addresses", 
    reviews: "Reviews", settings: "Settings", logout: "Logout", home: "MyShop" 
  },
  pt: { 
    profile: "Perfil", wishlist: "Favoritos", orders: "Pedidos", addresses: "Endereços", 
    reviews: "Avaliações", settings: "Configurações", logout: "Sair", home: "MyShop" 
  },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const pathname = usePathname();

  const links = [
    { href: "/customer/profile", label: t.profile, icon: User },
    { href: "/customer/orders", label: t.orders, icon: Package },
    { href: "/customer/wishlist", label: t.wishlist, icon: Heart },
    { href: "/customer/addresses", label: t.addresses, icon: MapPin },
    { href: "/customer/reviews", label: t.reviews, icon: MessageSquare },
    { href: "/customer/settings", label: t.settings, icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-indigo-600">
            <Store className="h-4 w-4" /> {t.home}
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
          
          {/* Mobile Navigation */}
          <nav className="flex lg:hidden items-center gap-1">
            {links.slice(0, 3).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${
                  pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <l.icon className="h-4 w-4" />
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      
      {/* Mobile Secondary Navigation */}
      <div className="lg:hidden border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex items-center gap-1 py-2">
            {links.slice(3).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
