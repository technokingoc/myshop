"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { Save, Check } from "lucide-react";

const dict = {
  en: {
    title: "Platform Settings",
    subtitle: "Configure platform-wide settings",
    platformName: "Platform Name",
    platformDescription: "Platform Description",
    contactEmail: "Contact Email",
    save: "Save Settings",
    saved: "Settings saved!",
  },
  pt: {
    title: "Configurações da Plataforma",
    subtitle: "Configurar definições gerais da plataforma",
    platformName: "Nome da Plataforma",
    platformDescription: "Descrição da Plataforma",
    contactEmail: "Email de Contacto",
    save: "Guardar Configurações",
    saved: "Configurações guardadas!",
  },
};

export default function AdminSettings() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [form, setForm] = useState({ platform_name: "", platform_description: "", contact_email: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            platform_name: d.settings.platform_name || "",
            platform_description: d.settings.platform_description || "",
            contact_email: d.settings.contact_email || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t.platformName}</label>
            <input type="text" value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t.platformDescription}</label>
            <textarea value={form.platform_description} onChange={(e) => setForm({ ...form, platform_description: e.target.value })} rows={3}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t.contactEmail}</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>

          <button onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? t.saved : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
