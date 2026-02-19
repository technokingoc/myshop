"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { Save, Bell, Crown, Palette, Clock, MapPin, ChevronDown, ChevronUp, LayoutTemplate } from "lucide-react";
import { storeTemplates } from "@/lib/store-templates";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { LocationSelect } from "@/components/location-select";

const STORAGE_SETUP = "myshop_setup_v2";

const THEME_COLORS = [
  { id: "green", label: "Indigo", bg: "bg-green-500", ring: "ring-green-300" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", ring: "ring-emerald-300" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", ring: "ring-rose-300" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", ring: "ring-amber-300" },
  { id: "violet", label: "Violet", bg: "bg-violet-500", ring: "ring-violet-300" },
  { id: "slate", label: "Slate", bg: "bg-slate-500", ring: "ring-slate-300" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, Record<string, string>> = {
  en: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
  pt: { monday: "Segunda", tuesday: "Terça", wednesday: "Quarta", thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo" },
};

const COUNTRIES = [
  "Mozambique", "South Africa", "Tanzania", "Malawi", "Zimbabwe",
  "Zambia", "Eswatini", "Kenya", "Angola", "Portugal", "Brazil", "Other",
];

const HEADER_TEMPLATES = [
  {
    id: "compact",
    nameEn: "Compact",
    namePt: "Compacto",
    descEn: "Dense header row with quick stats and actions.",
    descPt: "Cabeçalho denso com estatísticas e ações rápidas.",
  },
  {
    id: "hero",
    nameEn: "Hero",
    namePt: "Hero",
    descEn: "Banner-first layout with overlaid key details.",
    descPt: "Layout com destaque para banner e detalhes sobrepostos.",
  },
  {
    id: "split",
    nameEn: "Split",
    namePt: "Dividido",
    descEn: "Left identity, right actions and storefront stats.",
    descPt: "Identidade à esquerda, ações e estatísticas à direita.",
  },
  {
    id: "minimal-sticky",
    nameEn: "Minimal Sticky",
    namePt: "Minimal Fixo",
    descEn: "Slim sticky bar plus a lightweight hero block.",
    descPt: "Barra fixa compacta com bloco hero leve.",
  },
] as const;

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

type BusinessHours = Record<string, { open: string; close: string }>;

const settingsDict = {
  en: {
    themeColor: "Store Theme Color",
    themeColorDesc: "Choose an accent color for your storefront",
    storeDescription: "Store Description",
    charCount: "characters",
    businessHours: "Business Hours",
    businessHoursDesc: "Set your opening hours (leave empty if always open)",
    open: "Open",
    close: "Close",
    closed: "Closed",
    location: "Location Details",
    address: "Address",
    addressPh: "Street address...",
    country: "Country",
    selectCountry: "Select country",
    customization: "Store Customization",
    storeTemplate: "Store Template",
    storeTemplateDesc: "Choose how your products are displayed",
    sections: {
      identity: "Store Identity",
      customization: "Store Customization",
      social: "Social Links",
      notifications: "Notifications",
      plan: "Plan & Usage",
    },
  },
  pt: {
    themeColor: "Cor do Tema da Loja",
    themeColorDesc: "Escolha uma cor de destaque para a sua loja",
    storeDescription: "Descrição da Loja",
    charCount: "caracteres",
    businessHours: "Horário de Funcionamento",
    businessHoursDesc: "Defina os horários de abertura (deixe vazio se sempre aberto)",
    open: "Abre",
    close: "Fecha",
    closed: "Fechado",
    location: "Detalhes de Localização",
    address: "Endereço",
    addressPh: "Endereço da rua...",
    country: "País",
    selectCountry: "Selecionar país",
    customization: "Personalização da Loja",
    sections: {
      identity: "Identidade da Loja",
      customization: "Personalização da Loja",
      social: "Links Sociais",
      notifications: "Notificações",
      plan: "Plano & Uso",
    },
  },
};

export default function SettingsPage() {
  const { lang } = useLanguage();
  const t = getDict(lang).settings;
  const ts = settingsDict[lang];
  const toastText = getDict(lang).toast;
  const toast = useToast();
  const [setup, setSetup] = useState<SetupPersisted | null>(null);
  const [form, setForm] = useState<SetupData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [planInfo, setPlanInfo] = useState<{ plan: string; productCount: number; orderCount: number } | null>(null);

  // New fields
  const [themeColor, setThemeColor] = useState("green");
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [storeTemplate, setStoreTemplate] = useState("classic");
  const [headerTemplate, setHeaderTemplate] = useState("compact");

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true, customization: true, social: false, notifications: false, plan: false,
  });

  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const load = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_SETUP);
        if (!raw) { setHydrated(true); return; }

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
            if (s.emailNotifications !== undefined) setEmailNotifications(s.emailNotifications);
            setThemeColor(s.themeColor || "green");
            setBusinessHours(s.businessHours || {});
            setAddress(s.address || "");
            setCountry(s.country || "");
            setStoreTemplate(s.storeTemplate || "classic");
            setHeaderTemplate(s.headerTemplate || "compact");
            try {
              const statsRes = await fetch("/api/dashboard/stats", { credentials: "include" });
              if (statsRes.ok) {
                const stats = await statsRes.json();
                setPlanInfo({ plan: stats.plan || "free", productCount: stats.productCount || 0, orderCount: stats.orderCount || 0 });
              }
            } catch {}
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

  const updateHours = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
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
          emailNotifications,
          themeColor,
          businessHours,
          address,
          country,
          storeTemplate,
          headerTemplate,
        }),
      }, 3, "settings:save");
    } catch {
      toast.info(toastText.syncFailed);
    }

    setSetup(updated);
    toast.success(toastText.saved);
  };

  const descLen = (form.description || "").length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>

      <div className="space-y-4">
        {/* Store Identity */}
        <CollapsibleSection
          title={ts.sections.identity}
          open={openSections.identity}
          toggle={() => toggleSection("identity")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.storeName} value={form.storeName} field="storeName" update={update} />
            <Field label={t.ownerName} value={form.ownerName} field="ownerName" update={update} />
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">{ts.storeDescription}</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t.descriptionPh}
                rows={5}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-slate-400">{descLen}/1000 {ts.charCount}</p>
            </div>
            <Field label={t.currency} value={form.currency} field="currency" update={update} />
            <div>
              <label className="text-sm font-medium text-slate-700">{t.city}</label>
              <LocationSelect
                value={form.city}
                onChange={(v) => update("city", v)}
                className="mt-1"
              />
            </div>
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
        </CollapsibleSection>

        {/* Store Customization */}
        <CollapsibleSection
          title={ts.sections.customization}
          icon={<Palette className="h-4 w-4" />}
          open={openSections.customization}
          toggle={() => toggleSection("customization")}
        >
          {/* Theme Color */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700">{ts.themeColor}</label>
            <p className="text-xs text-slate-500">{ts.themeColorDesc}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setThemeColor(c.id)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                    themeColor === c.id
                      ? `border-slate-900 ${c.ring} ring-2`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full ${c.bg}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store Template */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <LayoutTemplate className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-700">{lang === "pt" ? "Modelo da Loja" : "Store Template"}</label>
            </div>
            <p className="text-xs text-slate-500 mb-3">{lang === "pt" ? "Escolha como os seus produtos são apresentados" : "Choose how your products are displayed"}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.values(storeTemplates).map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setStoreTemplate(tmpl.id)}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    storeTemplate === tmpl.id
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Mini preview */}
                  <div className="mb-2 flex h-16 items-end gap-1 rounded-lg bg-slate-100 p-2">
                    {tmpl.layout === "grid" && (
                      <div className="flex flex-1 flex-wrap gap-1">
                        {[1,2,3,4].slice(0, tmpl.gridCols.mobile === 1 ? 2 : tmpl.gridCols.mobile + 1).map((i) => (
                          <div key={i} className={`rounded bg-slate-300 ${tmpl.id === "boutique" ? "h-8 w-8" : "h-6 w-6"}`} />
                        ))}
                      </div>
                    )}
                    {tmpl.layout === "list" && (
                      <div className="flex flex-1 flex-col gap-1">
                        {[1,2,3].map((i) => (
                          <div key={i} className="flex gap-1">
                            <div className="h-3 w-3 rounded bg-slate-300" />
                            <div className="h-3 flex-1 rounded bg-slate-200" />
                          </div>
                        ))}
                      </div>
                    )}
                    {tmpl.layout === "single" && (
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="h-8 w-full rounded bg-slate-300" />
                        <div className="h-2 w-3/4 rounded bg-slate-200" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{lang === "pt" ? tmpl.namePt : tmpl.nameEn}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{lang === "pt" ? tmpl.descPt : tmpl.descEn}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Header Template */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <LayoutTemplate className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-700">{lang === "pt" ? "Modelo do Cabeçalho" : "Header Template"}</label>
            </div>
            <p className="text-xs text-slate-500 mb-3">{lang === "pt" ? "Escolha o estilo do cabeçalho da sua loja (independente do modelo de produtos)." : "Choose your storefront header style (independent from product layout template)."}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {HEADER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setHeaderTemplate(tmpl.id)}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    headerTemplate === tmpl.id
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <HeaderTemplatePreview id={tmpl.id} />
                  <p className="mt-2 text-sm font-semibold text-slate-800">{lang === "pt" ? tmpl.namePt : tmpl.nameEn}</p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{lang === "pt" ? tmpl.descPt : tmpl.descEn}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Business Hours */}
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-700">{ts.businessHours}</label>
            </div>
            <p className="text-xs text-slate-500 mb-2">{ts.businessHoursDesc}</p>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-2 text-sm">
                  <span className="w-20 font-medium text-slate-600">{DAY_LABELS[lang][day]}</span>
                  <input
                    type="time"
                    value={businessHours[day]?.open || ""}
                    onChange={(e) => updateHours(day, "open", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-green-300 focus:outline-none"
                    placeholder={ts.open}
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="time"
                    value={businessHours[day]?.close || ""}
                    onChange={(e) => updateHours(day, "close", e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-green-300 focus:outline-none"
                    placeholder={ts.close}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <label className="text-sm font-medium text-slate-700">{ts.location}</label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500">{ts.address}</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={ts.addressPh}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{ts.country}</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">{ts.selectCountry}</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Social Links */}
        <CollapsibleSection
          title={ts.sections.social}
          open={openSections.social}
          toggle={() => toggleSection("social")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.whatsapp} value={form.whatsapp} field="whatsapp" update={update} />
            <Field label={t.instagram} value={form.instagram} field="instagram" update={update} />
            <Field label={t.facebook} value={form.facebook} field="facebook" update={update} />
            <Field label={t.paymentLink} value={form.paymentLink} field="paymentLink" update={update} />
          </div>
        </CollapsibleSection>

        {/* Notifications */}
        <CollapsibleSection
          title={ts.sections.notifications}
          icon={<Bell className="h-4 w-4" />}
          open={openSections.notifications}
          toggle={() => toggleSection("notifications")}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{(t as Record<string, string>).emailNotifications || "Email notifications for new orders"}</p>
              <p className="text-xs text-slate-500">{(t as Record<string, string>).emailNotificationsDesc || "Receive an email when a customer places a new order."}</p>
            </div>
          </label>
        </CollapsibleSection>

        {/* Plan & Usage */}
        {planInfo && (
          <CollapsibleSection
            title={ts.sections.plan}
            icon={<Crown className="h-4 w-4" />}
            open={openSections.plan}
            toggle={() => toggleSection("plan")}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                planInfo.plan === "business" ? "bg-violet-100 text-violet-700" : planInfo.plan === "pro" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
              }`}>
                {planInfo.plan.charAt(0).toUpperCase() + planInfo.plan.slice(1)}
              </span>
              {planInfo.plan === "free" && (
                <a href="/pricing" className="text-sm font-medium text-green-600 hover:text-green-700">
                  {lang === "pt" ? "Fazer upgrade →" : "Upgrade →"}
                </a>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{lang === "pt" ? "Produtos" : "Products"}</p>
                <p className="text-lg font-bold text-slate-800">
                  {planInfo.productCount}
                  <span className="text-sm font-normal text-slate-400">
                    {" / "}{planInfo.plan === "free" ? "10" : planInfo.plan === "pro" ? "100" : "∞"}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{lang === "pt" ? "Pedidos (total)" : "Orders (total)"}</p>
                <p className="text-lg font-bold text-slate-800">
                  {planInfo.orderCount}
                  <span className="text-sm font-normal text-slate-400">
                    {planInfo.plan === "free" ? " / 50 mo" : " / ∞"}
                  </span>
                </p>
              </div>
            </div>
          </CollapsibleSection>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Save className="h-4 w-4" />
            {t.save}
          </button>
        </div>
      </div>
    </>
  );
}

function CollapsibleSection({
  title,
  icon,
  open,
  toggle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  toggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between p-5"
      >
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {icon}
          {title}
        </h2>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100 px-5 pb-5 pt-4">{children}</div>}
    </section>
  );
}

function HeaderTemplatePreview({ id }: { id: string }) {
  if (id === "hero") {
    return (
      <div className="h-16 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-200 via-slate-100 to-white p-2">
        <div className="mt-6 rounded bg-white/85 p-1.5 shadow-sm">
          <div className="h-2 w-1/2 rounded bg-slate-300" />
          <div className="mt-1 h-1.5 w-1/3 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (id === "split") {
    return (
      <div className="flex h-16 gap-2 rounded-lg border border-slate-200 bg-white p-2">
        <div className="flex-1 rounded bg-slate-100 p-1.5">
          <div className="h-2 w-2/3 rounded bg-slate-300" />
          <div className="mt-1 h-1.5 w-1/2 rounded bg-slate-200" />
        </div>
        <div className="w-16 rounded bg-slate-50 p-1.5">
          <div className="h-2 w-full rounded bg-slate-200" />
          <div className="mt-1 h-2 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (id === "minimal-sticky") {
    return (
      <div className="h-16 rounded-lg border border-slate-200 bg-white p-2">
        <div className="mb-2 h-2.5 w-full rounded bg-slate-800" />
        <div className="rounded bg-slate-100 p-1.5">
          <div className="h-2 w-1/2 rounded bg-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-16 rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex items-center gap-2 rounded bg-slate-100 p-1.5">
        <div className="h-6 w-6 rounded bg-slate-300" />
        <div className="flex-1">
          <div className="h-2 w-1/2 rounded bg-slate-300" />
          <div className="mt-1 h-1.5 w-1/3 rounded bg-slate-200" />
        </div>
        <div className="h-2 w-8 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  field,
  update,
  placeholder,
}: {
  label: string;
  value: string;
  field: keyof SetupData;
  update: (key: keyof SetupData, value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />
    </div>
  );
}
