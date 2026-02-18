"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import {
  Store,
  MapPin,
  MessageCircle,
  Instagram,
  Facebook,
  AlertCircle,
  Loader2,
  ShoppingBag,
  X,
  Send,
  CheckCircle,
  Home,
  Package,
  Star,
  MessageSquare,
  Phone,
  Info,
  Image as ImageIcon,
} from "lucide-react";
import { PlaceholderImage, AvatarPlaceholder } from "@/components/placeholder-image";
import { getTheme } from "@/lib/theme-colors";
import { StoreJsonLd, ProductJsonLd } from "@/components/json-ld";

/* ── Safe image wrapper ── */
function SafeImg({ src, alt = "", className, fallback }: { src?: string | null; alt?: string; className?: string; fallback?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback ? <>{fallback}</> : null;
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

/* ── Types ── */
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
  bannerUrl: string;
  socialLinks: { whatsapp?: string; instagram?: string; facebook?: string };
  themeColor: string;
  address: string;
  country: string;
  businessHours: Record<string, { open: string; close: string }>;
};

type Product = {
  id: number;
  sellerId: number;
  name: string;
  type: string;
  category: string;
  shortDescription: string;
  imageUrl: string;
  imageUrls: string;
  price: string;
  status: string;
};

type Comment = {
  id: number;
  catalogItemId: number | null;
  sellerId: number | null;
  authorName: string;
  authorEmail: string | null;
  content: string;
  rating: number | null;
  createdAt: string;
};

/* ── i18n ── */
const dict = {
  en: {
    loading: "Loading store...",
    notFound: "Store not found",
    notFoundHint: "This store doesn't exist or hasn't been set up yet.",
    goHome: "Go home",
    tabProducts: "Products",
    tabAbout: "About",
    tabReviews: "Reviews",
    tabContact: "Contact",
    allCategories: "All",
    noProducts: "No products yet",
    noProductsHint: "This seller hasn't published any products yet.",
    order: "Order",
    details: "Details",
    reviews: "Reviews",
    orderTab: "Order",
    addToOrder: "Order",
    orderTitle: "Place an Order",
    orderName: "Your name",
    orderNamePh: "Full name",
    orderContact: "Email or phone",
    orderContactPh: "email@example.com or +258...",
    orderQty: "Quantity",
    orderNotes: "Notes (optional)",
    orderNotesPh: "Any details or questions...",
    orderSubmit: "Send order",
    orderSending: "Sending...",
    orderSuccess: "Order placed successfully!",
    orderRef: "Reference",
    orderSuccessHint: "The seller will contact you soon.",
    close: "Close",
    noReviews: "No reviews yet",
    writeReview: "Write a review",
    yourName: "Your name",
    yourReview: "Your review...",
    submitReview: "Submit",
    submitting: "Submitting...",
    reviewSubmitted: "Review submitted!",
    rating: "Rating",
    aboutStore: "About this store",
    businessType: "Business type",
    location: "Location",
    contactInfo: "Contact Information",
    whatsapp: "WhatsApp",
    socialLinks: "Social Links",
    avgRating: "Average rating",
    based: "based on",
    reviewsCount: "reviews",
    products: "products",
  },
  pt: {
    loading: "A carregar loja...",
    notFound: "Loja não encontrada",
    notFoundHint: "Esta loja não existe ou ainda não foi configurada.",
    goHome: "Ir para início",
    tabProducts: "Produtos",
    tabAbout: "Sobre",
    tabReviews: "Avaliações",
    tabContact: "Contacto",
    allCategories: "Todos",
    noProducts: "Ainda sem produtos",
    noProductsHint: "Este vendedor ainda não publicou produtos.",
    order: "Encomendar",
    details: "Detalhes",
    reviews: "Avaliações",
    orderTab: "Encomendar",
    addToOrder: "Encomendar",
    orderTitle: "Fazer um Pedido",
    orderName: "Seu nome",
    orderNamePh: "Nome completo",
    orderContact: "Email ou telefone",
    orderContactPh: "email@exemplo.com ou +258...",
    orderQty: "Quantidade",
    orderNotes: "Notas (opcional)",
    orderNotesPh: "Detalhes ou perguntas...",
    orderSubmit: "Enviar pedido",
    orderSending: "A enviar...",
    orderSuccess: "Pedido feito com sucesso!",
    orderRef: "Referência",
    orderSuccessHint: "O vendedor entrará em contacto em breve.",
    close: "Fechar",
    noReviews: "Ainda sem avaliações",
    writeReview: "Escrever avaliação",
    yourName: "Seu nome",
    yourReview: "Sua avaliação...",
    submitReview: "Enviar",
    submitting: "A enviar...",
    reviewSubmitted: "Avaliação enviada!",
    rating: "Classificação",
    aboutStore: "Sobre esta loja",
    businessType: "Tipo de negócio",
    location: "Localização",
    contactInfo: "Informações de Contacto",
    whatsapp: "WhatsApp",
    socialLinks: "Redes Sociais",
    avgRating: "Classificação média",
    based: "baseado em",
    reviewsCount: "avaliações",
    products: "produtos",
  },
};

export default function StorefrontPage() {
  const { lang } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const t = useMemo(() => dict[lang], [lang]);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "about" | "reviews" | "contact">("products");
  const [category, setCategory] = useState("all");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/storefront/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setSeller(data.seller);
        setProducts((data.products || []).filter((p: Product) => p.status === "Published"));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["all", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    if (category === "all") return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (notFound || !seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">{t.notFound}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.notFoundHint}</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Home className="h-4 w-4" /> {t.goHome}
        </Link>
      </div>
    );
  }

  const theme = getTheme(seller.themeColor || "indigo");
  const social = seller.socialLinks || {};
  const tabs = [
    { id: "products" as const, label: t.tabProducts, icon: Package },
    { id: "about" as const, label: t.tabAbout, icon: Info },
    { id: "reviews" as const, label: t.tabReviews, icon: MessageSquare },
    { id: "contact" as const, label: t.tabContact, icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Structured data */}
      <StoreJsonLd
        name={seller.name}
        description={seller.description || ""}
        url={typeof window !== "undefined" ? window.location.href : `/s/${slug}`}
        logo={seller.logoUrl || undefined}
        image={seller.bannerUrl || undefined}
        address={seller.address || undefined}
        city={seller.city || undefined}
        country={seller.country || undefined}
      />
      {products.map((p) => (
        <ProductJsonLd
          key={p.id}
          name={p.name}
          description={p.shortDescription || undefined}
          image={p.imageUrl || undefined}
          price={p.price}
          currency={seller.currency || "USD"}
          url={typeof window !== "undefined" ? window.location.href : `/s/${slug}`}
          seller={seller.name}
        />
      ))}

      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-700">MyShop</Link>
          <div className="flex items-center gap-1">
            {social.whatsapp && (
              <a href={social.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-600">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-pink-600">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Compact store header */}
      <div className="mx-auto max-w-5xl px-4">
        {/* Banner */}
        <div className="relative mt-2 h-[100px] overflow-hidden rounded-xl sm:h-[120px]">
          {seller.bannerUrl ? (
            <SafeImg
              src={seller.bannerUrl}
              alt={`${seller.name} banner`}
              className="h-full w-full object-cover"
              fallback={
                <div className={`flex h-full items-center justify-center bg-gradient-to-r ${theme.gradient}`}>
                  <span className="text-xl font-bold text-white/80">{seller.name}</span>
                </div>
              }
            />
          ) : (
            <div className={`flex h-full items-center justify-center bg-gradient-to-r ${theme.gradient}`}>
              <span className="text-xl font-bold text-white/80">{seller.name}</span>
            </div>
          )}
        </div>

        {/* Store info — overlaps banner */}
        <div className="relative -mt-6 flex items-end gap-3 px-2 sm:px-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm">
            {seller.logoUrl ? (
              <SafeImg src={seller.logoUrl} alt={seller.name} className="h-full w-full object-cover" fallback={<AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />} />
            ) : (
              <AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <h1 className="truncate text-lg font-bold text-slate-900">{seller.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              {seller.city && (
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {seller.city}</span>
              )}
              {seller.businessType && <span>{seller.businessType}</span>}
              <span>{products.length} {t.products}</span>
            </div>
          </div>
        </div>
        {seller.description && (
          <p className="mt-2 truncate px-2 text-sm text-slate-500 sm:px-4">{seller.description}</p>
        )}
      </div>

      {/* Tab bar — sticky */}
      <div className="sticky top-12 z-20 mt-3 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl px-4">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium transition-colors sm:flex-none sm:px-5 sm:text-sm ${
                activeTab === tb.id
                  ? `${theme.tabBorder} ${theme.tab}`
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tb.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tb.label}</span>
              <span className="sm:hidden">{tb.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:pb-8">
        {activeTab === "products" && (
          <ProductsTab
            products={filtered}
            categories={categories}
            category={category}
            setCategory={setCategory}
            currency={seller.currency || "USD"}
            t={t}
            theme={theme}
            onProductClick={setModalProduct}
          />
        )}
        {activeTab === "about" && <AboutTab seller={seller} t={t} />}
        {activeTab === "reviews" && <ReviewsTab sellerId={seller.id} t={t} />}
        {activeTab === "contact" && <ContactTab seller={seller} t={t} />}
      </main>

      {/* Product detail modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          slug={seller.slug}
          currency={seller.currency || "USD"}
          t={t}
          theme={theme}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  );
}

/* ── Products Tab ── */
function ProductsTab({
  products,
  categories,
  category,
  setCategory,
  currency,
  t,
  theme,
  onProductClick,
}: {
  products: Product[];
  categories: string[];
  category: string;
  setCategory: (c: string) => void;
  currency: string;
  t: Record<string, string>;
  theme: ReturnType<typeof getTheme>;
  onProductClick: (p: Product) => void;
}) {
  return (
    <>
      {categories.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === cat
                  ? theme.pillActive
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {cat === "all" ? t.allCategories : cat}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">{t.noProducts}</p>
          <p className="mt-0.5 text-xs text-slate-400">{t.noProductsHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
              onClick={() => onProductClick(product)}
            >
              {product.imageUrl ? (
                <SafeImg src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" fallback={<PlaceholderImage className="aspect-square w-full" />} />
              ) : (
                <PlaceholderImage className="aspect-square w-full" />
              )}
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                <p className={`mt-1 text-sm font-bold ${theme.text}`}>{currency} {product.price}</p>
              </div>
              <div className="px-3 pb-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-lg ${theme.btn} py-2 text-xs font-semibold text-white ${theme.btnHover}`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {t.order}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

/* ── About Tab ── */
function AboutTab({ seller, t }: { seller: Seller; t: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.aboutStore}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {seller.description || "—"}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {seller.businessType && (
            <div>
              <span className="text-xs text-slate-400">{t.businessType}</span>
              <p className="font-medium text-slate-700">{seller.businessType}</p>
            </div>
          )}
          {seller.city && (
            <div>
              <span className="text-xs text-slate-400">{t.location}</span>
              <p className="font-medium text-slate-700">{seller.city}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reviews Tab ── */
function ReviewsTab({ sellerId, t }: { sellerId: number; t: Record<string, string> }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?sellerId=${sellerId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [sellerId]);

  const avgRating = useMemo(() => {
    const rated = comments.filter((c) => c.rating);
    if (rated.length === 0) return 0;
    return Math.round((rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length) * 10) / 10;
  }, [comments]);

  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    comments.forEach((c) => { if (c.rating && c.rating >= 1 && c.rating <= 5) dist[c.rating - 1]++; });
    return dist;
  }, [comments]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, authorName: name.trim(), content: content.trim(), rating }),
      });
      if (res.ok) {
        const c = await res.json();
        setComments((prev) => [c, ...prev]);
        setName(""); setContent(""); setRating(5); setSent(true); setShowForm(false);
        setTimeout(() => setSent(false), 3000);
      }
    } catch {} finally { setSending(false); }
  };

  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="space-y-4">
      {/* Rating summary */}
      {comments.length > 0 && (
        <div className="flex items-start gap-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{avgRating}</p>
            <StarRating rating={Math.round(avgRating)} />
            <p className="mt-1 text-xs text-slate-400">{t.based} {comments.length} {t.reviewsCount}</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-500">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${(distribution[star - 1] / maxDist) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right text-slate-400">{distribution[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review */}
      <div className="flex items-center justify-between">
        {!showForm && !sent && (
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {t.writeReview}
          </button>
        )}
        {sent && <span className="text-sm text-emerald-600">✓ {t.reviewSubmitted}</span>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          <div>
            <label className="text-xs font-medium text-slate-500">{t.rating}</label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.yourReview} required rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? t.submitting : t.submitReview}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">{t.close}</button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loaded && comments.length === 0 && !showForm && (
        <p className="py-8 text-center text-sm text-slate-400">{t.noReviews}</p>
      )}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{c.authorName}</span>
              <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            {c.rating && <StarRating rating={c.rating} />}
            <p className="mt-1 text-sm text-slate-600">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Contact Tab ── */
function ContactTab({ seller, t }: { seller: Seller; t: Record<string, string> }) {
  const social = seller.socialLinks || {};
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.contactInfo}</h3>
        {seller.city && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" /> {seller.city}
          </div>
        )}
        {social.whatsapp && (
          <a href={social.whatsapp} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700">
            <MessageCircle className="h-4 w-4" /> {t.whatsapp}
          </a>
        )}
      </div>
      {(social.instagram || social.facebook) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">{t.socialLinks}</h3>
          <div className="mt-3 flex gap-3">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-pink-300 hover:text-pink-600">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600">
                <Facebook className="h-4 w-4" /> Facebook
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Star Components ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5">
          <Star className={`h-6 w-6 ${i <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}

/* ── Product Modal (centered, with mini-tabs) ── */
function ProductModal({
  product,
  slug,
  currency,
  t,
  theme,
  onClose,
}: {
  product: Product;
  slug: string;
  currency: string;
  t: Record<string, string>;
  theme: ReturnType<typeof getTheme>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"details" | "reviews" | "order">("details");

  const images = getProductImages(product);
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="truncate text-base font-bold text-slate-900">{product.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mini tabs */}
        <div className="flex border-b border-slate-100">
          {([
            { id: "details" as const, label: t.details },
            { id: "reviews" as const, label: t.reviews },
            { id: "order" as const, label: t.orderTab },
          ]).map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === tb.id ? `border-b-2 ${theme.tabBorder} ${theme.tab}` : "text-slate-500"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 110px)" }}>
          {tab === "details" && (
            <div className="p-5">
              {images.length > 0 ? (
                <>
                  <SafeImg src={images[activeImg]} alt={product.name} className="aspect-video w-full rounded-lg object-cover" fallback={<PlaceholderImage className="aspect-video w-full rounded-lg" />} />
                  {images.length > 1 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {images.map((url, i) => (
                        <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImg ? "border-indigo-500" : "border-transparent"}`}>
                          <SafeImg src={url} alt="" className="h-12 w-12 object-cover" fallback={<PlaceholderImage className="h-12 w-12" />} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <PlaceholderImage className="aspect-video w-full rounded-lg" />
              )}
              <p className={`mt-3 text-lg font-bold ${theme.text}`}>{currency} {product.price}</p>
              {product.category && <p className="mt-1 text-xs text-slate-400">{product.category}</p>}
              {product.shortDescription && <p className="mt-2 text-sm text-slate-600">{product.shortDescription}</p>}
              <button
                onClick={() => setTab("order")}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl ${theme.btn} py-2.5 text-sm font-semibold text-white ${theme.btnHover}`}
              >
                <ShoppingBag className="h-4 w-4" /> {t.addToOrder}
              </button>
            </div>
          )}

          {tab === "reviews" && (
            <div className="p-5">
              <ProductReviews itemId={product.id} t={t} />
            </div>
          )}

          {tab === "order" && (
            <div className="p-5">
              <OrderForm product={product} slug={slug} currency={currency} t={t} theme={theme} onClose={onClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Product Reviews ── */
function ProductReviews({ itemId, t }: { itemId: number; t: Record<string, string> }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?itemId=${itemId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [itemId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId: itemId, authorName: name.trim(), content: content.trim(), rating }),
      });
      if (res.ok) {
        const c = await res.json();
        setComments((prev) => [c, ...prev]);
        setName(""); setContent(""); setRating(5); setSent(true); setShowForm(false);
        setTimeout(() => setSent(false), 3000);
      }
    } catch {} finally { setSending(false); }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{t.reviews} ({comments.length})</span>
        {!showForm && !sent && (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-indigo-600">{t.writeReview}</button>
        )}
        {sent && <span className="text-xs text-emerald-600">✓ {t.reviewSubmitted}</span>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none" />
          <StarRatingInput value={rating} onChange={setRating} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.yourReview} required rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{sending ? t.submitting : t.submitReview}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">{t.close}</button>
          </div>
        </form>
      )}

      {comments.length === 0 && !showForm && (
        <p className="mt-4 text-center text-sm text-slate-400">{t.noReviews}</p>
      )}
      <div className="mt-3 space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{c.authorName}</span>
              <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            {c.rating && <StarRating rating={c.rating} />}
            <p className="mt-1 text-sm text-slate-600">{c.content}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Order Form ── */
function OrderForm({
  product,
  slug,
  currency,
  t,
  theme,
  onClose,
}: {
  product: Product;
  slug: string;
  currency: string;
  t: Record<string, string>;
  theme: ReturnType<typeof getTheme>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`/api/storefront/${slug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: product.id, customerName: name.trim(), customerContact: contact.trim(), quantity, message: notes.trim() }),
      });
      const data = await res.json();
      setResult({ reference: data.reference || `ORD-${data.id}` });
    } catch { setResult({ reference: "—" }); } finally { setSending(false); }
  };

  if (result) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-2 text-base font-semibold text-slate-900">{t.orderSuccess}</p>
        <p className="mt-1 text-sm text-slate-600">{t.orderRef}: <span className="font-mono font-semibold">{result.reference}</span></p>
        <p className="mt-0.5 text-xs text-slate-500">{t.orderSuccessHint}</p>
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white">{t.close}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
        {product.imageUrl ? (
          <SafeImg src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" fallback={<PlaceholderImage className="h-10 w-10 rounded-lg" />} />
        ) : (
          <PlaceholderImage className="h-10 w-10 rounded-lg" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
          <p className={`text-xs font-semibold ${theme.text}`}>{currency} {product.price}</p>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderName}</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.orderNamePh} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderContact}</label>
        <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.orderContactPh} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderQty}</label>
        <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="mt-1 w-20 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderNotes}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.orderNotesPh} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>
      <button type="submit" disabled={sending} className={`flex w-full items-center justify-center gap-2 rounded-xl ${theme.btn} py-2.5 text-sm font-semibold text-white ${theme.btnHover} disabled:opacity-50`}>
        <Send className="h-4 w-4" /> {sending ? t.orderSending : t.orderSubmit}
      </button>
    </form>
  );
}

/* ── Helpers ── */
function getProductImages(product: Product): string[] {
  const urls: string[] = [];
  if (product.imageUrls) {
    try {
      const parsed = JSON.parse(product.imageUrls);
      if (Array.isArray(parsed)) urls.push(...parsed.filter(Boolean));
    } catch {}
  }
  if (urls.length === 0 && product.imageUrl) urls.push(product.imageUrl);
  return urls;
}
