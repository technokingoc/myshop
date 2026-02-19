"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRememberedEmail, rememberEmail } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import Link from "next/link";

const dict = {
  en: {
    title: "Welcome back",
    subtitle: "Sign in to your MyShop account",
    email: "Email",
    emailPh: "name@domain.com",
    password: "Password",
    passwordPh: "Enter your password",
    remember: "Remember email",
    login: "Sign in",
    loading: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Create one",
    invalidEmail: "Please enter a valid email address.",
    invalidPassword: "Password is required.",
    authFailed: "Invalid email or password.",
    genericError: "Something went wrong. Please try again.",
  },
  pt: {
    title: "Bem-vindo de volta",
    subtitle: "Faça login na sua conta MyShop",
    email: "Email",
    emailPh: "nome@dominio.com",
    password: "Palavra-passe",
    passwordPh: "Introduza a sua palavra-passe",
    remember: "Lembrar email",
    login: "Entrar",
    loading: "A entrar...",
    noAccount: "Não tem conta?",
    register: "Criar conta",
    invalidEmail: "Introduza um endereço de email válido.",
    invalidPassword: "A palavra-passe é obrigatória.",
    authFailed: "Email ou palavra-passe inválidos.",
    genericError: "Algo correu mal. Tente novamente.",
  },
};

export default function UnifiedLoginPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(getRememberedEmail());
  }, []);

  const validate = () => {
    let ok = true;
    if (!email.includes("@")) { setEmailError(t.invalidEmail); ok = false; } else setEmailError("");
    if (!password) { setPasswordError(t.invalidPassword); ok = false; } else setPasswordError("");
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/unified/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || t.authFailed);
        setLoading(false);
        return;
      }

      if (remember) rememberEmail(email);

      // Route users based on whether they have a store
      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      
      // If they have a store, go to dashboard, otherwise go to browse/home
      const defaultRoute = data.user.hasStore ? "/dashboard" : "/";
      router.replace(redirect || defaultRoute);
    } catch {
      setApiError(t.genericError);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

        {apiError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{apiError}</div>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">{t.email}</span>
            <input
              type="email"
              className={`rounded-lg border bg-white px-3 py-2 outline-none ring-green-200 transition focus:ring ${emailError ? "border-rose-400" : "border-slate-300"}`}
              value={email}
              placeholder={t.emailPh}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <span className="text-xs text-rose-600">{emailError}</span>}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">{t.password}</span>
            <input
              type="password"
              className={`rounded-lg border bg-white px-3 py-2 outline-none ring-green-200 transition focus:ring ${passwordError ? "border-rose-400" : "border-slate-300"}`}
              value={password}
              placeholder={t.passwordPh}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && <span className="text-xs text-rose-600">{passwordError}</span>}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t.remember}
          </label>

          <button disabled={loading} className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
            {loading ? t.loading : t.login}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          {t.noAccount}{" "}
          <Link href="/register" className="text-green-600 underline underline-offset-2">{t.register}</Link>
        </p>
      </div>
    </main>
  );
}