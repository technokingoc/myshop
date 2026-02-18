"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRememberedEmail, rememberEmail, setSession } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    title: "Seller login",
    subtitle: "Access your seller workspace",
    email: "Email",
    password: "Password",
    remember: "Remember email",
    login: "Login",
    loading: "Signing in...",
    invalid: "Please provide a valid email and password (min 6 chars).",
  },
  pt: {
    title: "Login do vendedor",
    subtitle: "Aceda ao seu espaço de vendedor",
    email: "Email",
    password: "Palavra-passe",
    remember: "Lembrar email",
    login: "Entrar",
    loading: "A entrar...",
    invalid: "Forneça um email válido e palavra-passe (mín 6 chars).",
  },
};

export default function LoginPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(getRememberedEmail());
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 6) {
      setError(t.invalid);
      return;
    }

    setLoading(true);
    const rawSetup = localStorage.getItem("myshop_setup_v2");
    let sellerSlug: string | undefined;
    try {
      sellerSlug = rawSetup ? JSON.parse(rawSetup)?.data?.storefrontSlug : undefined;
    } catch {}

    setSession({ email, sellerSlug, loggedAt: new Date().toISOString() });
    if (remember) rememberEmail(email);

    const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
    router.replace(redirect || "/dashboard");
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="text-sm">
            <span className="text-slate-600">{t.email}</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-slate-600">{t.password}</span>
            <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t.remember}
          </label>
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? t.loading : t.login}
          </button>
        </form>
      </div>
    </main>
  );
}
