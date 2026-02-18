"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "pt";

type SetupData = {
  storeName: string;
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
  category: string;
  price: string;
  status: "Draft" | "Published";
};

const copy = {
  en: {
    badge: "Built for informal sellers & micro businesses",
    title: "Launch your professional storefront in minutes",
    subtitle:
      "MyShop helps small sellers create trusted online storefronts, organize products, and share social ordering links without technical complexity.",
    ctaPrimary: "Start setup",
    ctaSecondary: "See demo sections",
    whyMocked: "MVP note: This version uses local/session storage only (no backend yet).",
    setupTitle: "Store setup flow",
    setupSubtitle: "Step-by-step onboarding mock. Data is saved in your browser session.",
    catalogTitle: "Catalog management (skeleton)",
    catalogSubtitle: "Structure ready for products and services. Currently local demo data.",
    previewTitle: "Storefront preview",
    previewSubtitle: "Social links block customers can use to contact or follow your store.",
    pricingTitle: "Affordable pricing",
    pricingSubtitle: "PayPal-ready messaging only. No live charge execution in this MVP.",
    planName: "Starter",
    planPrice: "$9 / month",
    planBullets: [
      "1 storefront",
      "Catalog up to 50 items",
      "Share links via WhatsApp / Instagram / Facebook",
      "PayPal-ready checkout messaging (integration next phase)",
    ],
    planFoot: "No payment processing is executed in this release.",
    nextBtn: "Next",
    backBtn: "Back",
    finishBtn: "Finish",
    resetBtn: "Reset",
    doneMsg: "Setup draft saved in this session.",
    labels: {
      storeName: "Store name",
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
    ctaSecondary: "Ver secções de demo",
    whyMocked: "Nota MVP: Esta versão usa apenas armazenamento local/sessão (sem backend ainda).",
    setupTitle: "Fluxo de configuração da loja",
    setupSubtitle: "Onboarding em etapas (mock). Dados salvos na sessão do navegador.",
    catalogTitle: "Gestão de catálogo (esqueleto)",
    catalogSubtitle: "Estrutura pronta para produtos e serviços. Dados locais de demonstração.",
    previewTitle: "Pré-visualização da loja",
    previewSubtitle: "Bloco de links sociais para clientes contactarem/seguirem sua loja.",
    pricingTitle: "Preço acessível",
    pricingSubtitle: "Mensagem preparada para PayPal. Sem execução de cobrança real neste MVP.",
    planName: "Inicial",
    planPrice: "$9 / mês",
    planBullets: [
      "1 loja virtual",
      "Catálogo até 50 itens",
      "Partilha de links via WhatsApp / Instagram / Facebook",
      "Mensagem de checkout pronta para PayPal (integração na próxima fase)",
    ],
    planFoot: "Nenhum processamento de pagamento é executado nesta versão.",
    nextBtn: "Próximo",
    backBtn: "Voltar",
    finishBtn: "Concluir",
    resetBtn: "Reiniciar",
    doneMsg: "Rascunho da configuração salvo nesta sessão.",
    labels: {
      storeName: "Nome da loja",
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

const defaultSetup: SetupData = {
  storeName: "",
  ownerName: "",
  businessType: "Retail",
  currency: "USD",
  city: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
};

const defaultCatalog: CatalogItem[] = [
  { id: 1, name: "Sample Product A", category: "Product", price: "$15", status: "Published" },
  { id: 2, name: "Sample Service B", category: "Service", price: "$25", status: "Draft" },
  { id: 3, name: "Sample Product C", category: "Product", price: "$8", status: "Draft" },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const savedLang = localStorage.getItem("myshop_lang");
    return savedLang === "pt" ? "pt" : "en";
  });
  const [step, setStep] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(sessionStorage.getItem("myshop_setup_step") || 1);
  });
  const [done, setDone] = useState(false);
  const [setup, setSetup] = useState<SetupData>(() => {
    if (typeof window === "undefined") return defaultSetup;
    const savedSetup = sessionStorage.getItem("myshop_setup_data");
    return savedSetup ? JSON.parse(savedSetup) : defaultSetup;
  });
  const [catalog] = useState<CatalogItem[]>(defaultCatalog);

  useEffect(() => {
    localStorage.setItem("myshop_lang", lang);
  }, [lang]);

  useEffect(() => {
    sessionStorage.setItem("myshop_setup_step", String(step));
    sessionStorage.setItem("myshop_setup_data", JSON.stringify(setup));
  }, [step, setup]);

  const t = useMemo(() => copy[lang], [lang]);

  const updateSetup = (key: keyof SetupData, value: string) => {
    setSetup((prev) => ({ ...prev, [key]: value }));
  };

  const resetSetup = () => {
    setStep(1);
    setDone(false);
    setSetup(defaultSetup);
    sessionStorage.removeItem("myshop_setup_step");
    sessionStorage.removeItem("myshop_setup_data");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/20 to-transparent p-6 sm:p-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="rounded-full border border-indigo-300/40 bg-indigo-400/20 px-3 py-1 text-xs sm:text-sm">
              {t.badge}
            </p>
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

          <div className="grid gap-3 sm:grid-cols-2">
            {step === 1 && (
              <>
                <Input label={t.labels.storeName} value={setup.storeName} onChange={(v) => updateSetup("storeName", v)} />
                <Input label={t.labels.ownerName} value={setup.ownerName} onChange={(v) => updateSetup("ownerName", v)} />
              </>
            )}
            {step === 2 && (
              <>
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
              <button onClick={() => setStep((s) => s + 1)} className="rounded-lg bg-indigo-400 px-3 py-2 font-semibold text-black">
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
          <div className="grid gap-3">
            {catalog.map((item) => (
              <article key={item.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[96px_1fr]">
                <div className="h-[72px] w-[72px] rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 sm:h-[96px] sm:w-[96px]" />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-slate-300">{item.category} • {item.price}</p>
                  <span className="mt-2 inline-block rounded-full border border-white/20 px-2 py-1 text-xs">{item.status}</span>
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
              <p className="text-sm text-slate-300">@{(setup.storeName || "myshop").toLowerCase().replace(/\s+/g, "")}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>WhatsApp: {setup.whatsapp || "https://wa.me/your-number"}</li>
                <li>Instagram: {setup.instagram || "https://instagram.com/your-store"}</li>
                <li>Facebook: {setup.facebook || "https://facebook.com/your-store"}</li>
              </ul>
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
              <p className="mt-4 text-xs text-amber-200">{t.planFoot}</p>
            </div>
          </article>
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
