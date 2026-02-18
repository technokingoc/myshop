"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { OrderForm } from "@/components/order-form";
import {
  Store,
  MapPin,
  MessageCircle,
  Instagram,
  Facebook,
  ShoppingBag,
  Briefcase,
  Star,
  Clock,
  BarChart3,
  AlertCircle,
  Send,
} from "lucide-react";

type CatalogItem = {
  id: number;
  name: string;
  type: "Product" | "Service";
  category: string;
  shortDescription: string;
  imageUrl: string;
  price: string;
  status: "Draft" | "Published";
};

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

const STORAGE = {
  setup: "myshop_setup_v2",
  catalog: "myshop_catalog_v2",
};

const text = {
  en: {
    missing: "Store not found",
    hint: "Complete setup on the home page first, then revisit this URL.",
    products: "Products",
    services: "Services",
    social: "Social links",
    emptyProducts: "No published products yet.",
    emptyServices: "No published services yet.",
    order: "Order",
    book: "Book",
    orderGeneral: "Place an order",
  },
  pt: {
    missing: "Loja não encontrada",
    hint: "Conclua a configuração na página inicial e volte a este URL.",
    products: "Produtos",
    services: "Serviços",
    social: "Links sociais",
    emptyProducts: "Ainda não há produtos publicados.",
    emptyServices: "Ainda não há serviços publicados.",
    order: "Encomendar",
    book: "Reservar",
    orderGeneral: "Fazer um pedido",
  },
};

export default function StorefrontPage() {
  const { lang } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const [setup] = useState<SetupData | null>(() => {
    if (typeof window === "undefined") return null;
    const rawSetup = localStorage.getItem(STORAGE.setup);
    if (!rawSetup) return null;
    try {
      const parsed = JSON.parse(rawSetup) as SetupPersisted;
      return parsed.data;
    } catch {
      return null;
    }
  });

  const [catalog] = useState<CatalogItem[]>(() => {
    if (typeof window === "undefined") return [];
    const rawCatalog = localStorage.getItem(STORAGE.catalog);
    if (!rawCatalog) return [];
    try {
      const parsed = JSON.parse(rawCatalog) as CatalogItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const t = text[lang];
  const normalizedSlug = useMemo(() => sanitizeSlug(slug ?? ""), [slug]);
  const setupSlug = useMemo(() => sanitizeSlug(setup?.storefrontSlug || setup?.storeName || ""), [setup]);

  // In the local-storage MVP, the storefront preview works only in the same browser.
  // We skip slug matching — any valid setup data enables the preview.
  if (!setup) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{t.missing}</h1>
          <p className="mt-2 text-slate-600">{t.hint}</p>
        </section>
      </main>
    );
  }

  const publishedProducts = catalog.filter((item) => item.status === "Published" && item.type === "Product");
  const publishedServices = catalog.filter((item) => item.status === "Published" && item.type === "Service");

  const [orderItem, setOrderItem] = useState<{ id: number | null; name: string } | null>(null);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {orderItem && (
        <OrderForm
          storeName={setup.storeName}
          itemId={orderItem.id}
          itemName={orderItem.name}
          onClose={() => setOrderItem(null)}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900">{setup.storeName || "MyShop"}</h1>
        </div>
        <p className="mt-1 text-slate-600">@{setupSlug}</p>
        <p className="mt-2 flex items-center gap-1.5 text-slate-700">
          <MapPin className="h-4 w-4 text-slate-400" />
          {setup.ownerName || "Owner"} · {setup.businessType || "Business"} · {setup.city || "Maputo"}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOrderItem({ id: null, name: "" })}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            {t.orderGeneral}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SocialLink label="WhatsApp" href={setup.whatsapp} icon={MessageCircle} />
          <SocialLink label="Instagram" href={setup.instagram} icon={Instagram} />
          <SocialLink label="Facebook" href={setup.facebook} icon={Facebook} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <CatalogSection
          title={t.products}
          emptyLabel={t.emptyProducts}
          items={publishedProducts}
          currency={setup.currency || "USD"}
          ctaLabel={t.order}
          onOrder={(item) => setOrderItem({ id: item.id, name: item.name })}
        />
        <CatalogSection
          title={t.services}
          emptyLabel={t.emptyServices}
          items={publishedServices}
          currency={setup.currency || "USD"}
          ctaLabel={t.book}
          onOrder={(item) => setOrderItem({ id: item.id, name: item.name })}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t.social}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <SocialLink label="WhatsApp" href={setup.whatsapp} icon={MessageCircle} />
          <SocialLink label="Instagram" href={setup.instagram} icon={Instagram} />
          <SocialLink label="Facebook" href={setup.facebook} icon={Facebook} />
        </div>
      </section>
    </main>
  );
}

function CatalogSection({
  title,
  items,
  emptyLabel,
  currency,
  ctaLabel,
  onOrder,
}: {
  title: string;
  items: CatalogItem[];
  emptyLabel: string;
  currency: string;
  ctaLabel: string;
  onOrder: (item: CatalogItem) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-slate-600">{emptyLabel}</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />
              <div className="p-3">
                <p className="text-xs text-slate-500">{item.category || "General"}</p>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.shortDescription}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {currency} {item.price}
                  </p>
                  <button
                    onClick={() => onOrder(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <Send className="h-3 w-3" />
                    {ctaLabel}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function SocialLink({ label, href, icon: Icon }: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  if (!href) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
        <Icon className="h-4 w-4" />
        {label}: —
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-indigo-700 underline underline-offset-2"
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

function sanitizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
