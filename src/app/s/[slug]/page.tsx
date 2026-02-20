"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import {
  Store, MapPin, MessageCircle, Instagram, Facebook, AlertCircle, Loader2,
  ShoppingBag, X, Send, CheckCircle, Home, Package, Star, MessageSquare,
  Phone, Info, Heart, User, LogIn, ChevronLeft, ChevronRight, Share2, Copy, Check,
  Tag, Grid2X2, Grid3X3, LayoutGrid, BadgeCheck, Sparkles, TrendingUp, Clock, Truck, CalendarDays, Users,
  ShoppingCart, Plus,
} from "lucide-react";
import CartSummary from "@/components/cart/cart-summary";
import { CartManager } from "@/lib/cart";
import SimpleToast from "@/components/toast-simple";
import { PlaceholderImage, AvatarPlaceholder } from "@/components/placeholder-image";
import { getTheme } from "@/lib/theme-colors";
import { getTemplate, type StoreTemplate } from "@/lib/store-templates";
import { StoreJsonLd, ProductJsonLd } from "@/components/json-ld";
import { SafeImg } from "@/components/safe-img";
import { FAB } from "@/components/fab";
import { useCategories, flattenCategories } from "@/components/category-select";
import { StorefrontSearch } from "@/components/storefront-search";
import ProductReviews from "@/components/product-reviews";
import ReviewForm from "@/components/review-form";
import PromotionBanner from "@/components/promotions/promotion-banner";
import FlashSaleBanner from "@/components/promotions/flash-sale-banner";
import FlashSaleAutoApply from "@/components/promotions/flash-sale-auto-apply";

import { OptimizedImage, ProductImage, StoreLogoImage, StoreBannerImage } from "@/components/optimized-image";

/* ── Types ── */
type Seller = {
  id: number; slug: string; name: string; description: string; ownerName: string;
  businessType: string; currency: string; city: string; logoUrl: string; bannerUrl: string;
  socialLinks: { whatsapp?: string; instagram?: string; facebook?: string };
  themeColor: string; address: string; country: string;
  businessHours: Record<string, { open: string; close: string }>;
  storeTemplate: string;
  headerTemplate?: "compact" | "hero" | "split" | "minimal-sticky";
  createdAt?: string;
};
type Product = {
  id: number; sellerId: number; name: string; type: string; category: string;
  shortDescription: string; imageUrl: string; imageUrls: string; price: string;
  status: string; compareAtPrice?: string; createdAt?: string;
};
type Comment = { id: number; catalogItemId: number | null; sellerId: number | null; authorName: string; authorEmail: string | null; content: string; rating: number | null; createdAt: string };
type CustomerInfo = { customerId: number; name: string; email: string; phone?: string; address?: string; city?: string; country?: string } | null;

