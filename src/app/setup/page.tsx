"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";

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
  type: "Product" | "Service";
  category: string;
  shortDescription: string;
  imageUrl: string;
  price: string;
  status: "Draft" | "Published";
};

type SetupPersisted = {
  step: number;
  done: boolean;
  data: SetupData;
  sellerId?: number;
};

type AutoSaveState = "saved" | "saving" | "unsaved";

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

const copy = {
  en: {
    pageTitle: "Store setup",
    pageSubtitle: "Professional onboarding with clear steps and instant guidance.",
    links: {
      dashboard: "Dashboard",
      storefront: "Storefront preview",
    },
    progress: "Progress",
    autosave: {
      saved: "Saved",
      saving: "Saving...",
      unsaved: "Unsaved changes",
    },
    steps: [
      { title: "Store identity", desc: "Define your public brand details." },
      { title: "Business details", desc: "Set owner and business fundamentals." },
      { title: "Social channels", desc: "Add links customers use to reach you." },
      { title: "Review & finish", desc: "Confirm everything before publishing." },
    ],
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
    placeholders: {
      storeName: "Ex: Nanda Beauty Corner",
      storefrontSlug: "Ex: nanda-beauty",
      ownerName: "Ex: Fernanda Silva",
      businessType: "Ex: Retail, Salon, Bakery",
      currency: "Ex: MZN, USD",
      city: "Ex: Maputo - Sommerschield",
      whatsapp: "https://wa.me/25884XXXXXXX",
      instagram: "https://instagram.com/yourstore",
      facebook: "https://facebook.com/yourstore",
    },
    hints: {
      slug: "Lowercase letters, numbers and dashes only.",
      whatsapp: "Use full link format with country code.",
    },
    validationSummary: "Please correct highlighted fields before continuing.",
    fieldErrors: {
      required: "This field is required.",
      slug: "Use only lowercase letters, numbers and dashes.",
      whatsapp: "Use a valid URL (example: https://wa.me/25884XXXXXXX).",
      instagram: "Use a valid URL.",
      facebook: "Use a valid URL.",
    },
    review: {
      title: "Review before finish",
      business: "Business",
      channels: "Channels",
      catalog: "Catalog snapshot",
      items: "items",
      published: "published",
      draft: "draft",
      previewRoute: "Storefront route",
    },
    completion: {
      title: "Setup completed successfully",
      subtitle: "Your store foundation is ready. Continue with practical next actions.",
      goDashboard: "Open dashboard",
      goStorefront: "View storefront",
      manageCatalog: "Manage catalog",
    },
    actions: {
      back: "Back",
      next: "Next",
      finish: "Save & finish",
      reset: "Reset",
    },
  },
  pt: {
    pageTitle: "Configuração da loja",
    pageSubtitle: "Onboarding profissional com etapas claras e orientação imediata.",
    links: {
      dashboard: "Painel",
      storefront: "Prévia da loja",
    },
    progress: "Progresso",
    autosave: {
      saved: "Guardado",
      saving: "A guardar...",
      unsaved: "Alterações por guardar",
    },
    steps: [
      { title: "Identidade da loja", desc: "Defina os detalhes públicos da sua marca." },
      { title: "Dados do negócio", desc: "Defina responsável e fundamentos do negócio." },
      { title: "Canais sociais", desc: "Adicione os links que clientes usam para contacto." },
      { title: "Revisar e concluir", desc: "Confirme tudo antes de publicar." },
    ],
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
    placeholders: {
      storeName: "Ex: Nanda Beauty Corner",
      storefrontSlug: "Ex: nanda-beauty",
      ownerName: "Ex: Fernanda Silva",
      businessType: "Ex: Retalho, Salão, Padaria",
      currency: "Ex: MZN, USD",
      city: "Ex: Maputo - Sommerschield",
      whatsapp: "https://wa.me/25884XXXXXXX",
      instagram: "https://instagram.com/sualoja",
      facebook: "https://facebook.com/sualoja",
    },
    hints: {
      slug: "Use apenas minúsculas, números e hífen.",
      whatsapp: "Use o formato de link completo com código do país.",
    },
    validationSummary: "Corrija os campos destacados antes de continuar.",
    fieldErrors: {
      required: "Este campo é obrigatório.",
      slug: "Use apenas minúsculas, números e hífen.",
      whatsapp: "Use um URL válido (exemplo: https://wa.me/25884XXXXXXX).",
      instagram: "Use um URL válido.",
      facebook: "Use um URL válido.",
    },
    review: {
      title: "Revisar antes de concluir",
      business: "Negócio",
      channels: "Canais",
      catalog: "Resumo do catálogo",
      items: "itens",
      published: "publicados",
      draft: "rascunho",
      previewRoute: "Rota da loja",
    },
    completion: {
      title: "Configuração concluída com sucesso",
      subtitle: "A base da sua loja está pronta. Continue com ações práticas.",
      goDashboard: "Abrir painel",
      goStorefront: "Ver loja",
      manageCatalog: "Gerir catálogo",
    },
    actions: {
      back: "Voltar",
      next: "Próximo",
      finish: "Guardar e concluir",
      reset: "Reiniciar",
    },
  },
} as const;

function sanitizeSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SetupPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const common = getDict(lang).common;
  const toastText = getDict(lang).toast;
  const t = copy[lang];
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [setup, setSetup] = useState<SetupData>(defaultSetup);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [autosaveState, setAutosaveState] = useState<AutoSaveState>("saved");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SetupData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SetupData, boolean>>>({});
  const [catalogSnapshot, setCatalogSnapshot] = useState<CatalogItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE.setup);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SetupPersisted;
        setStep(Math.min(4, Math.max(1, parsed.step || 1)));
        setDone(Boolean(parsed.done));
        setSetup({ ...defaultSetup, ...parsed.data });
        setSellerId(parsed.sellerId ?? null);
      } catch {}
    }
    const rawCatalog = localStorage.getItem(STORAGE.catalog);
    if (rawCatalog) {
      try {
        const parsed = JSON.parse(rawCatalog) as CatalogItem[];
        if (Array.isArray(parsed)) setCatalogSnapshot(parsed);
      } catch {}
    }
    const localSeller = localStorage.getItem(STORAGE.sellerId);
    if (localSeller && !Number.isNaN(Number(localSeller))) setSellerId(Number(localSeller));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    setAutosaveState("saving");
    const timer = setTimeout(() => {
      localStorage.setItem(
        STORAGE.setup,
        JSON.stringify({ step, done, data: setup, sellerId: sellerId ?? undefined } satisfies SetupPersisted),
      );
      setAutosaveState("saved");
      setDirty(false);
    }, 550);
    return () => {
      clearTimeout(timer);
      setAutosaveState("unsaved");
    };
  }, [dirty, step, done, setup, sellerId]);

  const slug = setup.storefrontSlug || sanitizeSlug(setup.storeName) || "myshop-demo";
  const previewPath = `/s/${slug}`;

  const validateField = (key: keyof SetupData, value: string) => {
    const val = value.trim();
    if (["storeName", "storefrontSlug", "ownerName", "businessType", "currency", "city"].includes(key) && !val) {
      return t.fieldErrors.required;
    }
    if (key === "storefrontSlug" && val && !/^[a-z0-9-]+$/.test(val)) return t.fieldErrors.slug;
    if (key === "whatsapp") {
      if (!val) return t.fieldErrors.required;
      if (!isValidUrl(val)) return t.fieldErrors.whatsapp;
    }
    if (key === "instagram" && val && !isValidUrl(val)) return t.fieldErrors.instagram;
    if (key === "facebook" && val && !isValidUrl(val)) return t.fieldErrors.facebook;
    return "";
  };

  const updateField = (key: keyof SetupData, value: string) => {
    const nextValue = key === "storefrontSlug" ? sanitizeSlug(value) : value;
    setSetup((prev) => ({ ...prev, [key]: nextValue }));
    setDirty(true);
    if (touched[key]) {
      const err = validateField(key, nextValue);
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  const touchField = (key: keyof SetupData) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const err = validateField(key, setup[key]);
    setErrors((prev) => ({ ...prev, [key]: err }));
  };

  const stepFields: Record<number, (keyof SetupData)[]> = {
    1: ["storeName", "storefrontSlug"],
    2: ["ownerName", "businessType", "currency", "city"],
    3: ["whatsapp", "instagram", "facebook"],
    4: [],
  };

  const validateStep = (targetStep: number) => {
    const keys = stepFields[targetStep];
    const nextErrors: Partial<Record<keyof SetupData, string>> = {};
    for (const k of keys) {
      const err = validateField(k, setup[k]);
      if (err) nextErrors[k] = err;
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    setTouched((prev) => keys.reduce((acc, k) => ({ ...acc, [k]: true }), prev));
    return Object.keys(nextErrors).length === 0;
  };

  const onNext = () => {
    if (step <= 3 && !validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1));
    setDirty(true);
  };

  const onBack = () => {
    setStep((s) => Math.max(1, s - 1));
    setDirty(true);
  };

  const onReset = () => {
    setStep(1);
    setDone(false);
    setSetup(defaultSetup);
    setErrors({});
    setTouched({});
    setDirty(true);
    localStorage.removeItem(STORAGE.setup);
  };

  const onFinish = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

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

    try {
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
      // local-only fallback
    }

    setDone(true);
    setDirty(true);
    toast.success(toastText.saved);
  };

  const publishedCount = catalogSnapshot.filter((i) => i.status === "Published").length;
  const draftCount = catalogSnapshot.filter((i) => i.status === "Draft").length;

  const hasStepErrors = Object.entries(errors).some(([key, val]) => val && stepFields[step].includes(key as keyof SetupData));

  const fields = useMemo(
    () => ({
      storeName: {
        label: t.labels.storeName,
        placeholder: t.placeholders.storeName,
      },
      storefrontSlug: {
        label: t.labels.storefrontSlug,
        placeholder: t.placeholders.storefrontSlug,
      },
      ownerName: {
        label: t.labels.ownerName,
        placeholder: t.placeholders.ownerName,
      },
      businessType: {
        label: t.labels.businessType,
        placeholder: t.placeholders.businessType,
      },
      currency: {
        label: t.labels.currency,
        placeholder: t.placeholders.currency,
      },
      city: {
        label: t.labels.city,
        placeholder: t.placeholders.city,
      },
      whatsapp: {
        label: t.labels.whatsapp,
        placeholder: t.placeholders.whatsapp,
      },
      instagram: {
        label: t.labels.instagram,
        placeholder: t.placeholders.instagram,
      },
      facebook: {
        label: t.labels.facebook,
        placeholder: t.placeholders.facebook,
      },
    }),
    [t],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{t.pageTitle}</h1>
              <p className="mt-1 text-sm text-slate-600">{t.pageSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="/dashboard" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                {t.links.dashboard}
              </a>
              <a href={previewPath} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                {t.links.storefront}
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{t.progress}</span>
                <span>{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round((step / 4) * 100)}%` }} />
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
              {autosaveState === "saved" ? t.autosave.saved : autosaveState === "saving" ? t.autosave.saving : t.autosave.unsaved}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {t.steps.map((item, idx) => {
              const index = idx + 1;
              const active = step === index;
              const complete = done || index < step;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    if (index <= step) setStep(index);
                  }}
                  className={`rounded-xl border p-3 text-left ${
                    active
                      ? "border-blue-200 bg-blue-50"
                      : complete
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs text-slate-500">{index}. {item.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.desc}</p>
                </button>
              );
            })}
          </div>

          {hasStepErrors && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{t.validationSummary}</div>
          )}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={fields.storeName.label} value={setup.storeName} placeholder={fields.storeName.placeholder} error={errors.storeName} onChange={(v) => updateField("storeName", v)} onBlur={() => touchField("storeName")} />
                <div>
                  <Field label={fields.storefrontSlug.label} value={setup.storefrontSlug} placeholder={fields.storefrontSlug.placeholder} error={errors.storefrontSlug} onChange={(v) => updateField("storefrontSlug", v)} onBlur={() => touchField("storefrontSlug")} />
                  <p className="mt-1 text-xs text-slate-500">{t.hints.slug}</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={fields.ownerName.label} value={setup.ownerName} placeholder={fields.ownerName.placeholder} error={errors.ownerName} onChange={(v) => updateField("ownerName", v)} onBlur={() => touchField("ownerName")} />
                <Field label={fields.businessType.label} value={setup.businessType} placeholder={fields.businessType.placeholder} error={errors.businessType} onChange={(v) => updateField("businessType", v)} onBlur={() => touchField("businessType")} />
                <Field label={fields.currency.label} value={setup.currency} placeholder={fields.currency.placeholder} error={errors.currency} onChange={(v) => updateField("currency", v)} onBlur={() => touchField("currency")} />
                <Field label={fields.city.label} value={setup.city} placeholder={fields.city.placeholder} error={errors.city} onChange={(v) => updateField("city", v)} onBlur={() => touchField("city")} />
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label={fields.whatsapp.label} value={setup.whatsapp} placeholder={fields.whatsapp.placeholder} error={errors.whatsapp} onChange={(v) => updateField("whatsapp", v)} onBlur={() => touchField("whatsapp")} />
                  <p className="mt-1 text-xs text-slate-500">{t.hints.whatsapp}</p>
                </div>
                <Field label={fields.instagram.label} value={setup.instagram} placeholder={fields.instagram.placeholder} error={errors.instagram} onChange={(v) => updateField("instagram", v)} onBlur={() => touchField("instagram")} />
                <Field label={fields.facebook.label} value={setup.facebook} placeholder={fields.facebook.placeholder} error={errors.facebook} onChange={(v) => updateField("facebook", v)} onBlur={() => touchField("facebook")} />
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-sm font-semibold">{t.review.business}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>{t.labels.storeName}: {setup.storeName || "-"}</li>
                    <li>{t.labels.storefrontSlug}: {setup.storefrontSlug || "-"}</li>
                    <li>{t.labels.ownerName}: {setup.ownerName || "-"}</li>
                    <li>{t.labels.businessType}: {setup.businessType || "-"}</li>
                    <li>{t.labels.currency}: {setup.currency || "-"}</li>
                    <li>{t.labels.city}: {setup.city || "-"}</li>
                  </ul>
                </article>
                <article className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-sm font-semibold">{t.review.channels}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>WhatsApp: {setup.whatsapp || "-"}</li>
                    <li>Instagram: {setup.instagram || "-"}</li>
                    <li>Facebook: {setup.facebook || "-"}</li>
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">{t.review.previewRoute}: {previewPath}</p>
                </article>
                <article className="rounded-lg border border-slate-200 bg-white p-3">
                  <h3 className="text-sm font-semibold">{t.review.catalog}</h3>
                  <p className="mt-2 text-sm text-slate-700">{catalogSnapshot.length} {t.review.items}</p>
                  <p className="text-sm text-slate-700">{publishedCount} {t.review.published}</p>
                  <p className="text-sm text-slate-700">{draftCount} {t.review.draft}</p>
                  <a href="/dashboard/catalog" className="mt-3 inline-block text-sm text-blue-600 underline underline-offset-2">{t.completion.manageCatalog}</a>
                </article>
              </div>
            )}
          </div>

          {done && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-800">{t.completion.title}</h3>
              <p className="mt-1 text-sm text-emerald-700">{t.completion.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => router.push("/dashboard")} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{t.completion.goDashboard}</button>
                <a href={previewPath} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm">{t.completion.goStorefront}</a>
                <a href="/dashboard/catalog" className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm">{t.completion.manageCatalog}</a>
              </div>
            </div>
          )}

          <div className="mt-5 hidden flex-wrap gap-2 lg:flex">
            <button onClick={onBack} disabled={step === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">{t.actions.back}</button>
            {step < 4 ? (
              <button onClick={onNext} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{t.actions.next}</button>
            ) : (
              <button onClick={onFinish} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{t.actions.finish}</button>
            )}
            <button onClick={onReset} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{t.actions.reset}</button>
            <button onClick={() => router.push("/dashboard")} className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{common.dashboard}</button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex w-full max-w-5xl gap-2 px-2">
          <button onClick={onBack} disabled={step === 1} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">{t.actions.back}</button>
          {step < 4 ? (
            <button onClick={onNext} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{t.actions.next}</button>
          ) : (
            <button onClick={onFinish} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{t.actions.finish}</button>
          )}
          <button onClick={onReset} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{t.actions.reset}</button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring ${
          error ? "border-rose-400" : "border-slate-300"
        }`}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
