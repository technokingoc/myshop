"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { DashboardShell } from "@/components/dashboard-shell";
import { Save, CheckCircle } from "lucide-react";

const STORAGE_SETUP = "myshop_setup_v2";

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
  logoUrl?: string;
  description?: string;
};
type SetupPersisted = { step: number; done: boolean; data: SetupData };

const dict = {
  en: {
    title: "Settings",
    subtitle: "Update your store identity and business details.",
    storeName: "Store name",
    description: "Store description",
    descriptionPh: "Tell customers about your business...",
    currency: "Currency",
    logoUrl: "Logo URL",
    logoUrlPh: "https://example.com/logo.png",
    ownerName: "Owner name",
    city: "City",
    whatsapp: "WhatsApp link",
    instagram: "Instagram link",
    facebook: "Facebook link",
    save: "Save changes",
    saved: "Changes saved!",
    notSetup: "Complete store setup first.",
    goSetup: "Go to setup",
    storeIdentity: "Store identity",
    socialLinks: "Social links",
  },
  pt: {
    title: "Configurações",
    subtitle: "Atualize a identidade da loja e dados do negócio.",
    storeName: "Nome da loja",
    description: "Descrição da loja",
    descriptionPh: "Conte aos clientes sobre o seu negócio...",
    currency: "Moeda",
    logoUrl: "URL do logotipo",
    logoUrlPh: "https://exemplo.com/logo.png",
    ownerName: "Nome do proprietário",
    city: "Cidade",
    whatsapp: "Link WhatsApp",
    instagram: "Link Instagram",
    facebook: "Link Facebook",
    save: "Guardar alterações",
    saved: "Alterações guardadas!",
    notSetup: "Conclua a configuração da loja primeiro.",
    goSetup: "Ir para configuração",
    storeIdentity: "Identidade da loja",
    socialLinks: "Links sociais",
  },
};

export default function SettingsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [form, setForm] = useState<SetupData | null>(null);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETUP);
      if (raw) {
        const parsed = JSON.parse(raw) as SetupPersisted;
        setSetup(parsed);
        setForm({ ...parsed.data });
      }
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!setup?.done || !form) {
    return (
      <DashboardShell activePage="settings">
        <div className="text-center py-16">
          <p className="text-slate-600">{t.notSetup}</p>
          <a href="/setup" className="mt-4 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
            {t.goSetup}
          </a>
        </div>
      </DashboardShell>
    );
  }

  const update = (key: keyof SetupData, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const handleSave = () => {
    if (!form) return;
    const updated: SetupPersisted = { ...setup, data: form };
    localStorage.setItem(STORAGE_SETUP, JSON.stringify(updated));
    setSetup(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({
    label,
    value,
    field,
    placeholder,
    textarea,
  }: {
    label: string;
    value: string;
    field: keyof SetupData;
    placeholder?: string;
    textarea?: boolean;
  }) => (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      ) : (
        <input
          value={value || ""}
          onChange={(e) => update(field, e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      )}
    </div>
  );

  return (
    <DashboardShell activePage="settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{t.storeIdentity}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.storeName} value={form.storeName} field="storeName" />
            <Field label={t.ownerName} value={form.ownerName} field="ownerName" />
            <div className="sm:col-span-2">
              <Field label={t.description} value={form.description || ""} field="description" placeholder={t.descriptionPh} textarea />
            </div>
            <Field label={t.currency} value={form.currency} field="currency" />
            <Field label={t.city} value={form.city} field="city" />
            <div className="sm:col-span-2">
              <Field label={t.logoUrl} value={form.logoUrl || ""} field="logoUrl" placeholder={t.logoUrlPh} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{t.socialLinks}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.whatsapp} value={form.whatsapp} field="whatsapp" />
            <Field label={t.instagram} value={form.instagram} field="instagram" />
            <Field label={t.facebook} value={form.facebook} field="facebook" />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Save className="h-4 w-4" />
            {t.save}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              {t.saved}
            </span>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
