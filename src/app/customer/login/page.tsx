"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";

const dict = {
  en: {
    title: "Welcome Back", subtitle: "Log in to your account",
    email: "Email", emailPh: "you@example.com",
    password: "Password", passwordPh: "Your password",
    submit: "Log in", submitting: "Logging in...",
    noAccount: "Don't have an account?", register: "Sign up",
  },
  pt: {
    title: "Bem-vindo de Volta", subtitle: "Entre na sua conta",
    email: "Email", emailPh: "voce@exemplo.com",
    password: "Senha", passwordPh: "Sua senha",
    submit: "Entrar", submitting: "A entrar...",
    noAccount: "Não tem conta?", register: "Criar conta",
  },
};

export default function CustomerLoginPage() {
  return <Suspense><CustomerLoginInner /></Suspense>;
}

function CustomerLoginInner() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/customer/profile";
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push(redirect);
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const inp = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
            <LogIn className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="text-xs font-medium text-slate-600">{t.email}</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t.emailPh} className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">{t.password}</label>
            <div className="relative">
              <input required type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t.passwordPh} className={inp + " pr-10"} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? t.submitting : t.submit}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t.noAccount}{" "}
          <Link href="/customer/register" className="font-semibold text-green-600 hover:text-green-700">{t.register}</Link>
        </p>
      </div>
    </div>
  );
}
