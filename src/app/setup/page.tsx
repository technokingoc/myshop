"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import {
  Store,
  ShoppingBag,
  Pencil,
  Trash2,
  Plus,
  Save,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  CreditCard,
  MessageCircle,
  Instagram,
  Facebook,
  Star,
  Clock,
  BarChart3,
  X,
  ImageIcon,
  LayoutDashboard,
} from "lucide-react";

type CatalogType = "Product" | "Service";
type CatalogStatus = "Draft" | "Published";

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

type CatalogItem = {
  id: number;
  name: string;
  type: CatalogType;
  category: string;
  shortDescription: string;
  imageUrl: string;
  price: string;
  status: CatalogStatus;
};

type SetupPersisted = {
  step: number;
  done: boolean;
  data: SetupData;
  sellerId?: number;
};

const STORAGE = {
  setup: "myshop_setup_v2",
  catalog: "myshop_catalog_v2",
  sellerId: "myshop_seller_id",
};

const defaultSetup: SetupData = {
  storeName: "",
  storefrontSlug: "",
  ownerName: "",
  businessType: "Retail",
  currency: "USD",
  city: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
};

const defaultCatalog: CatalogItem[] = [
  {
    id: 1,
    name: "Sample Product A",
    type: "Product",
    category: "Beauty",
    shortDescription: "Hydrating serum for daily use.",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
    price: "15",
    status: "Published",
  },
  {
    id: 2,
    name: "Sample Service B",
    type: "Service",
    category: "Consulting",
    shortDescription: "30-minute onboarding call.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
    price: "25",
    status: "Published",
  },
  {
    id: 3,
    name: "Sample Product C",
    type: "Product",
    category: "Food",
    shortDescription: "Fresh homemade snack box.",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600",
    price: "8",
    status: "Draft",
  },
];

