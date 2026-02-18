"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { Save } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";
import { fetchJsonWithRetry } from "@/lib/api-client";

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
  paymentLink: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
};

type SetupPersisted = { step: number; done: boolean; data: SetupData };

export default function SettingsPage() {
  const { lang } = useLanguage();
  const t = getDict(lang).settings;
  const toastText = getDict(lang).toast;
  const toast = useToast();
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [form, setForm] = useState<SetupData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_SETUP);
        if (!raw) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as SetupPersisted;
        const slug = parsed?.data?.storefrontSlug;
        if (slug) {
          const res = await fetch(`/api/sellers/${slug}`);
          if (res.ok) {
            const s = await res.json();
            const merged: SetupData = {
              ...parsed.data,
              storeName: s.name ?? parsed.data.storeName,
              ownerName: s.ownerName ?? parsed.data.ownerName,
              businessType: s.businessType ?? parsed.data.businessType,
              currency: s.currency ?? parsed.data.currency,
              city: s.city ?? parsed.data.city,
              description: s.description ?? parsed.data.description,
              logoUrl: s.logoUrl ?? parsed.data.logoUrl,
              bannerUrl: s.bannerUrl ?? parsed.data.bannerUrl,
              whatsapp: s.socialLinks?.whatsapp ?? parsed.data.whatsapp,
              instagram: s.socialLinks?.instagram ?? parsed.data.instagram,
              facebook: s.socialLinks?.facebook ?? parsed.data.facebook,
              paymentLink: s.socialLinks?.paymentLink ?? parsed.data.paymentLink ?? "",
            };
            setSetup({ ...parsed, data: merged });
            setForm(merged);
            setHydrated(true);
            return;
          }
        }

        setSetup(parsed);
        setForm({ ...parsed.data });
      } catch {}
      setHydrated(true);
    };

    load();
  }, []);

  if (!hydrated) return null;

  if (!setup?.done || !form) {
    return (
      <section className="shell-empty">
        <div className="shell-empty-card">
          <p className="shell-empty-title">{t.notSetup}</p>
          <a href="/setup" className="shell-empty-cta inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
            {t.goSetup}
          </a>
        </div>
      </section>
    );
  }

  const update = (key: keyof SetupData, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;

    const updated: SetupPersisted = { ...setup, data: form };
    localStorage.setItem(STORAGE_SETUP, JSON.stringify(updated));

    try {
      await fetchJsonWithRetry(`/api/sellers/${form.storefrontSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.storeName,
          description: form.description || "",
          ownerName: form.ownerName,
          businessType: form.businessType,
          currency: form.currency,
          city: form.city,
          logoUrl: form.logoUrl || "",
          bannerUrl: form.bannerUrl || "",
          socialLinks: {
            whatsapp: form.whatsapp,
            instagram: form.instagram,
            facebook: form.facebook,
            paymentLink: form.paymentLink,
          },
        }),
      }, 3, "settings:save");
    } catch {
      toast.info(toastText.syncFailed);
    }

    setSetup(updated);
    toast.success(toastText.saved);
  };

  return (
      <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{t.storeIdentity}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.storeName} value={form.storeName} field="storeName" update={update} />
            <Field label={t.ownerName} value={form.ownerName} field="ownerName" update={update} />
            <div className="sm:col-span-2">
              <Field label={t.description} value={form.description || ""} field="description" update={update} placeholder={t.descriptionPh} textarea />
            </div>
            <Field label={t.currency} value={form.currency} field="currency" update={update} />
            <Field label={t.city} value={form.city} field="city" update={update} />
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">{t.logoUrl}</label>
              <div className="mt-1">
                <ImageUpload currentUrl={form.logoUrl || ""} onUrlChange={(url) => update("logoUrl", url)} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">{t.bannerUrl}</label>
              <div className="mt-1">
                <ImageUpload currentUrl={form.bannerUrl || ""} onUrlChange={(url) => update("bannerUrl", url)} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">{t.socialLinks}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.whatsapp} value={form.whatsapp} field="whatsapp" update={update} />
            <Field label={t.instagram} value={form.instagram} field="instagram" update={update} />
            <Field label={t.facebook} value={form.facebook} field="facebook" update={update} />
            <Field label={t.paymentLink} value={form.paymentLink} field="paymentLink" update={update} />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Save className="h-4 w-4" />
            {t.save}
          </button>
        </div>
      </div>
      </>
  );
}

function Field({
  label,
  value,
  field,
  update,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  field: keyof SetupData;
  update: (key: keyof SetupData, value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
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
}
