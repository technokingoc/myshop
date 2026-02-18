"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "pt";
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
};

const STORAGE = {
  lang: "myshop_lang",
  setup: "myshop_setup_v2",
  catalog: "myshop_catalog_v2",
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

    catalogTitle: "Catalog management",
    catalogSubtitle: "Mock CRUD with add/edit/delete persisted locally.",

    previewTitle: "Storefront preview",
    previewSubtitle: "Live preview from your setup + catalog.",
    socialLinks: "Social links",
    productsSection: "Products",
    servicesSection: "Services",
    emptyProducts: "No published products yet.",
    emptyServices: "No published services yet.",
    cardCTAProduct: "Order now",
    cardCTAService: "Book now",

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
    choosePlan: "Choose this plan",

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

    catalogTitle: "Gestão de catálogo",
    catalogSubtitle: "CRUD mock com adicionar/editar/apagar persistido localmente.",

    previewTitle: "Pré-visualização da loja",
    previewSubtitle: "Prévia ao vivo com base na configuração + catálogo.",
    socialLinks: "Links sociais",
    productsSection: "Produtos",
    servicesSection: "Serviços",
    emptyProducts: "Ainda não há produtos publicados.",
    emptyServices: "Ainda não há serviços publicados.",
    cardCTAProduct: "Encomendar",
    cardCTAService: "Reservar",

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
    choosePlan: "Escolher este plano",

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

  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(STORAGE.lang) === "pt" ? "pt" : "en";
  });
  const [step, setStep] = useState(() => Math.min(3, Math.max(1, initialSetupPersisted?.step || 1)));
  const [done, setDone] = useState(() => Boolean(initialSetupPersisted?.done));
  const [setup, setSetup] = useState<SetupData>(() => ({ ...defaultSetup, ...(initialSetupPersisted?.data || {}) }));
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

  const [catalogForm, setCatalogForm] = useState(blankCatalogForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE.lang, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE.setup,
      JSON.stringify({
        step,
        done,
        data: setup,
      } satisfies SetupPersisted),
    );
  }, [step, done, setup]);

  useEffect(() => {
    localStorage.setItem(STORAGE.catalog, JSON.stringify(catalog));
  }, [catalog]);

  const t = useMemo(() => dictionary[lang], [lang]);

  const updateSetup = (key: keyof SetupData, value: string) => {
    const next = key === "storefrontSlug" ? sanitizeSlug(value) : value;
    setSetup((prev) => ({ ...prev, [key]: next }));
  };

  const resetSetup = () => {
    setStep(1);
    setDone(false);
    setSetup(defaultSetup);
    localStorage.removeItem(STORAGE.setup);
  };

  const onCatalogField = (key: keyof Omit<CatalogItem, "id">, value: string) => {
    setCatalogForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitCatalog = () => {
    if (!catalogForm.name.trim() || !catalogForm.price.trim()) return;

    if (editingId !== null) {
      setCatalog((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...catalogForm } : item)));
      setEditingId(null);
    } else {
      const nextId = catalog.length ? Math.max(...catalog.map((i) => i.id)) + 1 : 1;
      setCatalog((prev) => [...prev, { id: nextId, ...catalogForm }]);
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

  const slug = setup.storefrontSlug || sanitizeSlug(setup.storeName) || "myshop-demo";
  const previewPath = `/s/${slug}`;
  const previewUrl = `https://myshop-amber.vercel.app${previewPath}?preview=1`;

  const publishedProducts = catalog.filter((i) => i.type === "Product" && i.status === "Published");
  const publishedServices = catalog.filter((i) => i.type === "Service" && i.status === "Published");
  const publishedCatalog = catalog.filter((i) => i.status === "Published");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/20 to-transparent p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-between gap-2">
            <p className="rounded-full border border-indigo-300/40 bg-indigo-400/20 px-3 py-1 text-xs sm:text-sm">{t.badge}</p>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setLang("en")}
                className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-white text-black" : "bg-white/10"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("pt")}
                className={`rounded-full px-3 py-1 ${lang === "pt" ? "bg-white text-black" : "bg-white/10"}`}
              >
                PT
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-200 sm:text-base">{t.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#setup" className="rounded-xl bg-white px-4 py-2 font-semibold text-black">
              {t.ctaPrimary}
            </a>
            <a href="#catalog" className="rounded-xl border border-white/25 px-4 py-2">
              {t.ctaSecondary}
            </a>
          </div>
          <p className="mt-5 text-xs text-amber-200">{t.whyMocked}</p>
        </header>

        <section id="setup" className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">{t.setupTitle}</h2>
          <p className="text-sm text-slate-300">{t.setupSubtitle}</p>
          <p className="text-xs text-slate-400">
            {t.stepLabel} {step}/3 {done && `• ${t.completed}`}
          </p>

          <div className="rounded-xl border border-indigo-300/30 bg-indigo-500/10 p-3 text-sm">
            <p className="font-medium text-indigo-200">{t.previewRoute}</p>
            <p className="mt-1 break-all text-slate-200">{previewPath}</p>
            <a href={previewUrl} className="mt-2 inline-block text-indigo-300 underline underline-offset-2" target="_blank" rel="noreferrer">
              {previewUrl}
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {step === 1 && (
              <>
                <Input label={t.labels.storeName} value={setup.storeName} onChange={(v) => updateSetup("storeName", v)} />
                <div className="grid gap-1 text-sm">
                  <Input label={t.labels.storefrontSlug} value={setup.storefrontSlug} onChange={(v) => updateSetup("storefrontSlug", v)} />
                  <span className="text-xs text-slate-400">{t.slugHint}</span>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <Input label={t.labels.ownerName} value={setup.ownerName} onChange={(v) => updateSetup("ownerName", v)} />
                <Input label={t.labels.businessType} value={setup.businessType} onChange={(v) => updateSetup("businessType", v)} />
                <Input label={t.labels.currency} value={setup.currency} onChange={(v) => updateSetup("currency", v)} />
                <Input label={t.labels.city} value={setup.city} onChange={(v) => updateSetup("city", v)} />
              </>
            )}
            {step === 3 && (
              <>
                <Input label={t.labels.whatsapp} value={setup.whatsapp} onChange={(v) => updateSetup("whatsapp", v)} />
                <Input label={t.labels.instagram} value={setup.instagram} onChange={(v) => updateSetup("instagram", v)} />
                <Input label={t.labels.facebook} value={setup.facebook} onChange={(v) => updateSetup("facebook", v)} />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-lg border border-white/20 px-3 py-2 disabled:opacity-40"
            >
              {t.backBtn}
            </button>
            {step < 3 ? (
              <button onClick={() => setStep((s) => Math.min(3, s + 1))} className="rounded-lg bg-indigo-400 px-3 py-2 font-semibold text-black">
                {t.nextBtn}
              </button>
            ) : (
              <button onClick={() => setDone(true)} className="rounded-lg bg-emerald-400 px-3 py-2 font-semibold text-black">
                {t.finishBtn}
              </button>
            )}
            <button onClick={resetSetup} className="rounded-lg border border-white/20 px-3 py-2">
              {t.resetBtn}
            </button>
            {done && <span className="self-center text-sm text-emerald-300">{t.doneMsg}</span>}
          </div>
        </section>

        <section id="catalog" className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">{t.catalogTitle}</h2>
          <p className="mb-4 text-sm text-slate-300">{t.catalogSubtitle}</p>

          <div className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-slate-900/30 p-3 sm:grid-cols-2">
            <h3 className="sm:col-span-2 font-medium">{t.catalogFormTitle}</h3>
            <Input label={t.itemName} value={catalogForm.name} onChange={(v) => onCatalogField("name", v)} />
            <Input label={t.itemCategory} value={catalogForm.category} onChange={(v) => onCatalogField("category", v)} />
            <Input label={t.itemDescription} value={catalogForm.shortDescription} onChange={(v) => onCatalogField("shortDescription", v)} />
            <Input label={t.itemImageUrl} value={catalogForm.imageUrl} onChange={(v) => onCatalogField("imageUrl", v)} />
            <Input label={t.itemPrice} value={catalogForm.price} onChange={(v) => onCatalogField("price", v)} />

            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">{t.itemType}</span>
              <select
                value={catalogForm.type}
                onChange={(e) => onCatalogField("type", e.target.value as CatalogType)}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 outline-none ring-indigo-300 transition focus:ring"
              >
                <option value="Product">{t.productsSection}</option>
                <option value="Service">{t.servicesSection}</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-300">{t.itemStatus}</span>
              <select
                value={catalogForm.status}
                onChange={(e) => onCatalogField("status", e.target.value as CatalogStatus)}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 outline-none ring-indigo-300 transition focus:ring"
              >
                <option value="Draft">{t.draft}</option>
                <option value="Published">{t.published}</option>
              </select>
            </label>

            <div className="sm:col-span-2 flex gap-2">
              <button onClick={submitCatalog} className="rounded-lg bg-indigo-400 px-3 py-2 font-semibold text-black">
                {editingId !== null ? t.saveBtn : t.addBtn}
              </button>
              {editingId !== null && (
                <button onClick={cancelEdit} className="rounded-lg border border-white/20 px-3 py-2">
                  {t.cancelBtn}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {catalog.map((item) => (
              <article key={item.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[96px_1fr]">
                <img
                  src={item.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"}
                  alt={item.name}
                  className="h-[72px] w-[72px] rounded-lg object-cover sm:h-[96px] sm:w-[96px]"
                />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-xs text-slate-400">{item.category || "General"}</p>
                  <p className="text-sm text-slate-300">{item.shortDescription || "-"}</p>
                  <p className="text-sm text-slate-300">
                    {item.type} • {setup.currency} {item.price}
                  </p>
                  <span className="mt-2 inline-block rounded-full border border-white/20 px-2 py-1 text-xs">
                    {item.status === "Published" ? t.published : t.draft}
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => startEdit(item)} className="rounded-md border border-white/20 px-2 py-1 text-xs">
                      {t.editBtn}
                    </button>
                    <button
                      onClick={() => setCatalog((prev) => prev.filter((i) => i.id !== item.id))}
                      className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-200"
                    >
                      {t.deleteBtn}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">{t.previewTitle}</h2>
            <p className="mb-4 text-sm text-slate-300">{t.previewSubtitle}</p>
            <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
              <h3 className="font-semibold">{setup.storeName || "MyShop Demo Store"}</h3>
              <p className="text-sm text-slate-300">@{slug}</p>

              <h4 className="mt-4 text-sm font-medium text-slate-300">{t.socialLinks}</h4>
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

              <h4 className="mt-4 text-sm font-medium text-slate-300">{t.productsSection}</h4>
              {publishedProducts.length === 0 ? (
                <p className="text-sm text-slate-400">{t.emptyProducts}</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {publishedProducts.map((item) => (
                    <li key={item.id}>
                      {item.name} • {setup.currency} {item.price}
                    </li>
                  ))}
                </ul>
              )}

              <h4 className="mt-4 text-sm font-medium text-slate-300">{t.servicesSection}</h4>
              {publishedServices.length === 0 ? (
                <p className="text-sm text-slate-400">{t.emptyServices}</p>
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

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-xl font-semibold">{t.pricingTitle}</h2>
            <p className="mb-4 text-sm text-slate-300">{t.pricingSubtitle}</p>
            <div className="rounded-xl border border-indigo-300/30 bg-indigo-500/10 p-4">
              <h3 className="text-lg font-semibold">{t.planName}</h3>
              <p className="mt-1 text-2xl font-bold">{t.planPrice}</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                {t.planBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-amber-300/40 bg-amber-400/10 p-2 text-xs text-amber-200">{t.planFoot}</p>
              <p className="mt-2 text-xs text-slate-200">{t.paypalInfo}</p>
              <button className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">{t.choosePlan}</button>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{t.previewTitle} • Cards</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publishedCatalog.map((item) => (
              <article key={`card-${item.id}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src={item.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"}
                  alt={item.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-xs text-indigo-300">{item.category || "General"}</p>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{item.shortDescription || "-"}</p>
                  <p className="mt-2 text-sm font-medium">
                    {setup.currency} {item.price}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={setup.whatsapp || "https://wa.me/your-number"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-black"
                    >
                      {item.type === "Product" ? t.cardCTAProduct : t.cardCTAService}
                    </a>
                    <button className="rounded-lg border border-white/20 px-3 py-2 text-xs">PayPal</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 outline-none ring-indigo-300 transition focus:ring"
      />
    </label>
  );
}

function LinkOrText({ href, fallback }: { href: string; fallback: string }) {
  const value = href.trim() || fallback;
  return (
    <a href={value} target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-2">
      {value}
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
