"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { OrderFormDB } from "@/components/order-form-db";
import {
  Store,
  MapPin,
  MessageCircle,
  Instagram,
  Facebook,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";

type Seller = {
  id: number;
  slug: string;
  name: string;
  description: string;
  ownerName: string;
  businessType: string;
  currency: string;
  city: string;
  logoUrl: string;
  socialLinks: { whatsapp?: string; instagram?: string; facebook?: string };
};

type CatalogItem = {
  id: number;
  sellerId: number;
  name: string;
  type: string;
  category: string;
  shortDescription: string;
  imageUrl: string;
  price: string;
  status: string;
};

type LocalSetup = {
  done?: boolean;
  data?: {
    storeName?: string;
    storefrontSlug?: string;
    ownerName?: string;
    businessType?: string;
    currency?: string;
    city?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    description?: string;
    logoUrl?: string;
  };
};

function loadLocalStorefront(slug: string): { seller: Seller | null; catalog: CatalogItem[] } {
  if (typeof window === "undefined") return { seller: null, catalog: [] };

  try {
    const rawSetup = localStorage.getItem("myshop_setup_v2");
    const rawCatalog = localStorage.getItem("myshop_catalog_v2");
    if (!rawSetup) return { seller: null, catalog: [] };

    const setup = JSON.parse(rawSetup) as LocalSetup;
    const data = setup?.data;
    if (!data) return { seller: null, catalog: [] };

    const localSlug = (data.storefrontSlug || "").trim();
    if (!localSlug || localSlug !== slug) return { seller: null, catalog: [] };

    const seller: Seller = {
      id: Number(localStorage.getItem("myshop_seller_id") || 0) || 0,
      slug: localSlug,
      name: data.storeName || "MyShop Store",
      description: data.description || "",
      ownerName: data.ownerName || "",
      businessType: data.businessType || "Retail",
      currency: data.currency || "USD",
      city: data.city || "",
      logoUrl: data.logoUrl || "",
      socialLinks: {
        whatsapp: data.whatsapp || "",
        instagram: data.instagram || "",
        facebook: data.facebook || "",
      },
    };

    const localCatalog = rawCatalog ? (JSON.parse(rawCatalog) as CatalogItem[]) : [];
    return { seller, catalog: Array.isArray(localCatalog) ? localCatalog : [] };
  } catch {
    return { seller: null, catalog: [] };
  }
}

const text = {
  en: {
    missing: "Store not found",
    hint: "This store doesn't exist or hasn't been set up yet.",
    loading: "Loading store...",
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
    hint: "Esta loja não existe ou ainda não foi configurada.",
    loading: "A carregar loja...",
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
  const t = text[lang];

  const [seller, setSeller] = useState<Seller | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [orderItem, setOrderItem] = useState<{ id: number | null; name: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`/api/sellers/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/catalog?sellerSlug=${slug}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([dbSeller, dbCatalog]) => {
        if (dbSeller && !dbSeller.error) {
          setSeller(dbSeller);
          if (Array.isArray(dbCatalog) && dbCatalog.length > 0) {
            setCatalog(dbCatalog);
          } else {
            const local = loadLocalStorefront(slug);
            setCatalog(Array.isArray(local.catalog) ? local.catalog : []);
          }
          return;
        }

        const local = loadLocalStorefront(slug);
        if (local.seller) {
          setSeller(local.seller);
          setCatalog(local.catalog);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        const local = loadLocalStorefront(slug);
        if (local.seller) {
          setSeller(local.seller);
          setCatalog(local.catalog);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-3 text-slate-500">{t.loading}</p>
      </main>
    );
  }

  if (notFound || !seller) {
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

  const social = seller.socialLinks || {};
  const publishedProducts = catalog.filter((i) => i.status === "Published" && i.type === "Product");
  const publishedServices = catalog.filter((i) => i.status === "Published" && i.type === "Service");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {orderItem && (
        <OrderFormDB
          sellerSlug={seller.slug}
          sellerId={seller.id}
          storeName={seller.name}
          itemId={orderItem.id}
          itemName={orderItem.name}
          onClose={() => setOrderItem(null)}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          {seller.logoUrl ? (
            <img src={seller.logoUrl} alt={seller.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <Store className="h-7 w-7 text-indigo-600" />
          )}
          <h1 className="text-3xl font-bold text-slate-900">{seller.name}</h1>
        </div>
        <p className="mt-1 text-slate-600">@{seller.slug}</p>
        {seller.description && <p className="mt-2 text-slate-700">{seller.description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-slate-700">
          <MapPin className="h-4 w-4 text-slate-400" />
          {seller.ownerName || "Owner"} · {seller.businessType || "Business"} · {seller.city || "—"}
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
          <SocialLink label="WhatsApp" href={social.whatsapp} icon={MessageCircle} />
          <SocialLink label="Instagram" href={social.instagram} icon={Instagram} />
          <SocialLink label="Facebook" href={social.facebook} icon={Facebook} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <CatalogSection
          title={t.products}
          emptyLabel={t.emptyProducts}
          items={publishedProducts}
          currency={seller.currency || "USD"}
          ctaLabel={t.order}
          onOrder={(item) => setOrderItem({ id: item.id, name: item.name })}
        />
        <CatalogSection
          title={t.services}
          emptyLabel={t.emptyServices}
          items={publishedServices}
          currency={seller.currency || "USD"}
          ctaLabel={t.book}
          onOrder={(item) => setOrderItem({ id: item.id, name: item.name })}
        />
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
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />
              )}
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

function SocialLink({ label, href, icon: Icon }: { label: string; href?: string; icon: React.ComponentType<{ className?: string }> }) {
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
