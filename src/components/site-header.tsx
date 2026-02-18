"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { LanguageSwitch } from "@/components/language-switch";

const menuSections = {
  product: [
    { href: "/", label: "Storefront builder", desc: "Professional catalog pages in minutes" },
    { href: "/pricing", label: "Pricing", desc: "Transparent plans for every seller stage" },
  ],
  sellers: [
    { href: "/setup", label: "Seller setup", desc: "Onboard your store with guided steps" },
    { href: "/dashboard", label: "Dashboard", desc: "Manage catalog, orders and channels" },
  ],
};

function MegaMenu({ label, items }: { label: string; items: { href: string; label: string; desc: string }[] }) {
  return (
    <div className="group relative">
      <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-2 w-[21rem] translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="block rounded-xl px-3 py-2.5 hover:bg-slate-50">
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/85 backdrop-blur-xl">
      <div className="ui-container">
        <div className="flex h-[4.4rem] items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-md px-1 py-1 text-base font-semibold tracking-tight text-slate-900">
              MyShop
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <MegaMenu label="Product" items={menuSections.product} />
              <MegaMenu label="Sellers" items={menuSections.sellers} />
              <Link href="/login" className="rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Login
              </Link>
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitch />
            <Link href="/setup" className="ui-btn ui-btn-primary">
              Start free
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="space-y-1">
            {[...menuSections.product, ...menuSections.sellers].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Login
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <LanguageSwitch />
            <Link href="/setup" onClick={() => setOpen(false)} className="ui-btn ui-btn-primary">
              Start free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