const dictionary = {
  en: {
    badge: "Built for informal sellers & micro businesses",
    title: "Launch your professional storefront in minutes",
    subtitle:
      "MyShop helps small sellers create trusted online storefronts, organize products, and share social ordering links without technical complexity.",
    ctaPrimary: "Start setup",
    ctaSecondary: "Manage catalog",
    whyMocked: "MVP note: local storage only (no backend yet).",

    setupTitle: "Store setup flow",
    setupSubtitle: "3-step onboarding persisted in your browser local storage.",
    stepLabel: "Step",
    completed: "Completed",
    slugHint: "Use lowercase letters/numbers and dashes only.",
    previewRoute: "Storefront route mock",
    stepNames: ["Store identity", "Business details", "Social channels"],
    progressLabel: "Progress",
    requiredField: "This field is required",

    catalogTitle: "Catalog management",
    catalogSubtitle: "Mock CRUD with add/edit/delete persisted locally.",
    imagePreview: "Image preview",

    previewTitle: "Storefront preview",
    previewSubtitle: "Live preview from your setup + catalog.",
    socialLinks: "Social links",
    productsSection: "Products",
    servicesSection: "Services",
    emptyProducts: "No published products yet.",
    emptyServices: "No published services yet.",
    cardCTAProduct: "Order now",
    cardCTAService: "Book now",
    categoryFilter: "Category filters",
    allCategories: "All categories",

    sellerProfileTitle: "Seller profile",
    basedIn: "Based in",
    responseRate: "Response rate",
    avgReply: "Avg. reply",
    customerReviews: "Customer reviews",
    socialProofPending: "Public social proof will appear after your first 3 completed customer intents.",
    noDataYet: "No data yet — stats will appear once your store is active.",

    intentModalTitleProduct: "Order intent",
    intentModalTitleService: "Booking intent",
    intentIntro: "This sends a mock intent only. No payment is executed here.",
    intentName: "Customer name",
    intentContact: "Preferred contact",
    intentMessage: "Notes",
    intentSubmit: "Send intent",
    intentDone: "Intent captured. Follow up manually via social channels.",
    paypalMockNote: "PayPal note: checkout happens on external PayPal page only (manual link in MVP).",
    closeBtn: "Close",

    pricingTitle: "Affordable pricing",
    pricingSubtitle: "Simple plans with clear PayPal checkout messaging.",
    planName: "Starter",
    planPrice: "$9 / month",
    planBullets: [
      "1 storefront with custom slug",
      "Catalog up to 50 products/services",
      "Social CTA buttons (WhatsApp / Instagram / Facebook)",
      "PayPal payment link support (manual link in MVP)",
    ],
    planFoot: "PayPal checkout opens an external PayPal page. MyShop does not process or store card details in this MVP.",
    paypalInfo: "PayPal-ready: connect your plan manually after subscription confirmation.",
    choosePlan: "Coming soon",

    nextBtn: "Next",
    backBtn: "Back",
    finishBtn: "Finish",
    resetBtn: "Reset",
    doneMsg: "Setup draft saved and marked as complete.",

    catalogFormTitle: "Add / edit item",
    itemName: "Item name",
    itemType: "Type",
    itemCategory: "Category",
    itemDescription: "Short description",
    itemImageUrl: "Image URL",
    itemPrice: "Price",
    itemStatus: "Status",
    addBtn: "Add item",
    saveBtn: "Save changes",
    cancelBtn: "Cancel",
    editBtn: "Edit",
    deleteBtn: "Delete",
    deleteConfirm: "Are you sure you want to delete this item?",
    published: "Published",
    draft: "Draft",

    labels: {
      storeName: "Store name",
      storefrontSlug: "Storefront slug",
      ownerName: "Owner name",
      businessType: "Business type",
      currency: "Preferred currency",
      city: "City / area",
      whatsapp: "WhatsApp link",
      instagram: "Instagram link",
      facebook: "Facebook link",
    },
  },
  pt: {
    badge: "Feito para vendedores informais e micro negócios",
    title: "Lance sua loja profissional em minutos",
    subtitle:
      "O MyShop ajuda pequenos vendedores a criar vitrines online confiáveis, organizar produtos e partilhar links sociais sem complexidade técnica.",
    ctaPrimary: "Iniciar configuração",
    ctaSecondary: "Gerir catálogo",
    whyMocked: "Nota MVP: apenas armazenamento local (sem backend ainda).",

    setupTitle: "Fluxo de configuração da loja",
    setupSubtitle: "Onboarding em 3 etapas persistido no armazenamento local.",
    stepLabel: "Etapa",
    completed: "Concluído",
    slugHint: "Use apenas minúsculas/números e hífen.",
    previewRoute: "Mock da rota da loja",
    stepNames: ["Identidade da loja", "Dados do negócio", "Canais sociais"],
    progressLabel: "Progresso",
    requiredField: "Este campo é obrigatório",

    catalogTitle: "Gestão de catálogo",
    catalogSubtitle: "CRUD mock com adicionar/editar/apagar persistido localmente.",
    imagePreview: "Pré-visualização da imagem",

    previewTitle: "Pré-visualização da loja",
    previewSubtitle: "Prévia ao vivo com base na configuração + catálogo.",
    socialLinks: "Links sociais",
    productsSection: "Produtos",
    servicesSection: "Serviços",
    emptyProducts: "Ainda não há produtos publicados.",
    emptyServices: "Ainda não há serviços publicados.",
    cardCTAProduct: "Encomendar",
    cardCTAService: "Reservar",
    categoryFilter: "Filtros de categoria",
    allCategories: "Todas categorias",

    sellerProfileTitle: "Perfil do vendedor",
    basedIn: "Localização",
    responseRate: "Taxa de resposta",
    avgReply: "Resposta média",
    customerReviews: "Avaliações de clientes",
    socialProofPending: "A prova social pública aparece após os 3 primeiros intentos concluídos de clientes.",
    noDataYet: "Ainda sem dados — as estatísticas aparecerão quando a loja estiver ativa.",

    intentModalTitleProduct: "Intenção de encomenda",
    intentModalTitleService: "Intenção de reserva",
    intentIntro: "Isto envia apenas uma intenção mock. Nenhum pagamento é executado aqui.",
    intentName: "Nome do cliente",
    intentContact: "Contacto preferido",
    intentMessage: "Notas",
    intentSubmit: "Enviar intenção",
    intentDone: "Intenção registada. Faça o seguimento manual pelos canais sociais.",
    paypalMockNote: "Nota PayPal: o checkout acontece apenas numa página externa do PayPal (link manual no MVP).",
    closeBtn: "Fechar",

    pricingTitle: "Preço acessível",
    pricingSubtitle: "Planos simples com mensagem clara sobre checkout PayPal.",
    planName: "Inicial",
    planPrice: "$9 / mês",
    planBullets: [
      "1 loja virtual com slug personalizado",
      "Catálogo até 50 produtos/serviços",
      "Botões CTA sociais (WhatsApp / Instagram / Facebook)",
      "Suporte a link de pagamento PayPal (manual no MVP)",
    ],
    planFoot: "O checkout PayPal abre numa página externa do PayPal. O MyShop não processa nem guarda dados de cartão neste MVP.",
    paypalInfo: "Pronto para PayPal: conecte o plano manualmente após confirmação da subscrição.",
    choosePlan: "Em breve",

    nextBtn: "Próximo",
    backBtn: "Voltar",
    finishBtn: "Concluir",
    resetBtn: "Reiniciar",
    doneMsg: "Rascunho salvo e configuração marcada como concluída.",

    catalogFormTitle: "Adicionar / editar item",
    itemName: "Nome do item",
    itemType: "Tipo",
    itemCategory: "Categoria",
    itemDescription: "Descrição curta",
    itemImageUrl: "URL da imagem",
    itemPrice: "Preço",
    itemStatus: "Estado",
    addBtn: "Adicionar item",
    saveBtn: "Guardar alterações",
    cancelBtn: "Cancelar",
    editBtn: "Editar",
    deleteBtn: "Apagar",
    deleteConfirm: "Tem a certeza que deseja apagar este item?",
    published: "Publicado",
    draft: "Rascunho",

    labels: {
      storeName: "Nome da loja",
      storefrontSlug: "Slug da loja",
      ownerName: "Nome do responsável",
      businessType: "Tipo de negócio",
      currency: "Moeda preferida",
      city: "Cidade / bairro",
      whatsapp: "Link do WhatsApp",
      instagram: "Link do Instagram",
      facebook: "Link do Facebook",
    },
  },
};

