"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { ImageUpload } from "@/components/image-upload";

const dict = {
  en: {
    title: "Open Your Store",
    subtitle: "Start selling on MyShop in just a few steps",
    storeName: "Store name",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "Store URL",
    slugPh: "Ex: nanda-beauty",
    slugHint: "This will be your store's web address: /s/your-store-name",
    businessType: "Business type",
    businessTypes: {
      retail: "Retail",
      services: "Services",
      food: "Food & Beverages",
      fashion: "Fashion & Clothing",
      electronics: "Electronics",
      home: "Home & Garden",
      other: "Other",
    },
    description: "Store description (optional)",
    descriptionPh: "Tell customers about your store...",
    city: "City",
    cityPh: "Where is your business located?",
    country: "Country",
    countryPh: "Mozambique",
    logo: "Store logo (optional)",
    create: "Create Store",
    creating: "Creating store...",
    cancel: "Maybe Later",
    errors: {
      nameRequired: "Store name is required",
      slugFormat: "Use only lowercase letters, numbers and dashes",
      slugTaken: "This store URL is already taken",
      generic: "Something went wrong. Please try again.",
    },
  },
  pt: {
    title: "Abrir Sua Loja",
    subtitle: "Comece a vender no MyShop em apenas alguns passos",
    storeName: "Nome da loja",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "URL da loja",
    slugPh: "Ex: nanda-beauty",
    slugHint: "Este será o endereço web da sua loja: /s/nome-da-loja",
    businessType: "Tipo de negócio",
    businessTypes: {
      retail: "Comércio",
      services: "Serviços",
      food: "Comida e Bebidas",
      fashion: "Moda e Vestuário",
      electronics: "Eletrónicos",
      home: "Casa e Jardim",
      other: "Outro",
    },
    description: "Descrição da loja (opcional)",
    descriptionPh: "Conte aos clientes sobre a sua loja...",
    city: "Cidade",
    cityPh: "Onde está localizado o seu negócio?",
    country: "País",
    countryPh: "Moçambique",
    logo: "Logo da loja (opcional)",
    create: "Criar Loja",
    creating: "A criar loja...",
    cancel: "Talvez Mais Tarde",
    errors: {
      nameRequired: "Nome da loja é obrigatório",
      slugFormat: "Use apenas letras minúsculas, números e hífen",
      slugTaken: "Este URL de loja já está em uso",
      generic: "Algo correu mal. Tente novamente.",
    },
  },
};

function sanitizeSlug(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface StoreCreationWizardProps {
  onSuccess?: (store: any) => void;
  onCancel?: () => void;
}

export function StoreCreationWizard({ onSuccess, onCancel }: StoreCreationWizardProps) {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    businessType: "retail",
    description: "",
    city: "",
    country: "Mozambique",
    logoUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const effectiveSlug = formData.slug || sanitizeSlug(formData.name);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    
    if (!formData.name.trim()) e.name = t.errors.nameRequired;
    
    const slug = effectiveSlug;
    if (!slug) e.slug = t.errors.nameRequired;
    else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = t.errors.slugFormat;
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: effectiveSlug,
          businessType: formData.businessType,
          description: formData.description.trim(),
          city: formData.city.trim(),
          country: formData.country.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("slug")) {
          setApiError(t.errors.slugTaken);
        } else {
          setApiError(data.error || t.errors.generic);
        }
        setLoading(false);
        return;
      }

      // Success!
      if (onSuccess) {
        onSuccess(data.store);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setApiError(t.errors.generic);
      setLoading(false);
    }
  };

  const businessTypeOptions = Object.entries(t.businessTypes).map(([key, label]) => ({
    value: key,
    label,
  }));

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

        {apiError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {apiError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <Field
            label={t.storeName}
            value={formData.name}
            placeholder={t.storeNamePh}
            error={errors.name}
            onChange={(v) => updateField("name", v)}
            required
          />

          <div>
            <Field
              label={t.slug}
              value={formData.slug}
              placeholder={t.slugPh}
              error={errors.slug}
              onChange={(v) => updateField("slug", sanitizeSlug(v))}
            />
            <p className="mt-1 text-xs text-slate-500">{t.slugHint}</p>
            {effectiveSlug && !errors.slug && (
              <p className="mt-1 text-xs text-green-600">→ /s/{effectiveSlug}</p>
            )}
          </div>

          <div className="grid gap-1 text-sm">
            <label className="text-slate-700">{t.businessType}</label>
            <select
              value={formData.businessType}
              onChange={(e) => updateField("businessType", e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-green-200 transition focus:ring"
            >
              {businessTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Field
            label={t.city}
            value={formData.city}
            placeholder={t.cityPh}
            error={errors.city}
            onChange={(v) => updateField("city", v)}
          />

          <Field
            label={t.country}
            value={formData.country}
            placeholder={t.countryPh}
            error={errors.country}
            onChange={(v) => updateField("country", v)}
          />

          <div>
            <label className="text-sm text-slate-700">{t.description}</label>
            <textarea
              value={formData.description}
              placeholder={t.descriptionPh}
              onChange={(e) => updateField("description", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-green-200 transition focus:ring"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-slate-700">{t.logo}</label>
            <div className="mt-1">
              <ImageUpload
                currentUrl={formData.logoUrl}
                onUrlChange={(url) => updateField("logoUrl", url)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.cancel}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? t.creating : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 outline-none ring-green-200 transition focus:ring ${error ? "border-rose-400" : "border-slate-300"}`}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}