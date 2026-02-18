"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { OrderFormDB } from "@/components/order-form-db";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { Store, MapPin, MessageCircle, Instagram, Facebook, AlertCircle, Send, Loader2, ShieldCheck, Clock3 } from "lucide-react";

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
  socialLinks: { whatsapp: string; instagram: string; facebook: string };
};

type CatalogItem = {
  id: number;
  sellerId: number;
  name: string;
  type: "Product" | "Service";
  category: string;
  shortDescription: string;
  imageUrl: string;
  price: string;
  status: "Draft" | "Published";
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

const SAFE_TYPES: CatalogItem["type"][] = ["Product", "Service"];
const SAFE_STATUS: CatalogItem["status"][] = ["Draft", "Published"];

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function asSafeEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  const candidate = asString(value).trim();
  return allowed.includes(candidate as T) ? (candidate as T) : fallback;
}

function parseSocialLinks(value: unknown): Seller["socialLinks"] {
  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = null;
    }
  }

  const obj = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

  return {
    whatsapp: asString(obj.whatsapp),
    instagram: asString(obj.instagram),
    facebook: asString(obj.facebook),
  };
}

function normalizeSeller(input: unknown): Seller | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;

  return {
    id: asNumber(row.id),
    slug: asString(row.slug).trim(),
    name: asString(row.name),
    description: asString(row.description),
    ownerName: asString(row.ownerName),
    businessType: asString(row.businessType),
    currency: asString(row.currency),
    city: asString(row.city),
    logoUrl: asString(row.logoUrl),
    socialLinks: parseSocialLinks(row.socialLinks),
  };
}

function normalizeCatalog(input: unknown): CatalogItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((raw) => {
    const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
      id: asNumber(row.id),
      sellerId: asNumber(row.sellerId),
      name: asString(row.name),
      type: asSafeEnum(row.type, SAFE_TYPES, "Product"),
      category: asString(row.category),
      shortDescription: asString(row.shortDescription),
      imageUrl: asString(row.imageUrl),
      price: asString(row.price),
      status: asSafeEnum(row.status, SAFE_STATUS, "Draft"),
    };
  });
}

