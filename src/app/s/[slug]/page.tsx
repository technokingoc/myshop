"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";

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
  },
  pt: {
    missing: "Loja não encontrada",
    hint: "Conclua a configuração na página inicial e volte a este URL.",
    products: "Produtos",
    services: "Serviços",
    social: "Links sociais",
    emptyProducts: "Ainda não há produtos publicados.",
    emptyServices: "Ainda não há serviços publicados.",
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

  if (!setup || !normalizedSlug || normalizedSlug !== setupSlug) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{t.missing}</h1>
          <p className="mt-2 text-slate-600">{t.hint}</p>
        </section>
      </main>
    );
  }

  const publishedProducts = catalog.filter((item) => item.status === "Published" && item.type === "Product");
  const publishedServices = catalog.filter((item) => item.status === "Published" && item.type === "Service");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{setup.storeName || "MyShop"}</h1>
        <p className="mt-1 text-slate-600">@{setupSlug}</p>
        <p className="mt-2 text-slate-700">
          {setup.ownerName || "Owner"} • {setup.businessType || "Business"} • {setup.city || "Maputo"}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SocialLink label="WhatsApp" href={setup.whatsapp} />
          <SocialLink label="Instagram" href={setup.instagram} />
          <SocialLink label="Facebook" href={setup.facebook} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <CatalogSection
          title={t.products}
          emptyLabel={t.emptyProducts}
          items={publishedProducts}
          currency={setup.currency || "USD"}
        />
        <CatalogSection
          title={t.services}
          emptyLabel={t.emptyServices}
          items={publishedServices}
          currency={setup.currency || "USD"}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t.social}</h2>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li>WhatsApp: {setup.whatsapp || "-"}</li>
          <li>Instagram: {setup.instagram || "-"}</li>
          <li>Facebook: {setup.facebook || "-"}</li>
        </ul>
      </section>
    </main>
  );
}

function CatalogSection({
  title,
  items,
  emptyLabel,
  currency,
}: {
  title: string;
  items: CatalogItem[];
  emptyLabel: string;
  currency: string;
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
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {currency} {item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function SocialLink({ label, href }: { label: string; href: string }) {
  if (!href) {
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{label}: -</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-indigo-700 underline underline-offset-2"
    >
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