/* ── i18n ── */
const dict = {
  en: {
    loading: "Loading store...", notFound: "Store not found",
    notFoundHint: "This store doesn't exist or hasn't been set up yet.", goHome: "Go home",
    tabProducts: "Products", tabAbout: "About", tabReviews: "Reviews", tabContact: "Contact",
    allCategories: "All", noProducts: "No products yet",
    noProductsHint: "This seller hasn't published any products yet.",
    order: "Order", details: "Details", reviews: "Reviews", orderTab: "Order", addToOrder: "Order",
    orderTitle: "Place an Order", orderName: "Your name", orderNamePh: "Full name",
    orderContact: "Email or phone", orderContactPh: "email@example.com or +258...",
    orderQty: "Quantity", orderNotes: "Notes (optional)", orderNotesPh: "Any details or questions...",
    orderSubmit: "Send order", orderSending: "Sending...", orderSuccess: "Order placed successfully!",
    orderRef: "Reference", orderSuccessHint: "The seller will contact you soon.",
    close: "Close", noReviews: "No reviews yet", writeReview: "Write a review",
    yourName: "Your name", yourReview: "Your review...", submitReview: "Submit",
    submitting: "Submitting...", reviewSubmitted: "Review submitted!", rating: "Rating",
    aboutStore: "About this store", businessType: "Business type", location: "Location",
    contactInfo: "Contact Information", whatsapp: "WhatsApp", socialLinks: "Social Links",
    avgRating: "Average rating", based: "based on", reviewsCount: "reviews", products: "products",
    login: "Login", myAccount: "Account", wishlist: "Wishlist",
    loginToSave: "Log in to save favorites", copied: "Copied!", share: "Share",
    prev: "Previous", next: "Next",
    quickView: "Quick view", off: "off", verified: "Verified seller",
    newBadge: "New", bestSeller: "Best seller",
    haveCoupon: "Have a coupon?", applyCoupon: "Apply", couponPlaceholder: "Enter code",
    discount: "Discount", total: "Total", originalPrice: "Original price",
    invalidCoupon: "Invalid coupon", couponApplied: "Coupon applied!",
    removeCoupon: "Remove",
    menu: "Menu", services: "Services", memberSince: "Member since",
    openNow: "Open now", closed: "Closed", delivery: "Delivery",
    follow: "Follow", shareStore: "Share store",
    searchProducts: "Search products...", filters: "Filters", 
    sortRecent: "Recent", sortPriceAsc: "Price: Low to High", 
    sortPriceDesc: "Price: High to Low", sortRating: "Highest Rated", 
    sortPopular: "Most Popular", allRatings: "All ratings",
    minPrice: "Min price", maxPrice: "Max price", priceRange: "Price Range",
    category: "Category", clearFilters: "Clear all",
    applyFilters: "Apply filters",
    addToCart: "Add to cart", addedToCart: "Added to cart",
    goToCart: "View cart", checkout: "Checkout",
  },
  pt: {
    loading: "A carregar loja...", notFound: "Loja não encontrada",
    notFoundHint: "Esta loja não existe ou ainda não foi configurada.", goHome: "Ir para início",
    tabProducts: "Produtos", tabAbout: "Sobre", tabReviews: "Avaliações", tabContact: "Contacto",
    allCategories: "Todos", noProducts: "Ainda sem produtos",
    noProductsHint: "Este vendedor ainda não publicou produtos.",
    order: "Encomendar", details: "Detalhes", reviews: "Avaliações", orderTab: "Encomendar",
    addToOrder: "Encomendar", orderTitle: "Fazer um Pedido", orderName: "Seu nome",
    orderNamePh: "Nome completo", orderContact: "Email ou telefone",
    orderContactPh: "email@exemplo.com ou +258...", orderQty: "Quantidade",
    orderNotes: "Notas (opcional)", orderNotesPh: "Detalhes ou perguntas...",
    orderSubmit: "Enviar pedido", orderSending: "A enviar...",
    orderSuccess: "Pedido feito com sucesso!", orderRef: "Referência",
    orderSuccessHint: "O vendedor entrará em contacto em breve.", close: "Fechar",
    noReviews: "Ainda sem avaliações", writeReview: "Escrever avaliação",
    yourName: "Seu nome", yourReview: "Sua avaliação...", submitReview: "Enviar",
    submitting: "A enviar...", reviewSubmitted: "Avaliação enviada!", rating: "Classificação",
    aboutStore: "Sobre esta loja", businessType: "Tipo de negócio", location: "Localização",
    contactInfo: "Informações de Contacto", whatsapp: "WhatsApp", socialLinks: "Redes Sociais",
    avgRating: "Classificação média", based: "baseado em", reviewsCount: "avaliações", products: "produtos",
    login: "Entrar", myAccount: "Conta", wishlist: "Favoritos",
    loginToSave: "Entre para guardar favoritos", copied: "Copiado!", share: "Partilhar",
    prev: "Anterior", next: "Seguinte",
    quickView: "Ver rápido", off: "desc.", verified: "Vendedor verificado",
    newBadge: "Novo", bestSeller: "Mais vendido",
    haveCoupon: "Tem um cupom?", applyCoupon: "Aplicar", couponPlaceholder: "Digite o código",
    discount: "Desconto", total: "Total", originalPrice: "Preço original",
    invalidCoupon: "Cupom inválido", couponApplied: "Cupom aplicado!",
    removeCoupon: "Remover",
    menu: "Menu", services: "Serviços", memberSince: "Membro desde",
    openNow: "Aberto agora", closed: "Fechado", delivery: "Entrega",
    follow: "Seguir", shareStore: "Partilhar loja",
    searchProducts: "Pesquisar produtos...", filters: "Filtros", 
    sortRecent: "Recentes", sortPriceAsc: "Preço: Baixo para Alto", 
    sortPriceDesc: "Preço: Alto para Baixo", sortRating: "Melhor Avaliados", 
    sortPopular: "Mais Populares", allRatings: "Todas as avaliações",
    minPrice: "Preço mín.", maxPrice: "Preço máx.", priceRange: "Faixa de Preço",
    category: "Categoria", clearFilters: "Limpar tudo",
    applyFilters: "Aplicar filtros",
    addToCart: "Adicionar ao carrinho", addedToCart: "Adicionado ao carrinho",
    goToCart: "Ver carrinho", checkout: "Checkout",
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
  const [customer, setCustomer] = useState<CustomerInfo>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [storeComments, setStoreComments] = useState<Comment[]>([]);
  const [gridCols, setGridCols] = useState(2); // mobile default
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [productRatings, setProductRatings] = useState<Record<number, { average: number; count: number }>>({});

  // Load customer session
  useEffect(() => {
    fetch("/api/auth/customer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.session) setCustomer(data.session); })
      .catch(() => {});
  }, []);

  // Load wishlist IDs when customer is logged in
  useEffect(() => {
    if (!customer) return;
    fetch("/api/wishlist", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWishlistIds(new Set(data.map((w: { catalogItemId: number }) => w.catalogItemId)));
      })
      .catch(() => {});
  }, [customer]);

  // Load store
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/storefront/${slug}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then((data) => { 
        if (!data) return; 
        setSeller(data.seller); 
        const publishedProducts = (data.products || []).filter((p: Product) => p.status === "Published");
        setProducts(publishedProducts);
        setDisplayProducts(publishedProducts);
        setLoading(false); 
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // Load store reviews for rating summary
  useEffect(() => {
    if (!seller) return;
    fetch(`/api/comments?sellerId=${seller.id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStoreComments(data); })
      .catch(() => {});
  }, [seller]);

  // Load product ratings
  useEffect(() => {
    if (products.length === 0) return;
    const productIds = products.map(p => p.id).join(',');
    fetch(`/api/products/ratings?productIds=${productIds}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data === 'object' && !Array.isArray(data)) {
          setProductRatings(data);
        }
      })
      .catch(() => {});
  }, [products]);

  const toggleWishlist = useCallback(async (itemId: number) => {
    if (!customer) { setLoginPrompt(true); return; }
    const isWished = wishlistIds.has(itemId);
    setWishlistIds((prev) => { const next = new Set(prev); if (isWished) next.delete(itemId); else next.add(itemId); return next; });
    if (isWished) {
      await fetch(`/api/wishlist?catalogItemId=${itemId}`, { method: "DELETE", credentials: "include" });
    } else {
      await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ catalogItemId: itemId }) });
    }
  }, [customer, wishlistIds]);

  const handleSearchResults = useCallback((data: any) => {
    setSearchResults(data);
    setDisplayProducts(data.products || []);
  }, []);

  const handleSearchLoading = useCallback((loading: boolean) => {
    setSearchLoading(loading);
  }, []);

  const addProductToCart = useCallback((product: Product, seller: Seller) => {
    const cartItem = {
      id: product.id,
      storeId: seller.id,
      storeName: seller.name,
      name: product.name,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || undefined,
      quantity: 1,
      // Add stock limit if available
      maxQuantity: undefined, // Would need to get from product stock data
    };

    CartManager.addItem(cartItem);
    
    // Show a brief success message
    const event = new CustomEvent('show-toast', {
      detail: { message: t.addedToCart, type: 'success' }
    });
    window.dispatchEvent(event);
  }, [t]);

  // Fetch global categories for localized names
  const { categories: globalCats } = useCategories();
  const globalCatMap = useMemo(() => {
    const map = new Map<string, string>();
    const flat = flattenCategories(globalCats, lang);
    for (const c of flat) map.set(c.slug, c.label);
    return map;
  }, [globalCats, lang]);

  const categories = useMemo(() => {
    const productsToUse = searchResults ? displayProducts : products;
    const catMap = new Map<string, number>();
    productsToUse.forEach((p) => {
      const cat = p.category || "";
      if (cat) catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return [
      { name: "all", count: productsToUse.length },
      ...Array.from(catMap.entries()).map(([name, count]) => ({
        name,
        displayName: globalCatMap.get(name) || name,
        count,
      })),
    ];
  }, [products, displayProducts, globalCatMap, searchResults]);

  const filtered = useMemo(() => {
    const productsToUse = searchResults ? displayProducts : products;
    if (category === "all" || !category) return productsToUse;
    return productsToUse.filter((p) => p.category === category);
  }, [products, displayProducts, category, searchResults]);

  // Rating summary
  const ratingInfo = useMemo(() => {
    const rated = storeComments.filter((c) => c.rating);
    if (rated.length === 0) return { avg: 0, count: 0 };
    const avg = Math.round((rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length) * 10) / 10;
    return { avg, count: rated.length };
  }, [storeComments]);

  // Verified seller check: logo + banner + 3+ products
  const isVerified = useMemo(() => {
    if (!seller) return false;
    return !!(seller.logoUrl && seller.bannerUrl && products.length >= 3);
  }, [seller, products]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
          <span className="mt-3 block text-sm text-slate-500">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (notFound || !seller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <h1 className="mt-3 text-xl font-bold text-slate-900">{t.notFound}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.notFoundHint}</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          <Home className="h-4 w-4" /> {t.goHome}
        </Link>
      </div>
    );
  }

  const theme = getTheme(seller.themeColor || "green");
  const template = getTemplate(seller.storeTemplate || "classic");
  const social = seller.socialLinks || {};
  const bType = (seller.businessType || "").toLowerCase();
  const isFood = bType.includes("restaurant") || bType.includes("food") || bType.includes("café") || bType.includes("cafe");
  const isService = bType.includes("service") || bType.includes("salon") || bType.includes("repair") || bType.includes("consult");
  const productsLabel = isFood ? t.menu : isService ? t.services : t.tabProducts;
  const tabs = [
    { id: "products" as const, label: productsLabel, icon: Package },
    { id: "about" as const, label: t.tabAbout, icon: Info },
    { id: "reviews" as const, label: t.tabReviews, icon: MessageSquare },
    { id: "contact" as const, label: t.tabContact, icon: Phone },
  ];
  const memberYear = seller.createdAt ? new Date(seller.createdAt).getFullYear() : null;
  const headerTemplate = seller.headerTemplate || "compact";

  return (
    <div className="min-h-screen bg-slate-50/50">
      <StoreJsonLd name={seller.name} description={seller.description || ""} url={typeof window !== "undefined" ? window.location.href : `/s/${slug}`} logo={seller.logoUrl || undefined} image={seller.bannerUrl || undefined} address={seller.address || undefined} city={seller.city || undefined} country={seller.country || undefined} />
      {products.map((p) => <ProductJsonLd key={p.id} name={p.name} description={p.shortDescription || undefined} image={p.imageUrl || undefined} price={p.price} currency={seller.currency || "USD"} url={typeof window !== "undefined" ? window.location.href : `/s/${slug}`} seller={seller.name} />)}

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Link href="/" className="font-bold text-slate-500 hover:text-slate-700 transition">MyShop</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-none">{seller.name}</span>
          </div>
          <StorefrontActions social={social} customer={customer} slug={slug} t={t} wishlistCount={wishlistIds.size} lang={lang} />
        </div>
      </header>

      <StoreHeaderTemplates
        seller={seller}
        theme={theme}
        template={template}
        t={t}
        social={social}
        productsCount={products.length}
        reviewsCount={storeComments.length}
        ratingInfo={ratingInfo}
        memberYear={memberYear}
        isFood={isFood}
        isVerified={isVerified}
        headerTemplate={headerTemplate}
      />

      {/* Tab bar */}
      <div className={`sticky z-20 border-b border-slate-200 bg-white shadow-sm ${headerTemplate === "minimal-sticky" ? "top-24" : "top-12"}`}>
        <div className="mx-auto flex max-w-5xl px-4">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-medium transition-all sm:flex-none sm:px-5 sm:text-sm ${
                activeTab === tb.id
                  ? `${theme.tabBorder} ${theme.tab}`
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tb.icon className="h-4 w-4" />
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promotion Banners */}
      <div className="mx-auto max-w-5xl px-4 pt-3">
        <FlashSaleBanner storeSlug={slug} className="mb-3" />
        <PromotionBanner storeSlug={slug} className="mb-3" />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-2 sm:pb-8">
        {activeTab === "products" && (
          <ProductsTab
            products={filtered} categories={categories} category={category} setCategory={setCategory}
            currency={seller.currency || "USD"} t={t} theme={theme} onProductClick={setModalProduct}
            wishlistIds={wishlistIds} toggleWishlist={toggleWishlist}
            gridCols={gridCols} setGridCols={setGridCols}
            template={template}
            storeSlug={seller.slug}
            onSearchResults={handleSearchResults}
            onSearchLoading={handleSearchLoading}
            searchLoading={searchLoading}
            globalCatMap={globalCatMap}
            seller={seller}
            addProductToCart={addProductToCart}
            productRatings={productRatings}
          />
        )}
        {activeTab === "about" && <AboutTab seller={seller} t={t} />}
        {activeTab === "reviews" && <ReviewsTab sellerId={seller.id} t={t} />}
        {activeTab === "contact" && <ContactTab seller={seller} t={t} />}
      </main>

      {/* Product modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct} sellerId={seller.id} slug={seller.slug}
          currency={seller.currency || "USD"} t={t} theme={theme}
          onClose={() => setModalProduct(null)} customer={customer}
          isWished={wishlistIds.has(modalProduct.id)} toggleWishlist={toggleWishlist}
        />
      )}

      {/* Login prompt */}
      {loginPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-4 sm:items-center" onClick={() => setLoginPrompt(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <Heart className="mx-auto h-10 w-10 text-red-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">{t.loginToSave}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/customer/login?redirect=/s/${slug}`} className="flex-1 rounded-xl bg-green-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700 transition">{t.login}</Link>
                <button onClick={() => setLoginPrompt(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">{t.close}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flash Sale Auto Apply */}
      <FlashSaleAutoApply storeId={seller.id} storeName={seller.name} />

      {/* Toast Notifications */}
      <SimpleToast />
      
      {/* FAB for mobile */}
      <FAB href="#contact" icon={MessageCircle}>
        Contact Store
      </FAB>
    </div>
  );
}

function StorefrontActions({
  social,
  customer,
  slug,
  t,
  wishlistCount,
  lang,
}: {
  social: Seller["socialLinks"];
  customer: CustomerInfo;
  slug: string;
  t: Record<string, string>;
  wishlistCount: number;
  lang: 'en' | 'pt';
}) {
  const handleCartRedirect = () => {
    window.location.href = '/checkout';
  };

  return (
    <div className="flex items-center gap-1">
      {social.whatsapp && (
        <a href={social.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition">
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      {social.instagram && (
        <a href={social.instagram} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition">
          <Instagram className="h-4 w-4" />
        </a>
      )}
      {social.facebook && (
        <a href={social.facebook} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 transition">
          <Facebook className="h-4 w-4" />
        </a>
      )}
      
      {/* Cart Summary */}
      <CartSummary 
        lang={lang}
        onCheckout={handleCartRedirect}
        className="ml-2"
      />
      
      <div className="mx-1 h-4 w-px bg-slate-200" />
      {customer ? (
        <>
          <Link href="/customer/wishlist" className="relative rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
            <Heart className={`h-4 w-4 ${wishlistCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
            {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{wishlistCount}</span>}
          </Link>
          <Link href="/customer/profile" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600">{customer.name.charAt(0).toUpperCase()}</div>
            <span className="hidden sm:inline max-w-[80px] truncate">{customer.name.split(" ")[0]}</span>
          </Link>
        </>
      ) : (
        <Link href={`/customer/login?redirect=/s/${slug}`} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition">
          <LogIn className="h-3.5 w-3.5" /> {t.login}
        </Link>
      )}
    </div>
  );
}

function StoreHeaderTemplates({
  seller, theme, template, t, social, productsCount, reviewsCount, ratingInfo, memberYear, isFood, isVerified, headerTemplate,
}: {
  seller: Seller;
  theme: ReturnType<typeof getTheme>;
  template: StoreTemplate;
  t: Record<string, string>;
  social: Seller["socialLinks"];
  productsCount: number;
  reviewsCount: number;
  ratingInfo: { avg: number; count: number };
  memberYear: number | null;
  isFood: boolean;
  isVerified: boolean;
  headerTemplate: "compact" | "hero" | "split" | "minimal-sticky";
}) {
  const stats = <div className="mt-2 flex items-center gap-3 text-xs text-slate-400"><span>{productsCount} {t.products}</span><span>·</span><span>{reviewsCount} {t.reviews}</span>{memberYear && <><span>·</span><span>{t.memberSince} {memberYear}</span></>}{isFood && seller.businessHours && Object.keys(seller.businessHours).length > 0 && <><span>·</span><span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{t.openNow}</span></>}</div>;

  if (headerTemplate === "minimal-sticky") {
    return (
      <>
        <div className="sticky top-12 z-20 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-2 min-w-0"><div className="h-7 w-7 overflow-hidden rounded-lg bg-slate-100">{seller.logoUrl ? <SafeImg src={seller.logoUrl} alt={seller.name} className="h-full w-full object-cover" /> : <AvatarPlaceholder name={seller.name} className="h-full w-full text-[10px]" />}</div><p className="truncate text-sm font-semibold text-slate-800">{seller.name}</p></div>
            <button onClick={() => { if (navigator.share) navigator.share({ url: window.location.href, title: seller.name }); else { navigator.clipboard.writeText(window.location.href); } }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="bg-white"><div className="mx-auto max-w-5xl px-4 py-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-3"><div className={`${template.avatarSize} overflow-hidden rounded-xl bg-white shadow-sm`}>{seller.logoUrl ? <SafeImg src={seller.logoUrl} alt={seller.name} className="h-full w-full object-cover" /> : <AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-base font-bold text-slate-900">{seller.name}</h1>{isVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}</div><p className="line-clamp-1 text-xs text-slate-500">{seller.description || seller.businessType}</p></div></div>{stats}</div></div></div>
      </>
    );
  }

  const banner = <div className="relative h-[120px] overflow-hidden rounded-2xl sm:h-[150px]">{seller.bannerUrl ? <SafeImg src={seller.bannerUrl} alt={`${seller.name} banner`} className="h-full w-full object-cover" fallback={<div className={`flex h-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}><span className="text-2xl font-bold text-white/80">{seller.name}</span></div>} /> : <div className={`flex h-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}><span className="text-2xl font-bold text-white/80">{seller.name}</span></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" /></div>;

  if (headerTemplate === "hero") {
    return <div className="bg-white"><div className="mx-auto max-w-5xl px-4 pb-2 pt-1"><div className="relative">{banner}<div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 p-3 backdrop-blur"><div className="flex items-center gap-3"><div className={`${template.avatarSize} overflow-hidden rounded-xl border border-white/60 bg-white shadow`}>{seller.logoUrl ? <SafeImg src={seller.logoUrl} alt={seller.name} className="h-full w-full object-cover" /> : <AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-bold text-slate-900">{seller.name}</h1>{isVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}</div><div className="flex items-center gap-2 text-xs text-slate-500">{ratingInfo.count > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{ratingInfo.avg} ({ratingInfo.count})</span>}{seller.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{seller.city}</span>}</div></div><div className="hidden sm:flex items-center gap-1">{social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><MessageCircle className="h-4 w-4" /></a>}<button onClick={() => { if (navigator.share) navigator.share({ url: window.location.href, title: seller.name }); else { navigator.clipboard.writeText(window.location.href); } }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button></div></div>{stats}</div></div></div></div>;
  }

  if (headerTemplate === "split") {
    return <div className="bg-white"><div className="mx-auto max-w-5xl px-4 py-3"><div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1.7fr,1fr]">{banner}<div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-bold text-slate-900">{seller.name}</h1>{isVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}</div><p className="mt-1 line-clamp-2 text-xs text-slate-500">{seller.description || seller.businessType}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white p-2"><p className="text-slate-400">{t.products}</p><p className="font-semibold text-slate-800">{productsCount}</p></div><div className="rounded-lg bg-white p-2"><p className="text-slate-400">{t.reviews}</p><p className="font-semibold text-slate-800">{reviewsCount}</p></div></div><div className="mt-3 flex items-center gap-1">{social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><MessageCircle className="h-4 w-4" /></a>}<button onClick={() => { if (navigator.share) navigator.share({ url: window.location.href, title: seller.name }); else { navigator.clipboard.writeText(window.location.href); } }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Share2 className="h-4 w-4" /></button></div>{stats}</div></div></div></div>;
  }

  return <div className="bg-white pb-1"><div className="mx-auto max-w-5xl px-4"><div className="relative mt-0 h-[110px] overflow-hidden rounded-b-2xl sm:h-[140px]">{seller.bannerUrl ? <SafeImg src={seller.bannerUrl} alt={`${seller.name} banner`} className="h-full w-full object-cover" fallback={<div className={`flex h-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}><span className="text-2xl font-bold text-white/80">{seller.name}</span></div>} /> : <div className={`flex h-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}><span className="text-2xl font-bold text-white/80">{seller.name}</span></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" /></div><div className="relative -mt-8 flex items-end gap-3 px-2 sm:px-4"><div className={`${template.avatarSize} shrink-0 overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-lg`}>{seller.logoUrl ? <SafeImg src={seller.logoUrl} alt={seller.name} className="h-full w-full object-cover" fallback={<AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />} /> : <AvatarPlaceholder name={seller.name} className="h-full w-full text-xl" />}</div><div className="min-w-0 flex-1 pb-1"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-bold text-slate-900">{seller.name}</h1>{isVerified && <span title={t.verified}><BadgeCheck className="h-4 w-4 shrink-0 text-green-500" /></span>}</div><div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">{ratingInfo.count > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="font-semibold text-slate-700">{ratingInfo.avg}</span><span>({ratingInfo.count})</span></span>}{seller.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{seller.city}</span>}{seller.businessType && seller.businessType !== "Retail" && <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium">{seller.businessType}</span>}</div></div><div className="hidden sm:flex items-center gap-1 pb-1">{social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition" title="WhatsApp"><MessageCircle className="h-4 w-4" /></a>}<button onClick={() => { if (navigator.share) navigator.share({ url: window.location.href, title: seller.name }); else { navigator.clipboard.writeText(window.location.href); } }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" title={t.shareStore}><Share2 className="h-4 w-4" /></button></div></div><div className="mt-2 px-2 sm:px-4">{stats}</div></div></div>;
}

/* ── Price Display with compare_at_price ── */
function PriceDisplay({ price, compareAtPrice, currency, theme, size = "sm" }: {
  price: string; compareAtPrice?: string; currency: string; theme: ReturnType<typeof getTheme>; size?: "sm" | "lg";
}) {
  const hasDiscount = compareAtPrice && Number(compareAtPrice) > Number(price) && Number(compareAtPrice) > 0;
  const pctOff = hasDiscount ? Math.round((1 - Number(price) / Number(compareAtPrice)) * 100) : 0;
  const textSize = size === "lg" ? "text-xl" : "text-sm";
  const smallSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasDiscount && (
        <span className={`${smallSize} text-slate-400 line-through`}>{currency} {compareAtPrice}</span>
      )}
      <span className={`${textSize} font-bold ${hasDiscount ? "text-red-600" : theme.text}`}>{currency} {price}</span>
      {hasDiscount && (
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">-{pctOff}%</span>
      )}
    </div>
  );
}

/* ── Products Tab ── */
function ProductsTab({
  products, categories, category, setCategory, currency, t, theme, onProductClick, wishlistIds, toggleWishlist, gridCols, setGridCols, template,
  storeSlug, onSearchResults, onSearchLoading, searchLoading, globalCatMap, seller, addProductToCart, productRatings,
}: {
  products: Product[]; categories: { name: string; displayName?: string; count: number }[]; category: string; setCategory: (c: string) => void;
  currency: string; t: Record<string, string>; theme: ReturnType<typeof getTheme>;
  onProductClick: (p: Product) => void; wishlistIds: Set<number>; toggleWishlist: (id: number) => void;
  gridCols: number; setGridCols: (n: number) => void;
  template: StoreTemplate;
  storeSlug: string; onSearchResults: (data: any) => void; onSearchLoading: (loading: boolean) => void;
  searchLoading: boolean; globalCatMap: Map<string, string>;
  seller: Seller; addProductToCart: (product: Product, seller: Seller) => void;
  productRatings: Record<number, { average: number; count: number }>;
}) {
  const isNew = (p: Product) => {
    if (!p.createdAt) return false;
    const diff = Date.now() - new Date(p.createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  // Template-aware grid classes
  const templateGrid = template.layout === "list"
    ? "grid grid-cols-1 lg:grid-cols-2 gap-2"
    : template.layout === "single"
      ? "flex flex-col gap-6"
      : gridCols === 2
        ? `grid grid-cols-${template.gridCols.mobile} sm:grid-cols-${template.gridCols.sm} lg:grid-cols-${template.gridCols.lg} ${template.gap}`
        : `grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 ${template.gap}`;
  const gridClass = templateGrid;

  // Create global categories for search component
  const globalCategories = useMemo(() => {
    return Array.from(globalCatMap.entries()).map(([slug, label]) => ({ slug, label }));
  }, [globalCatMap]);

  return (
    <>
      {/* Search Component */}
      <div className="mb-6">
        <StorefrontSearch
          storeSlug={storeSlug}
          onResults={onSearchResults}
          onLoading={onSearchLoading}
          currency={currency}
          globalCategories={globalCategories}
          t={t}
        />
      </div>

      <div className="mb-5 flex items-center justify-between gap-2">
        {/* Category pills with counts */}
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                category === cat.name ? theme.pillActive : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {cat.name === "all" ? t.allCategories : (cat.displayName || cat.name)}
              <span className="ml-1 opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>
        {/* Grid density toggle */}
        <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setGridCols(2)} className={`rounded p-1.5 transition ${gridCols === 2 ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"}`}>
            <Grid2X2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setGridCols(3)} className={`rounded p-1.5 transition ${gridCols === 3 ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"}`}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {searchLoading ? (
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="aspect-square bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-6 bg-slate-200 rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noProducts}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noProductsHint}</p>
        </div>
      ) : (
        <div className={gridClass}>
          {products.map((product) => (
            template.layout === "list" ? (
              /* List layout — horizontal card */
              <article key={product.id} className="group relative flex cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md" onClick={() => onProductClick(product)}>
                <div className="h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-28">
                  {product.imageUrl ? (
                    <SafeImg src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" fallback={<PlaceholderImage className="h-full w-full" />} />
                  ) : (
                    <PlaceholderImage className="h-full w-full" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`${template.titleSize} font-semibold text-slate-900 line-clamp-1`}>{product.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="shrink-0">
                        <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? "fill-red-500 text-red-500" : "text-slate-300"}`} />
                      </button>
                    </div>
                    {product.shortDescription && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{product.shortDescription}</p>}
                    <ProductRatingDisplay productId={product.id} productRatings={productRatings} size="sm" />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={currency} theme={theme} />
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          addProductToCart(product, seller);
                        }} 
                        className="rounded-lg bg-green-600 hover:bg-green-700 px-2 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onProductClick(product); }} className={`rounded-lg ${theme.btn} px-3 py-1.5 text-xs font-semibold text-white ${theme.btnHover}`}>
                        {t.order}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ) : template.layout === "single" ? (
              /* Single/Minimal layout — full width showcase */
              <article key={product.id} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg" onClick={() => onProductClick(product)}>
                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  {isNew(product) && <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">{t.newBadge}</span>}
                  <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur">
                    <Heart className={`h-5 w-5 ${wishlistIds.has(product.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                  </button>
                </div>
                <div className={`${template.aspectRatio} overflow-hidden`}>
                  {product.imageUrl ? (
                    <SafeImg src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" fallback={<PlaceholderImage className="h-full w-full" />} />
                  ) : (
                    <PlaceholderImage className="h-full w-full" />
                  )}
                </div>
                <div className={template.padding}>
                  <div className="flex items-center justify-between">
                    <p className={`${template.titleSize} font-bold text-slate-900`}>{product.name}</p>
                    <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={currency} theme={theme} size="lg" />
                  </div>
                  {product.shortDescription && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{product.shortDescription}</p>}
                  <ProductRatingDisplay productId={product.id} productRatings={productRatings} size="lg" />
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addProductToCart(product, seller);
                      }} 
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 py-3 text-sm font-semibold text-white transition-all"
                    >
                      <Plus className="h-4 w-4" /> {t.addToCart}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onProductClick(product); }} className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${theme.btn} py-3 text-sm font-semibold text-white ${theme.btnHover} transition-all`}>
                      <ShoppingBag className="h-4 w-4" /> {t.order}
                    </button>
                  </div>
                </div>
              </article>
            ) : (
              /* Grid layout — classic/boutique card */
              <article key={product.id} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={() => onProductClick(product)}>
                <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                  {isNew(product) && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{t.newBadge}</span>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110">
                  <Heart className={`h-4 w-4 transition ${wishlistIds.has(product.id) ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                </button>
                <div className="absolute inset-0 z-[5] hidden items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                  <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur">{t.quickView}</span>
                </div>
                <div className={`${template.aspectRatio} overflow-hidden`}>
                  {product.imageUrl ? (
                    <SafeImg src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" fallback={<PlaceholderImage className="h-full w-full" />} />
                  ) : (
                    <PlaceholderImage className="h-full w-full" />
                  )}
                </div>
                <div className={template.padding}>
                  <p className={`truncate ${template.titleSize} font-semibold text-slate-900`}>{product.name}</p>
                  {product.shortDescription && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{product.shortDescription}</p>}
                  <ProductRatingDisplay productId={product.id} productRatings={productRatings} size="sm" />
                  <div className="mt-1.5">
                    <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={currency} theme={theme} />
                  </div>
                </div>
                <div className={`px-2.5 pb-2.5 sm:px-3 sm:pb-3`}>
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addProductToCart(product, seller);
                      }} 
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 py-2 sm:py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.97]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onProductClick(product); }} className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl ${theme.btn} py-2 sm:py-2.5 text-xs font-semibold text-white ${theme.btnHover} transition-all active:scale-[0.97]`}>
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            )
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.aboutStore}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{seller.description || "—"}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          {seller.businessType && (
            <div><span className="text-xs text-slate-400">{t.businessType}</span><p className="font-medium text-slate-700">{seller.businessType}</p></div>
          )}
          {(seller.city || seller.country) && (
            <div><span className="text-xs text-slate-400">{t.location}</span><p className="font-medium text-slate-700">{[seller.city, seller.country].filter(Boolean).join(", ")}</p></div>
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
  const [name, setName] = useState(""); const [content, setContent] = useState(""); const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false); const [sent, setSent] = useState(false); const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?sellerId=${sellerId}`)
      .then((r) => r.json()).then((data) => { if (Array.isArray(data)) setComments(data); }).catch(() => {}).finally(() => setLoaded(true));
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
      const res = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId, authorName: name.trim(), content: content.trim(), rating }) });
      if (res.ok) { const c = await res.json(); setComments((prev) => [c, ...prev]); setName(""); setContent(""); setRating(5); setSent(true); setShowForm(false); setTimeout(() => setSent(false), 3000); }
    } catch {} finally { setSending(false); }
  };

  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <div className="flex items-start gap-6 rounded-2xl border border-slate-200 bg-white p-5">
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
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(distribution[star - 1] / maxDist) * 100}%` }} />
                </div>
                <span className="w-4 text-right text-slate-400">{distribution[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!showForm && !sent && <button onClick={() => setShowForm(true)} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition">{t.writeReview}</button>}
        {sent && <span className="text-sm text-emerald-600">✓ {t.reviewSubmitted}</span>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
          <div><label className="text-xs font-medium text-slate-500">{t.rating}</label><StarRatingInput value={rating} onChange={setRating} /></div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t.yourReview} required rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition">{sending ? t.submitting : t.submitReview}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition">{t.close}</button>
          </div>
        </form>
      )}

      {loaded && comments.length === 0 && !showForm && <p className="py-12 text-center text-sm text-slate-400">{t.noReviews}</p>}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">{c.authorName}</span>
              <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            {c.rating && <StarRating rating={c.rating} />}
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.content}</p>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">{t.contactInfo}</h3>
        {(seller.city || seller.address) && (
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{[seller.address, seller.city, seller.country].filter(Boolean).join(", ")}</span></div>
        )}
        {social.whatsapp && (
          <a href={social.whatsapp} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition">
            <MessageCircle className="h-4 w-4" /> {t.whatsapp}
          </a>
        )}
      </div>
      {(social.instagram || social.facebook) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">{t.socialLinks}</h3>
          <div className="mt-3 flex gap-3">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:border-pink-300 hover:text-pink-600 transition"><Instagram className="h-4 w-4" /> Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:border-green-300 hover:text-green-600 transition"><Facebook className="h-4 w-4" /> Facebook</a>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Star Components ── */
function StarRating({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div>;
}
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5"><Star className={`h-6 w-6 transition ${i <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"}`} /></button>)}</div>;
}

/* ── Product Modal with coupon integration ── */
function ProductModal({
  product, sellerId, slug, currency, t, theme, onClose, customer, isWished, toggleWishlist,
}: {
  product: Product; sellerId: number; slug: string; currency: string; t: Record<string, string>;
  theme: ReturnType<typeof getTheme>; onClose: () => void; customer: CustomerInfo;
  isWished: boolean; toggleWishlist: (id: number) => void;
}) {
  const [tab, setTab] = useState<"details" | "reviews" | "order" | "review-form">("details");
  const images = getProductImages(product);
  const [activeImg, setActiveImg] = useState(0);

  // Touch swipe for image gallery
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) setActiveImg((i) => (i + 1) % images.length);
      else setActiveImg((i) => (i - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="truncate text-base font-bold text-slate-900">{product.name}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleWishlist(product.id)} className="rounded-lg p-2 transition hover:bg-red-50">
              <Heart className={`h-5 w-5 transition ${isWished ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mini tabs */}
        <div className="flex border-b border-slate-100">
          {tab === "review-form" ? (
            <>
              <button 
                onClick={() => setTab("reviews")} 
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> {t.reviews}
              </button>
              <div className="flex-1 text-center py-2.5 text-xs font-medium text-slate-900">
                {t.writeReview}
              </div>
            </>
          ) : (
            ([
              { id: "details" as const, label: t.details },
              { id: "reviews" as const, label: t.reviews },
              { id: "order" as const, label: t.orderTab },
            ]).map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex-1 py-2.5 text-xs font-medium transition-all ${tab === tb.id ? `border-b-2 ${theme.tabBorder} ${theme.tab}` : "text-slate-500"}`}>{tb.label}</button>
            ))
          )}
        </div>

        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(92vh - 110px)" }}>
          {tab === "details" && (
            <div className="p-5">
              {/* Image gallery with swipe */}
              {images.length > 0 ? (
                <div className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  <SafeImg src={images[activeImg]} alt={product.name} className="aspect-[4/3] w-full rounded-xl object-cover" fallback={<PlaceholderImage className="aspect-[4/3] w-full rounded-xl" />} />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur transition hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
                      <button onClick={() => setActiveImg((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur transition hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
                      {/* Dot indicators */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setActiveImg(i)} className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {images.map((url, i) => (
                          <button key={i} onClick={() => setActiveImg(i)} className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${i === activeImg ? "border-green-500 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"}`}>
                            <SafeImg src={url} alt="" className="h-14 w-14 object-cover" fallback={<PlaceholderImage className="h-14 w-14" />} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <PlaceholderImage className="aspect-[4/3] w-full rounded-xl" />
              )}
              <div className="mt-4 flex items-center justify-between">
                <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={currency} theme={theme} size="lg" />
                {product.category && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{product.category}</span>}
              </div>
              {product.shortDescription && <p className="mt-3 text-sm leading-relaxed text-slate-600">{product.shortDescription}</p>}
              <button onClick={() => setTab("order")} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl ${theme.btn} py-3 text-sm font-semibold text-white ${theme.btnHover} transition-all active:scale-[0.98]`}>
                <ShoppingBag className="h-4 w-4" /> {t.addToOrder}
              </button>
            </div>
          )}
          {tab === "reviews" && (
            <div className="p-5">
              <ProductReviews 
                productId={product.id} 
                customer={customer}
                onWriteReview={() => setTab("review-form")}
              />
            </div>
          )}
          {tab === "order" && (
            <div className="p-5">
              <OrderForm product={product} sellerId={sellerId} slug={slug} currency={currency} t={t} theme={theme} onClose={onClose} customer={customer} />
            </div>
          )}
          {tab === "review-form" && (
            <div className="p-5">
              <ReviewForm
                productId={product.id}
                productName={product.name}
                customer={customer}
                onSuccess={() => {
                  setTab("reviews");
                  // Refresh reviews
                }}
                onCancel={() => setTab("reviews")}
              />
            </div>
          )}
        </div>

        {/* Sticky add-to-order bar on mobile when viewing details */}
        {tab === "details" && (
          <div className="sticky bottom-0 border-t border-slate-100 bg-white p-3 sm:hidden">
            <button onClick={() => setTab("order")} className={`flex w-full items-center justify-center gap-2 rounded-xl ${theme.btn} py-3 text-sm font-semibold text-white ${theme.btnHover} transition-all active:scale-[0.98]`}>
              <ShoppingBag className="h-4 w-4" /> {t.addToOrder} · {currency} {product.price}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Product Reviews ── */
// Function removed - replaced with new ProductReviews component

/* ── Order Form with Coupon Integration ── */
function OrderForm({
  product, sellerId, slug, currency, t, theme, onClose, customer,
}: {
  product: Product; sellerId: number; slug: string; currency: string; t: Record<string, string>;
  theme: ReturnType<typeof getTheme>; onClose: () => void; customer: CustomerInfo;
}) {
  const [name, setName] = useState(customer?.name || "");
  const [contact, setContact] = useState(customer?.email || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);

  // Coupon state
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; type: string; value: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validating, setValidating] = useState(false);

  const unitPrice = Number(product.price) || 0;
  const subtotal = unitPrice * quantity;
  const discount = couponApplied?.discount || 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), sellerId, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: data.coupon.code, discount: data.discount, type: data.coupon.type, value: data.coupon.value });
        setCouponError("");
      } else {
        setCouponError(data.error || t.invalidCoupon);
        setCouponApplied(null);
      }
    } catch {
      setCouponError(t.invalidCoupon);
    } finally { setValidating(false); }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`/api/storefront/${slug}/order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: product.id,
          customerName: name.trim(),
          customerContact: contact.trim(),
          quantity,
          message: notes.trim(),
          couponCode: couponApplied?.code || "",
          discountAmount: discount,
        }),
      });
      const data = await res.json();
      setResult({ reference: data.reference || `ORD-${data.id}` });
    } catch { setResult({ reference: "—" }); } finally { setSending(false); }
  };

  if (result) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="mt-3 text-base font-semibold text-slate-900">{t.orderSuccess}</p>
        <p className="mt-1 text-sm text-slate-600">{t.orderRef}: <span className="font-mono font-bold">{result.reference}</span></p>
        <p className="mt-0.5 text-xs text-slate-500">{t.orderSuccessHint}</p>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">{t.close}</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        {product.imageUrl ? <SafeImg src={product.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" fallback={<PlaceholderImage className="h-12 w-12 rounded-lg" />} /> : <PlaceholderImage className="h-12 w-12 rounded-lg" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={currency} theme={theme} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderName}</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.orderNamePh} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderContact}</label>
        <input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.orderContactPh} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderQty}</label>
        <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="mt-1 w-20 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">{t.orderNotes}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.orderNotesPh} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100" />
      </div>

      {/* Coupon section */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3">
        {!showCoupon && !couponApplied ? (
          <button type="button" onClick={() => setShowCoupon(true)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition">
            <Tag className="h-4 w-4" /> {t.haveCoupon}
          </button>
        ) : couponApplied ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              <span className="font-mono text-sm font-bold text-emerald-700">{couponApplied.code}</span>
              <span className="text-xs text-emerald-600">
                {couponApplied.type === "percentage" ? `-${couponApplied.value}%` : `-${currency} ${couponApplied.value}`}
              </span>
            </div>
            <button type="button" onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700">{t.removeCoupon}</button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t.couponPlaceholder}
                className="h-10 flex-1 rounded-lg border border-slate-200 px-3 font-mono text-sm uppercase focus:border-green-300 focus:outline-none"
              />
              <button
                type="button" onClick={applyCoupon} disabled={validating}
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {validating ? "..." : t.applyCoupon}
              </button>
            </div>
            {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{t.originalPrice}</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>{t.discount}</span>
            <span>-{currency} {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
          <span>{t.total}</span>
          <span>{currency} {finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <button type="submit" disabled={sending} className={`flex w-full items-center justify-center gap-2 rounded-xl ${theme.btn} py-3 text-sm font-semibold text-white ${theme.btnHover} disabled:opacity-50 transition-all active:scale-[0.98]`}>
        <Send className="h-4 w-4" /> {sending ? t.orderSending : t.orderSubmit}
      </button>
    </form>
  );
}

/* ── Helpers ── */
function getProductImages(product: Product): string[] {
  const urls: string[] = [];
  if (product.imageUrls) { try { const parsed = JSON.parse(product.imageUrls); if (Array.isArray(parsed)) urls.push(...parsed.filter(Boolean)); } catch {} }
  if (urls.length === 0 && product.imageUrl) urls.push(product.imageUrl);
  return urls;
}

/* ── Product Rating Display ── */
function ProductRatingDisplay({ productId, productRatings, size = 'sm' }: {
  productId: number;
  productRatings: Record<number, { average: number; count: number }>;
  size?: 'sm' | 'lg';
}) {
  const rating = productRatings[productId];
  
  if (!rating || rating.count === 0) {
    return null;
  }

  const starSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating.average) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-slate-300"
            }`}
          />
        ))}
      </div>
      <span className={`${textSize} font-medium text-slate-600`}>
        {rating.average}
      </span>
      <span className={`${textSize} text-slate-400`}>
        ({rating.count})
      </span>
    </div>
  );
}