function logStorefrontIssue(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[storefront] ${event}`, details);
  }
}

function loadLocalStorefront(slug: string): { seller: Seller | null; catalog: CatalogItem[] } {
  if (typeof window === "undefined") return { seller: null, catalog: [] };

  const rawSetup = localStorage.getItem("myshop_setup_v2");
  const rawCatalog = localStorage.getItem("myshop_catalog_v2");
  if (!rawSetup) return { seller: null, catalog: [] };

  const setup = JSON.parse(rawSetup) as LocalSetup;
  const data = setup?.data;
  if (!data) return { seller: null, catalog: [] };

  const localSlug = asString(data.storefrontSlug).trim();
  if (!localSlug || localSlug !== slug) return { seller: null, catalog: [] };

  const seller = normalizeSeller({
    id: localStorage.getItem("myshop_seller_id") || 0,
    slug: localSlug,
    name: data.storeName,
    description: data.description,
    ownerName: data.ownerName,
    businessType: data.businessType,
    currency: data.currency,
    city: data.city,
    logoUrl: data.logoUrl,
    socialLinks: {
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      facebook: data.facebook,
    },
  });

  return {
    seller,
    catalog: normalizeCatalog(rawCatalog ? JSON.parse(rawCatalog) : []),
  };
}

const text = {
  en: {
    missing: "Store not found",
    hint: "This store doesn't exist or hasn't been set up yet.",
    loading: "Loading store...",
    products: "Products",
    services: "Services",
    emptyProducts: "No published products yet.",
    emptyServices: "No published services yet.",
    order: "Order",
    book: "Book",
    orderGeneral: "Place an order",
    trustTitle: "Why customers trust this seller",
    trustSummary: "Business summary",
    trustResponse: "Typical response time",
    trustPolicy: "Order policy",
    responsePlaceholder: "Usually replies within a few hours",
    policyPlaceholder: "Orders are confirmed via direct message and fulfilled per seller availability.",
    emptyCatalogTitle: "Catalog is being prepared",
    emptyCatalogHint: "This seller has not published products or services yet. You can still contact them directly.",
    contactSeller: "Contact seller",
    dbBanner: "Temporary connection issue. Showing available fallback content.",
    hydrationError: "We couldn't load this storefront completely. Showing safe fallback data.",
    discover: "Find items quickly",
    search: "Search products/services",
    all: "All",
    infoTitle: "Important info",
    delivery: "Delivery",
    policy: "Policy",
    payment: "Payment",
    deliveryText: "Delivery/collection is agreed directly with the seller.",
    policyText: "Orders are confirmed by direct contact and stock availability.",
    paymentText: "Payments happen via external safe links. MyShop does not capture cards.",
  },
  pt: {
    missing: "Loja não encontrada",
    hint: "Esta loja não existe ou ainda não foi configurada.",
    loading: "A carregar loja...",
    products: "Produtos",
    services: "Serviços",
    emptyProducts: "Ainda não há produtos publicados.",
    emptyServices: "Ainda não há serviços publicados.",
    order: "Encomendar",
    book: "Reservar",
    orderGeneral: "Fazer um pedido",
    trustTitle: "Porque os clientes confiam neste vendedor",
    trustSummary: "Resumo do negócio",
    trustResponse: "Tempo de resposta típico",
    trustPolicy: "Política de pedidos",
    responsePlaceholder: "Normalmente responde em poucas horas",
    policyPlaceholder: "Pedidos são confirmados por mensagem direta e cumpridos conforme disponibilidade do vendedor.",
    emptyCatalogTitle: "Catálogo em preparação",
    emptyCatalogHint: "Este vendedor ainda não publicou produtos ou serviços. Ainda pode contactá-lo diretamente.",
    contactSeller: "Contactar vendedor",
    dbBanner: "Falha temporária de ligação. A mostrar conteúdo de fallback disponível.",
    hydrationError: "Não foi possível carregar esta loja por completo. A mostrar fallback seguro.",
    discover: "Encontre itens rapidamente",
    search: "Pesquisar produtos/serviços",
    all: "Todos",
    infoTitle: "Informações importantes",
    delivery: "Entrega",
    policy: "Política",
    payment: "Pagamento",
    deliveryText: "Entrega/recolha é combinada diretamente com o vendedor.",
    policyText: "Pedidos são confirmados por contacto direto e disponibilidade de stock.",
    paymentText: "Pagamentos acontecem por links externos seguros. O MyShop não captura cartões.",
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
  const [banner, setBanner] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    if (!slug) return;

    const hydrateStorefront = async () => {
      setLoading(true);
      setNotFound(false);
      setBanner(null);

      try {
        const [dbSeller, dbCatalog] = await Promise.all([
          fetchJsonWithRetry<unknown>(`/api/sellers/${slug}`),
          fetchJsonWithRetry<unknown>(`/api/catalog?sellerSlug=${slug}`),
        ]);

        const normalizedSeller = normalizeSeller(dbSeller);
        const normalizedCatalog = normalizeCatalog(dbCatalog);

        if (!normalizedSeller || !normalizedSeller.slug) {
          throw new Error("Invalid seller payload");
        }

        setSeller(normalizedSeller);
        setCatalog(normalizedCatalog);
      } catch (dbError) {
        logStorefrontIssue("db hydrate failed", {
          slug,
          message: dbError instanceof Error ? dbError.message : "unknown",
        });

        try {
          const local = loadLocalStorefront(slug);

          if (local.seller) {
            setSeller(local.seller);
            setCatalog(local.catalog);
            setBanner(t.dbBanner);
          } else {
            setNotFound(true);
          }
        } catch (localError) {
          logStorefrontIssue("local fallback parse failed", {
            slug,
            message: localError instanceof Error ? localError.message : "unknown",
          });
          setSeller(null);
          setCatalog([]);
          setBanner(t.hydrationError);
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    hydrateStorefront();
  }, [slug, t.dbBanner, t.hydrationError]);

  if (loading) return <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" /><p className="mt-3 text-slate-500">{t.loading}</p></main>;
  if (notFound || !seller) return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-3 text-2xl font-bold text-slate-900">{t.missing}</h1><p className="mt-2 text-slate-600">{t.hint}</p></section></main>;

  const social = seller.socialLinks;
  const published = catalog.filter((i) => i.status === "Published");
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(published.map((i) => asString(i.category).trim()).filter(Boolean)))],
    [published],
  );

  const discovered = published.filter((i) => {
    if (category !== "all" && i.category !== category) return false;
    const query = asString(search).trim().toLowerCase();
    if (!query) return true;

    return asString(i.name).toLowerCase().includes(query) || asString(i.shortDescription).toLowerCase().includes(query);
  });

  const publishedProducts = discovered.filter((i) => i.type === "Product");
  const publishedServices = discovered.filter((i) => i.type === "Service");
  const hasCatalog = published.length > 0;
  const contactHref = social.whatsapp || social.instagram || social.facebook || "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      {orderItem && <OrderFormDB sellerSlug={seller.slug} sellerId={seller.id} storeName={seller.name} itemId={orderItem.id} itemName={orderItem.name} onClose={() => setOrderItem(null)} />}
      {banner && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{banner}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">{seller.logoUrl ? <img src={seller.logoUrl} alt={seller.name} className="h-10 w-10 rounded-full object-cover" /> : <Store className="h-7 w-7 text-indigo-600" />}<h1 className="text-3xl font-bold text-slate-900">{seller.name}</h1></div>
        <p className="mt-1 text-slate-600">@{seller.slug}</p>
        {seller.description && <p className="mt-2 text-slate-700">{seller.description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-slate-700"><MapPin className="h-4 w-4 text-slate-400" />{seller.ownerName || "Owner"} · {seller.businessType || "Business"} · {seller.city || "—"}</p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" />{t.trustTitle}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div><p className="text-slate-500">{t.trustSummary}</p><p className="font-medium text-slate-800">{seller.businessType || "Micro business"} · {seller.city || "—"}</p></div>
            <div><p className="text-slate-500">{t.trustResponse}</p><p className="font-medium text-slate-800 flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{t.responsePlaceholder}</p></div>
            <div><p className="text-slate-500">{t.trustPolicy}</p><p className="font-medium text-slate-800">{t.policyPlaceholder}</p></div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SocialLink label="WhatsApp" href={social.whatsapp} icon={MessageCircle} />
          <SocialLink label="Instagram" href={social.instagram} icon={Instagram} />
          <SocialLink label="Facebook" href={social.facebook} icon={Facebook} />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{t.infoTitle}</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3 text-sm">
            <div><p className="font-medium text-slate-800">{t.delivery}</p><p className="text-slate-600">{t.deliveryText}</p></div>
            <div><p className="font-medium text-slate-800">{t.policy}</p><p className="text-slate-600">{t.policyText}</p></div>
            <div><p className="font-medium text-slate-800">{t.payment}</p><p className="text-slate-600">{t.paymentText}</p></div>
          </div>
        </div>
      </section>

      {hasCatalog && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t.discover}</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`rounded-full border px-3 py-1 text-xs ${category === cat ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-700"}`}>
                {cat === "all" ? t.all : cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {!hasCatalog ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">{t.emptyCatalogTitle}</h2>
          <p className="mt-2 text-slate-600">{t.emptyCatalogHint}</p>
          {contactHref && <a href={contactHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><MessageCircle className="h-4 w-4" />{t.contactSeller}</a>}
        </section>
      ) : (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <CatalogSection title={t.products} emptyLabel={t.emptyProducts} items={publishedProducts} currency={seller.currency || "USD"} ctaLabel={t.order} onOrder={(item) => setOrderItem({ id: item.id, name: item.name })} />
          <CatalogSection title={t.services} emptyLabel={t.emptyServices} items={publishedServices} currency={seller.currency || "USD"} ctaLabel={t.book} onOrder={(item) => setOrderItem({ id: item.id, name: item.name })} />
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex w-full max-w-6xl gap-2">
          <button onClick={() => setOrderItem({ id: null, name: "" })} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"><Send className="h-4 w-4" />{t.orderGeneral}</button>
          {contactHref && <a href={contactHref} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><MessageCircle className="h-4 w-4" />{t.contactSeller}</a>}
        </div>
      </div>
    </main>
  );
}

function CatalogSection({ title, items, emptyLabel, currency, ctaLabel, onOrder }: { title: string; items: CatalogItem[]; emptyLabel: string; currency: string; ctaLabel: string; onOrder: (item: CatalogItem) => void }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-xl font-semibold text-slate-900">{title}</h2>{items.length === 0 ? <p className="mt-2 text-slate-600">{emptyLabel}</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">{item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-36 w-full object-cover" />}<div className="p-3"><p className="text-xs text-slate-500">{item.category || "General"}</p><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-sm text-slate-600">{item.shortDescription}</p><div className="mt-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">{currency} {item.price}</p><button onClick={() => onOrder(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"><Send className="h-3 w-3" />{ctaLabel}</button></div></div></div>)}</div>}</article>;
}

function SocialLink({ label, href, icon: Icon }: { label: string; href?: string; icon: React.ComponentType<{ className?: string }> }) {
  if (!href) return <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500"><Icon className="h-4 w-4" />{label}: —</div>;
  return <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-indigo-700 underline underline-offset-2"><Icon className="h-4 w-4" />{label}</a>;
}
