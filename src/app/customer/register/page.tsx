"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

const dict = {
  en: {
    title: "Create Account", subtitle: "Join to save favorites and track orders",
    name: "Full name", namePh: "Your name",
    email: "Email", emailPh: "you@example.com",
    password: "Password", passwordPh: "Min 6 characters",
    phone: "Phone (optional)", phonePh: "+258 84 000 0000",
    submit: "Create account", submitting: "Creating...",
    hasAccount: "Already have an account?", login: "Log in",
  },
  pt: {
    title: "Criar Conta", subtitle: "Junte-se para guardar favoritos e acompanhar pedidos",
    name: "Nome completo", namePh: "Seu nome",
    email: "Email", emailPh: "voce@exemplo.com",
    password: "Senha", passwordPh: "Mín 6 caracteres",
    phone: "Telefone (opcional)", phonePh: "+258 84 000 0000",
    submit: "Criar conta", submitting: "A criar...",
    hasAccount: "Já tem conta?", login: "Entrar",
  },
};

export default function CustomerRegisterPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      router.push("/customer/profile");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const inp = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
            <UserPlus className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-600">{t.name}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.namePh} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t.email}</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t.emailPh} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t.password}</label>
            <div className="relative">
              <input required type={showPw ? "text" : "password"} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t.passwordPh} className={inp + " pr-10"} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t.phone}</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t.phonePh} className={inp} />
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? t.submitting : t.submit}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t.hasAccount}{" "}
          <Link href="/customer/login" className="font-semibold text-indigo-600 hover:text-indigo-700">{t.login}</Link>
        </p>
      </div>
    </div>
  );
}
