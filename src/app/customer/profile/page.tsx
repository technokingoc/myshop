"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { User, Save, Loader2, CheckCircle } from "lucide-react";

const dict = {
  en: {
    title: "My Profile", subtitle: "Manage your account details",
    name: "Name", email: "Email", phone: "Phone", address: "Address", city: "City", country: "Country",
    language: "Preferred Language", 
    languageDesc: "Choose your preferred language for orders and notifications",
    save: "Save changes", saving: "Saving...", saved: "Saved!",
    loading: "Loading...",
  },
  pt: {
    title: "Meu Perfil", subtitle: "Gerencie os detalhes da sua conta",
    name: "Nome", email: "Email", phone: "Telefone", address: "Endereço", city: "Cidade", country: "País",
    language: "Idioma Preferido",
    languageDesc: "Escolha o seu idioma preferido para pedidos e notificações",
    save: "Guardar alterações", saving: "A guardar...", saved: "Guardado!",
    loading: "A carregar...",
  },
};

type Profile = { customerId: number; name: string; email: string; phone: string; address: string; city: string; country: string; language?: string };

export default function CustomerProfilePage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", country: "", language: "en" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/customer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.session) { router.push("/customer/login"); return; }
        setProfile(data.session);
        setForm({ name: data.session.name || "", phone: data.session.phone || "", address: data.session.address || "", city: data.session.city || "", country: data.session.country || "", language: data.session.language || "en" });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/auth/customer/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      if (res.ok) setSaved(true);
    } catch {} finally { setSaving(false); setTimeout(() => setSaved(false), 3000); }
  };

  const inp = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition";

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /><span className="ml-2 text-sm text-slate-500">{t.loading}</span></div>;

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100"><User className="h-5 w-5 text-green-600" /></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">{t.name}</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">{t.email}</label>
          <input disabled value={profile?.email || ""} className={inp + " bg-slate-50 text-slate-400"} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">{t.phone}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">{t.address}</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">{t.city}</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t.country}</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inp} />
          </div>
        </div>
        
        {/* Language Preference */}
        <div>
          <label className="text-xs font-medium text-slate-600">{t.language}</label>
          <p className="text-xs text-slate-500 mb-2">{t.languageDesc}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, language: "en" })}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                form.language === "en"
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-lg">🇬🇧</span>
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, language: "pt" })}
              className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                form.language === "pt"
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-lg">🇵🇹</span>
              <span>Português</span>
            </button>
          </div>
        </div>
        
        <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? t.saving : saved ? t.saved : t.save}
        </button>
      </form>
    </div>
  );
}
