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
  ChevronRight,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { PlaceholderImage, AvatarPlaceholder } from "@/components/placeholder-image";

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
  socialLinks: { whatsapp?: string; instagram?: string; facebook?: string };
};

type Product = {
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

/* ── i18n ── */
const dict = {
  en: {
    loading: "Loading store...",
    notFound: "Store not found",
    notFoundHint: "This store doesn't exist or hasn't been set up yet.",
    goHome: "Go home",
    products: "Products",
    allCategories: "All",
    noProducts: "No products yet",
    noProductsHint: "This seller hasn't published any products yet. Check back soon!",
    addToOrder: "Order",
    viewDetails: "View details",
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
    item: "Item",
    about: "About",
    contact: "Contact",
    storeBy: "Store by",
  },
  pt: {
    loading: "A carregar loja...",
    notFound: "Loja não encontrada",
    notFoundHint: "Esta loja não existe ou ainda não foi configurada.",
    goHome: "Ir para início",
    products: "Produtos",
    allCategories: "Todos",
    noProducts: "Ainda sem produtos",
    noProductsHint: "Este vendedor ainda não publicou produtos. Volte em breve!",
    addToOrder: "Encomendar",
    viewDetails: "Ver detalhes",
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
    item: "Item",
    about: "Sobre",
    contact: "Contacto",
    storeBy: "Loja de",
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
  const [category, setCategory] = useState("all");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (notFound || !seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t.notFound}</h1>
        <p className="mt-2 text-slate-600">{t.notFoundHint}</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          <Home className="h-4 w-4" />
          {t.goHome}
        </Link>
      </div>
    );
  }

  const social = seller.socialLinks || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
            MyShop
          </Link>
          <div className="flex items-center gap-2">
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

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-8">
        {/* Hero — compact */}
        <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
          {seller.logoUrl ? (
            <img src={seller.logoUrl} alt={seller.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <AvatarPlaceholder name={seller.name} className="h-14 w-14 text-xl" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900">{seller.name}</h1>
            {seller.description && (
              <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{seller.description}</p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {[seller.city, seller.businessType].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </section>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  category === cat
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {cat === "all" ? t.allCategories : cat}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {filtered.length === 0 ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-800">{t.noProducts}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.noProductsHint}</p>
          </section>
        ) : (
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={seller.currency || "USD"}
                ctaLabel={t.addToOrder}
                onOrder={() => setOrderProduct(product)}
                onClick={() => setDetailProduct(product)}
              />
            ))}
          </section>
        )}

        {/* Store footer */}
        <footer className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500">
          {t.storeBy} <span className="font-medium text-slate-700">{seller.ownerName || seller.name}</span>
          {seller.city && <span> · {seller.city}</span>}
        </footer>
      </main>

      {/* Mobile sticky order bar */}
      {products.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
          <button
            onClick={() => setOrderProduct(products[0])}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            {t.addToOrder}
          </button>
        </div>
      )}

      {/* Product detail drawer */}
      {detailProduct && (
        <ProductDetailDrawer
          product={detailProduct}
          currency={seller.currency || "USD"}
          t={t}
          onClose={() => setDetailProduct(null)}
          onOrder={() => {
            setOrderProduct(detailProduct);
            setDetailProduct(null);
          }}
        />
      )}

      {/* Order modal */}
      {orderProduct && (
        <OrderModal
          product={orderProduct}
          slug={seller.slug}
          currency={seller.currency || "USD"}
          t={t}
          onClose={() => setOrderProduct(null)}
        />
      )}
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({
  product,
  currency,
  ctaLabel,
  onOrder,
  onClick,
}: {
  product: Product;
  currency: string;
  ctaLabel: string;
  onOrder: () => void;
  onClick: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
      <button onClick={onClick} className="w-full text-left">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
        ) : (
          <PlaceholderImage className="aspect-square w-full rounded-t-xl" />
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</p>
          {product.shortDescription && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{product.shortDescription}</p>
          )}
          <p className="mt-1.5 text-sm font-bold text-indigo-600">
            {currency} {product.price}
          </p>
        </div>
      </button>
      <div className="px-3 pb-3">
        <button
          onClick={(e) => { e.stopPropagation(); onOrder(); }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

/* ── Product Detail Drawer ── */
function ProductDetailDrawer({
  product,
  currency,
  t,
  onClose,
  onOrder,
}: {
  product: Product;
  currency: string;
  t: Record<string, string>;
  onClose: () => void;
  onOrder: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="mt-3 aspect-video w-full rounded-lg object-cover" />
        ) : (
          <PlaceholderImage className="mt-3 aspect-video w-full rounded-lg" />
        )}

        <p className="mt-3 text-xl font-bold text-indigo-600">
          {currency} {product.price}
        </p>

        {product.category && (
          <p className="mt-1 text-xs text-slate-500">{product.category}</p>
        )}

        {product.shortDescription && (
          <p className="mt-2 text-sm text-slate-700">{product.shortDescription}</p>
        )}

        <button
          onClick={onOrder}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <ShoppingBag className="h-4 w-4" />
          {t.addToOrder}
        </button>
      </div>
    </div>
  );
}

/* ── Order Modal ── */
function OrderModal({
  product,
  slug,
  currency,
  t,
  onClose,
}: {
  product: Product;
  slug: string;
  currency: string;
  t: Record<string, string>;
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
        body: JSON.stringify({
          itemId: product.id,
          customerName: name.trim(),
          customerContact: contact.trim(),
          quantity,
          message: notes.trim(),
        }),
      });
      const data = await res.json();
      setResult({ reference: data.reference || `ORD-${data.id}` });
    } catch {
      setResult({ reference: "—" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.orderTitle}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="mt-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-3 text-lg font-semibold text-slate-900">{t.orderSuccess}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t.orderRef}: <span className="font-mono font-semibold">{result.reference}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{t.orderSuccessHint}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Item summary */}
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <PlaceholderImage className="h-10 w-10 rounded-lg" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                <p className="text-xs font-semibold text-indigo-600">{currency} {product.price}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{t.orderName}</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.orderNamePh}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{t.orderContact}</label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t.orderContactPh}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{t.orderQty}</label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-20 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">{t.orderNotes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.orderNotesPh}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? t.orderSending : t.orderSubmit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