const blankCatalogForm: Omit<CatalogItem, "id"> = {
  name: "",
  type: "Product",
  category: "",
  shortDescription: "",
  imageUrl: "",
  price: "",
  status: "Draft",
};

const blankIntent = {
  name: "",
  contact: "",
  note: "",
};

export default function Home() {
  const initialSetupPersisted: SetupPersisted | null = (() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE.setup);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SetupPersisted;
    } catch {
      return null;
    }
  })();

  const { lang } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(() => Math.min(3, Math.max(1, initialSetupPersisted?.step || 1)));
  const [done, setDone] = useState(() => Boolean(initialSetupPersisted?.done));
  const [setup, setSetup] = useState<SetupData>(() => ({ ...defaultSetup, ...(initialSetupPersisted?.data || {}) }));
  const [setupErrors, setSetupErrors] = useState<Partial<Record<keyof SetupData, string>>>({});
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    if (typeof window === "undefined") return defaultCatalog;
    const raw = localStorage.getItem(STORAGE.catalog);
    if (!raw) return defaultCatalog;
    try {
      const parsed = JSON.parse(raw) as CatalogItem[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCatalog;
    } catch {
      return defaultCatalog;
    }
  });

  const [sellerId, setSellerId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE.sellerId);
    return raw ? Number(raw) : null;
  });
  const [catalogForm, setCatalogForm] = useState(blankCatalogForm);

  useEffect(() => {
    if (!sellerId) return;
    fetch(`/api/catalog?sellerId=${sellerId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setCatalog(
            rows.map((row) => ({
              id: row.id,
              name: row.name,
              type: row.type,
              category: row.category || "",
              shortDescription: row.shortDescription || "",
              imageUrl: row.imageUrl || "",
              price: String(row.price ?? ""),
              status: row.status,
            })),
          );
        }
      })
      .catch(() => {});
  }, [sellerId]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const [intentItem, setIntentItem] = useState<CatalogItem | null>(null);
  const [intentData, setIntentData] = useState(blankIntent);
  const [intentSubmitted, setIntentSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.setup,
      JSON.stringify({
        step,
        done,
        data: setup,
        sellerId: sellerId ?? undefined,
      } satisfies SetupPersisted),
    );
  }, [step, done, setup, sellerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE.catalog, JSON.stringify(catalog));
  }, [catalog]);


  const t = useMemo(() => dictionary[lang], [lang]);

  const updateSetup = (key: keyof SetupData, value: string) => {
    const next = key === "storefrontSlug" ? sanitizeSlug(value) : value;
    setSetup((prev) => ({ ...prev, [key]: next }));
    setSetupErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const resetSetup = () => {
    setStep(1);
    setDone(false);
    setSetup(defaultSetup);
    setSetupErrors({});
    localStorage.removeItem(STORAGE.setup);
  };

  const onCatalogField = (key: keyof Omit<CatalogItem, "id">, value: string) => {
    setCatalogForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitCatalog = async () => {
    if (!catalogForm.name.trim() || !catalogForm.price.trim()) return;

    if (sellerId) {
      try {
        if (editingId !== null) {
          const res = await fetch("/api/catalog", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...catalogForm }),
          });
          const row = await res.json();
          setCatalog((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...catalogForm, id: row.id ?? editingId } : item)));
          setEditingId(null);
        } else {
          const res = await fetch("/api/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sellerId, ...catalogForm }),
          });
          const row = await res.json();
          setCatalog((prev) => [...prev, { id: row.id ?? (prev.length ? Math.max(...prev.map((i) => i.id)) + 1 : 1), ...catalogForm }]);
        }
      } catch {
        if (editingId !== null) {
          setCatalog((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...catalogForm } : item)));
          setEditingId(null);
        } else {
          const nextId = catalog.length ? Math.max(...catalog.map((i) => i.id)) + 1 : 1;
          setCatalog((prev) => [...prev, { id: nextId, ...catalogForm }]);
        }
      }
    } else {
      if (editingId !== null) {
        setCatalog((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...catalogForm } : item)));
        setEditingId(null);
      } else {
        const nextId = catalog.length ? Math.max(...catalog.map((i) => i.id)) + 1 : 1;
        setCatalog((prev) => [...prev, { id: nextId, ...catalogForm }]);
      }
    }

    setCatalogForm(blankCatalogForm);
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setCatalogForm({
      name: item.name,
      type: item.type,
      category: item.category,
      shortDescription: item.shortDescription,
      imageUrl: item.imageUrl,
      price: item.price,
      status: item.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCatalogForm(blankCatalogForm);
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: Partial<Record<keyof SetupData, string>> = {};

    if (targetStep === 1) {
      if (!setup.storeName.trim()) nextErrors.storeName = t.requiredField;
      if (!setup.storefrontSlug.trim()) nextErrors.storefrontSlug = t.requiredField;
    }

    if (targetStep === 2) {
      if (!setup.ownerName.trim()) nextErrors.ownerName = t.requiredField;
      if (!setup.businessType.trim()) nextErrors.businessType = t.requiredField;
      if (!setup.currency.trim()) nextErrors.currency = t.requiredField;
      if (!setup.city.trim()) nextErrors.city = t.requiredField;
    }

    if (targetStep === 3) {
      if (!setup.whatsapp.trim()) nextErrors.whatsapp = t.requiredField;
    }

    setSetupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onNextStep = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const onFinish = async () => {
    if (!validateStep(3)) return;

    const slug = setup.storefrontSlug || sanitizeSlug(setup.storeName) || "myshop-demo";
    try {
      const payload = {
        slug,
        name: setup.storeName,
        ownerName: setup.ownerName,
        businessType: setup.businessType,
        currency: setup.currency,
        city: setup.city,
        socialLinks: {
          whatsapp: setup.whatsapp,
          instagram: setup.instagram,
          facebook: setup.facebook,
        },
      };

      let seller: { id: number } | null = null;
      const existingRes = await fetch(`/api/sellers/${slug}`);
      if (existingRes.ok) {
        await fetch(`/api/sellers/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const refreshed = await fetch(`/api/sellers/${slug}`);
        seller = await refreshed.json();
      } else {
        const createRes = await fetch("/api/sellers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        seller = await createRes.json();
      }

      if (seller?.id) {
        setSellerId(seller.id);
        localStorage.setItem(STORAGE.sellerId, String(seller.id));
      }
    } catch {
      // fallback to local-only mode
    }

    setDone(true);
  };

  const openIntentModal = (item: CatalogItem) => {
    setIntentItem(item);
    setIntentData(blankIntent);
    setIntentSubmitted(false);
  };

  const closeIntentModal = () => {
    setIntentItem(null);
  };

  const submitIntent = () => {
    if (!intentData.name.trim() || !intentData.contact.trim()) return;
    setIntentSubmitted(true);
  };

  const slug = setup.storefrontSlug || sanitizeSlug(setup.storeName) || "myshop-demo";
  const previewPath = `/s/${slug}`;
  const previewUrl = `https://myshop-amber.vercel.app${previewPath}?preview=1`;

  const publishedProducts = catalog.filter((i) => i.type === "Product" && i.status === "Published");
  const publishedServices = catalog.filter((i) => i.type === "Service" && i.status === "Published");
  const publishedCatalog = catalog.filter((i) => i.status === "Published");

  const categories = [
    "all",
    ...Array.from(
      new Set(
        publishedCatalog
          .map((item) => item.category.trim())
          .filter(Boolean),
      ),
    ),
  ];

  const filteredPublishedCatalog =
    activeCategory === "all" ? publishedCatalog : publishedCatalog.filter((item) => item.category === activeCategory);

  const progressPct = Math.round((step / 3) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-gradient-to-b from-indigo-100 to-white p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-between gap-2">
            <p className="rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1 text-xs sm:text-sm">{t.badge}</p>
          </div>

          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600 sm:text-base">{t.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {done ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                {lang === "en" ? "Go to Dashboard" : "Ir ao Painel"}
              </button>
            ) : (
              <a href="#setup" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white">
                <Store className="h-4 w-4" />
                {t.ctaPrimary}
              </a>
            )}
            <a href="#catalog" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2">
              <ShoppingBag className="h-4 w-4" />
              {t.ctaSecondary}
            </a>
          </div>
          <p className="mt-5 text-xs text-amber-700">{t.whyMocked}</p>
        </header>

        <section id="setup" className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold">{t.setupTitle}</h2>
          <p className="text-sm text-slate-600">{t.setupSubtitle}</p>
          <p className="text-xs text-slate-500">
            {t.stepLabel} {step}/3 • {t.stepNames[step - 1]} {done && `• ${t.completed}`}
          </p>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{t.progressLabel}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {t.stepNames.map((name, idx) => {
                const current = idx + 1;
                const active = current === step;
                const complete = current < step || done;
                return (
                  <div
                    key={name}
                    className={`rounded-lg border px-2 py-1 text-center text-[11px] ${
                      active ? "border-indigo-300 bg-indigo-50" : complete ? "border-emerald-200 bg-emerald-50" : "border-slate-200"
                    }`}
                  >
                    {name}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">
            <p className="font-medium text-indigo-700">{t.previewRoute}</p>
            <p className="mt-1 break-all text-slate-600">{previewPath}</p>
            <a href={previewUrl} className="mt-2 inline-block text-indigo-600 underline underline-offset-2" target="_blank" rel="noreferrer">
              {previewUrl}
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {step === 1 && (
              <>
                <Input
                  label={t.labels.storeName}
                  value={setup.storeName}
                  error={setupErrors.storeName}
                  onChange={(v) => updateSetup("storeName", v)}
                />
                <div className="grid gap-1 text-sm">
                  <Input
                    label={t.labels.storefrontSlug}
                    value={setup.storefrontSlug}
                    error={setupErrors.storefrontSlug}
                    onChange={(v) => updateSetup("storefrontSlug", v)}
                  />
                  <span className="text-xs text-slate-500">{t.slugHint}</span>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Input label={t.labels.ownerName} value={setup.ownerName} error={setupErrors.ownerName} onChange={(v) => updateSetup("ownerName", v)} />
                <Input
                  label={t.labels.businessType}
                  value={setup.businessType}
                  error={setupErrors.businessType}
                  onChange={(v) => updateSetup("businessType", v)}
                />
                <Input label={t.labels.currency} value={setup.currency} error={setupErrors.currency} onChange={(v) => updateSetup("currency", v)} />
                <Input label={t.labels.city} value={setup.city} error={setupErrors.city} onChange={(v) => updateSetup("city", v)} />
              </>
            )}
            {step === 3 && (
              <>
                <Input label={t.labels.whatsapp} value={setup.whatsapp} error={setupErrors.whatsapp} onChange={(v) => updateSetup("whatsapp", v)} />
                <Input label={t.labels.instagram} value={setup.instagram} onChange={(v) => updateSetup("instagram", v)} />
                <Input label={t.labels.facebook} value={setup.facebook} onChange={(v) => updateSetup("facebook", v)} />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.backBtn}
            </button>
            {step < 3 ? (
              <button onClick={onNextStep} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white">
                {t.nextBtn}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={onFinish} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white">
                <Check className="h-3.5 w-3.5" />
                {t.finishBtn}
              </button>
            )}
            <button onClick={resetSetup} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2">
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resetBtn}
            </button>
            {done && (
              <div className="flex items-center gap-2 self-center">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">{t.doneMsg}</span>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {lang === "en" ? "Dashboard" : "Painel"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section id="catalog" className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold">{t.catalogTitle}</h2>
          <p className="mb-4 text-sm text-slate-600">{t.catalogSubtitle}</p>

          <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-3">
            <h3 className="sm:col-span-2 xl:col-span-3 font-medium">{t.catalogFormTitle}</h3>
            <Input label={t.itemName} value={catalogForm.name} onChange={(v) => onCatalogField("name", v)} />
            <Input label={t.itemCategory} value={catalogForm.category} onChange={(v) => onCatalogField("category", v)} />
            <Input label={t.itemDescription} value={catalogForm.shortDescription} onChange={(v) => onCatalogField("shortDescription", v)} />
            <Input label={t.itemImageUrl} value={catalogForm.imageUrl} onChange={(v) => onCatalogField("imageUrl", v)} />
            <Input label={t.itemPrice} value={catalogForm.price} onChange={(v) => onCatalogField("price", v)} />

            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">{t.itemType}</span>
              <select
                value={catalogForm.type}
                onChange={(e) => onCatalogField("type", e.target.value as CatalogType)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 transition focus:ring"
              >
                <option value="Product">{t.productsSection}</option>
                <option value="Service">{t.servicesSection}</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">{t.itemStatus}</span>
              <select
                value={catalogForm.status}
                onChange={(e) => onCatalogField("status", e.target.value as CatalogStatus)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-indigo-300 transition focus:ring"
              >
                <option value="Draft">{t.draft}</option>
                <option value="Published">{t.published}</option>
              </select>
            </label>

            <div className="sm:col-span-2 xl:col-span-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs text-slate-600">{t.imagePreview}</p>
              <PreviewImage src={catalogForm.imageUrl} alt={catalogForm.name || "preview"} className="h-36 w-full rounded-lg object-cover" />
            </div>

            <div className="sm:col-span-2 xl:col-span-3 flex gap-2">
              <button onClick={submitCatalog} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white">
                {editingId !== null ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {editingId !== null ? t.saveBtn : t.addBtn}
              </button>
              {editingId !== null && (
                <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2">
                  <XCircle className="h-3.5 w-3.5" />
                  {t.cancelBtn}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {catalog.map((item) => (
              <article key={item.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[96px_1fr]">
                <PreviewImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-[72px] w-[72px] rounded-lg object-cover sm:h-[96px] sm:w-[96px]"
                />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-xs text-slate-500">{item.category || "General"}</p>
                  <p className="text-sm text-slate-600">{item.shortDescription || "-"}</p>
                  <p className="text-sm text-slate-600">
                    {item.type} • {setup.currency} {item.price}
                  </p>
                  <span className="mt-2 inline-block rounded-full border border-slate-300 px-2 py-1 text-xs">
                    {item.status === "Published" ? t.published : t.draft}
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => startEdit(item)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs">
                      <Pencil className="h-3 w-3" />
                      {t.editBtn}
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(t.deleteConfirm)) return;
                        if (sellerId) {
                          try {
                            await fetch(`/api/catalog?id=${item.id}`, { method: "DELETE" });
                          } catch {}
                        }
                        setCatalog((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t.deleteBtn}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-xl font-semibold">{t.previewTitle}</h2>
            <p className="mb-4 text-sm text-slate-600">{t.previewSubtitle}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold">{setup.storeName || "MyShop Demo Store"}</h3>
              <p className="text-sm text-slate-600">@{slug}</p>

              <h4 className="mt-4 text-sm font-medium text-slate-600">{t.sellerProfileTitle}</h4>
              <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p>
                  {setup.ownerName || "Store Owner"} • {setup.businessType || "Micro business"}
                </p>
                <p className="text-slate-600">
                  {t.basedIn}: {setup.city || "Maputo"}
                </p>
                <div className="mt-2 rounded-md border border-slate-200 p-2 text-center text-xs text-slate-500">
                  {t.noDataYet}
                </div>
                <p className="mt-2 text-xs text-slate-500">{t.socialProofPending}</p>
              </div>

              <h4 className="mt-4 text-sm font-medium text-slate-600">{t.socialLinks}</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  WhatsApp: <LinkOrText href={setup.whatsapp} fallback="https://wa.me/your-number" />
                </li>
                <li>
                  Instagram: <LinkOrText href={setup.instagram} fallback="https://instagram.com/your-store" />
                </li>
                <li>
                  Facebook: <LinkOrText href={setup.facebook} fallback="https://facebook.com/your-store" />
                </li>
              </ul>

              <h4 className="mt-4 text-sm font-medium text-slate-600">{t.productsSection}</h4>
              {publishedProducts.length === 0 ? (
                <p className="text-sm text-slate-500">{t.emptyProducts}</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {publishedProducts.map((item) => (
                    <li key={item.id}>
                      {item.name} • {setup.currency} {item.price}
                    </li>
                  ))}
                </ul>
              )}

              <h4 className="mt-4 text-sm font-medium text-slate-600">{t.servicesSection}</h4>
              {publishedServices.length === 0 ? (
                <p className="text-sm text-slate-500">{t.emptyServices}</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {publishedServices.map((item) => (
                    <li key={item.id}>
                      {item.name} • {setup.currency} {item.price}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-xl font-semibold">{t.pricingTitle}</h2>
            <p className="mb-4 text-sm text-slate-600">{t.pricingSubtitle}</p>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h3 className="text-lg font-semibold">{t.planName}</h3>
              <p className="mt-1 text-2xl font-bold">{t.planPrice}</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                {t.planBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-amber-300/40 bg-amber-50 p-2 text-xs text-amber-700">{t.planFoot}</p>
              <p className="mt-2 text-xs text-slate-600">{t.paypalInfo}</p>
              <button disabled className="mt-3 rounded-lg bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed">{t.choosePlan}</button>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">{t.previewTitle} • Cards</h2>
          <p className="mb-3 text-sm text-slate-600">{t.categoryFilter}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeCategory === cat ? "border-indigo-300 bg-indigo-50" : "border-slate-300"
                }`}
              >
                {cat === "all" ? t.allCategories : cat}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPublishedCatalog.map((item) => (
              <article key={`card-${item.id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <PreviewImage src={item.imageUrl} alt={item.name} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs text-indigo-600">{item.category || "General"}</p>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.shortDescription || "-"}</p>
                  <p className="mt-2 text-sm font-medium">
                    {setup.currency} {item.price}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openIntentModal(item)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      {item.type === "Product" ? t.cardCTAProduct : t.cardCTAService}
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs" title={t.paypalMockNote}>
                      <CreditCard className="h-3 w-3" />
                      PayPal
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {intentItem && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/30 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-2xl border border-slate-300 bg-white p-4 sm:max-w-md sm:rounded-2xl">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {intentItem.type === "Product" ? t.intentModalTitleProduct : t.intentModalTitleService}: {intentItem.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600">{t.intentIntro}</p>
              </div>
              <button onClick={closeIntentModal} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs">
                <X className="h-3 w-3" />
                {t.closeBtn}
              </button>
            </div>

            {intentSubmitted ? (
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-50 p-3 text-sm text-emerald-700">{t.intentDone}</div>
            ) : (
              <div className="grid gap-2">
                <Input label={t.intentName} value={intentData.name} onChange={(v) => setIntentData((p) => ({ ...p, name: v }))} />
                <Input label={t.intentContact} value={intentData.contact} onChange={(v) => setIntentData((p) => ({ ...p, contact: v }))} />
                <Input label={t.intentMessage} value={intentData.note} onChange={(v) => setIntentData((p) => ({ ...p, note: v }))} />
                <p className="rounded-lg border border-amber-300/30 bg-amber-50 p-2 text-xs text-amber-700">{t.paypalMockNote}</p>
                <button onClick={submitIntent} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
                  {t.intentSubmit}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 outline-none ring-indigo-300 transition focus:ring ${
          error ? "border-rose-400" : "border-slate-300"
        }`}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function LinkOrText({ href, fallback }: { href: string; fallback: string }) {
  const value = href.trim() || fallback;
  return (
    <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 underline underline-offset-2">
      {value}
    </a>
  );
}

function PreviewImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const fallback = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

  return (
    <img
      src={src || fallback}
      alt={alt}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== fallback) target.src = fallback;
      }}
      className={className}
    />
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
