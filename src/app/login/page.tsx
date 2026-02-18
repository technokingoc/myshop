"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRememberedEmail, rememberEmail, setSession } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    title: "Seller login",
    subtitle: "Access your seller workspace",
    authModeTitle: "Authentication mode",
    authModeText: "Local/dev mode: sign-in is stored in this browser for testing. No external auth provider is used.",
    email: "Email",
    emailHint: "Use the email you use for your seller setup.",
    password: "Password",
    passwordHint: "Minimum 6 characters.",
    remember: "Remember email",
    login: "Login",
    loading: "Signing in...",
    invalidEmail: "Please enter a valid email address.",
    invalidPassword: "Password must have at least 6 characters.",
    continueSetup: "Continue to setup",
    goStorefront: "Go to storefront",
  },
  pt: {
    title: "Login do vendedor",
    subtitle: "Aceda ao seu espaço de vendedor",
    authModeTitle: "Modo de autenticação",
    authModeText: "Modo local/dev: o login fica guardado neste browser para testes. Não há provedor externo de autenticação.",
    email: "Email",
    emailHint: "Use o email que usa na configuração da loja.",
    password: "Palavra-passe",
    passwordHint: "Mínimo de 6 caracteres.",
    remember: "Lembrar email",
    login: "Entrar",
    loading: "A entrar...",
    invalidEmail: "Introduza um endereço de email válido.",
    invalidPassword: "A palavra-passe deve ter pelo menos 6 caracteres.",
    continueSetup: "Continuar para configuração",
    goStorefront: "Ir para a loja",
  },
};

export default function LoginPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const rawSetup = typeof window !== "undefined" ? localStorage.getItem("myshop_setup_v2") : null;
  let sellerSlug = "";
  try {
    sellerSlug = rawSetup ? JSON.parse(rawSetup)?.data?.storefrontSlug || "" : "";
  } catch {}

  useEffect(() => {
    setEmail(getRememberedEmail());
  }, []);

  const validate = () => {
    let ok = true;
    if (!email.includes("@")) {
      setEmailError(t.invalidEmail);
      ok = false;
    } else {
      setEmailError("");
    }

    if (password.length < 6) {
      setPasswordError(t.invalidPassword);
      ok = false;
    } else {
      setPasswordError("");
    }

    return ok;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSession({ email, sellerSlug: sellerSlug || undefined, loggedAt: new Date().toISOString() });
    if (remember) rememberEmail(email);

    const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
    router.replace(redirect || "/dashboard");
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <p className="font-medium text-blue-700">{t.authModeTitle}</p>
          <p className="mt-1 text-blue-700/90">{t.authModeText}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="text-sm">
            <span className="text-slate-700">{t.email}</span>
            <input
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${emailError ? "border-rose-400" : "border-slate-300"}`}
              value={email}
              placeholder="name@domain.com"
              onBlur={validate}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-500">{t.emailHint}</span>
            {emailError && <span className="mt-1 block text-xs text-rose-600">{emailError}</span>}
          </label>

          <label className="text-sm">
            <span className="text-slate-700">{t.password}</span>
            <input
              type="password"
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${passwordError ? "border-rose-400" : "border-slate-300"}`}
              value={password}
              placeholder="******"
              onBlur={validate}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-500">{t.passwordHint}</span>
            {passwordError && <span className="mt-1 block text-xs text-rose-600">{passwordError}</span>}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t.remember}
          </label>

          <button disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? t.loading : t.login}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="/setup" className="text-blue-600 underline underline-offset-2">{t.continueSetup}</a>
          <a href={sellerSlug ? `/s/${sellerSlug}` : "/"} className="text-blue-600 underline underline-offset-2">{t.goStorefront}</a>
        </div>
      </div>
    </main>
  );
}
