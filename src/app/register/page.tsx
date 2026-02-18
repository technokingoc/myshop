"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";

const dict = {
  en: {
    title: "Create your store",
    subtitle: "Set up your MyShop seller account in minutes.",
    step1: "Store details",
    step2: "Your account",
    step3: "Review & register",
    storeName: "Store name",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "Store URL slug",
    slugPh: "Ex: nanda-beauty",
    slugHint: "Lowercase letters, numbers and dashes only. This becomes your store URL.",
    logo: "Store logo (optional)",
    ownerName: "Your name",
    ownerNamePh: "Ex: Fernanda Silva",
    email: "Email",
    emailPh: "name@domain.com",
    password: "Password",
    passwordPh: "Minimum 8 characters",
    confirmPassword: "Confirm password",
    confirmPasswordPh: "Re-enter your password",
    review: "Review your details",
    store: "Store",
    account: "Account",
    back: "Back",
    next: "Next",
    register: "Create account",
    registering: "Creating account...",
    success: "Account created successfully!",
    successSub: "You can now log in with your email and password.",
    goLogin: "Go to login",
    haveAccount: "Already have an account?",
    login: "Log in",
    errors: {
      required: "This field is required.",
      slugFormat: "Use only lowercase letters, numbers and dashes.",
      emailInvalid: "Please enter a valid email address.",
      passwordShort: "Password must be at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      emailTaken: "This email is already registered.",
      slugTaken: "This store URL is already taken.",
      generic: "Something went wrong. Please try again.",
    },
  },
  pt: {
    title: "Crie a sua loja",
    subtitle: "Configure a sua conta de vendedor MyShop em minutos.",
    step1: "Dados da loja",
    step2: "Sua conta",
    step3: "Revisar e registar",
    storeName: "Nome da loja",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "URL da loja",
    slugPh: "Ex: nanda-beauty",
    slugHint: "Use apenas minúsculas, números e hífen. Este será o URL da sua loja.",
    logo: "Logo da loja (opcional)",
    ownerName: "Seu nome",
    ownerNamePh: "Ex: Fernanda Silva",
    email: "Email",
    emailPh: "nome@dominio.com",
    password: "Palavra-passe",
    passwordPh: "Mínimo 8 caracteres",
    confirmPassword: "Confirmar palavra-passe",
    confirmPasswordPh: "Re-introduza a palavra-passe",
    review: "Revise os seus dados",
    store: "Loja",
    account: "Conta",
    back: "Voltar",
    next: "Próximo",
    register: "Criar conta",
    registering: "A criar conta...",
    success: "Conta criada com sucesso!",
    successSub: "Pode agora entrar com o seu email e palavra-passe.",
    goLogin: "Ir para login",
    haveAccount: "Já tem conta?",
    login: "Entrar",
    errors: {
      required: "Este campo é obrigatório.",
      slugFormat: "Use apenas minúsculas, números e hífen.",
      emailInvalid: "Introduza um email válido.",
      passwordShort: "A palavra-passe deve ter pelo menos 8 caracteres.",
      passwordMismatch: "As palavras-passe não coincidem.",
      emailTaken: "Este email já está registado.",
      slugTaken: "Este URL de loja já está em uso.",
      generic: "Algo correu mal. Tente novamente.",
    },
  },
};

function sanitizeSlug(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function RegisterPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState("");

  const effectiveSlug = slug || sanitizeSlug(storeName);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!storeName.trim()) e.storeName = t.errors.required;
    const s = effectiveSlug;
    if (!s) e.slug = t.errors.required;
    else if (!/^[a-z0-9-]+$/.test(s)) e.slug = t.errors.slugFormat;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!ownerName.trim()) e.ownerName = t.errors.required;
    if (!email.includes("@")) e.email = t.errors.emailInvalid;
    if (password.length < 8) e.password = t.errors.passwordShort;
    if (password !== confirmPassword) e.confirmPassword = t.errors.passwordMismatch;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const onBack = () => {
    setErrors({});
    setApiError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;
    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          slug: effectiveSlug,
          ownerName,
          email,
          password,
          logoUrl: logoUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("email")) setApiError(t.errors.emailTaken);
        else if (data.error?.includes("slug")) setApiError(t.errors.slugTaken);
        else setApiError(data.error || t.errors.generic);
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setApiError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-14">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">{t.success}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.successSub}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t.goLogin}
          </button>
        </div>
      </main>
    );
  }

  const steps = [t.step1, t.step2, t.step3];

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

        {/* Step indicator */}
        <div className="mt-5 flex gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-blue-600" : "bg-slate-200"}`} />
              <p className={`mt-1.5 text-xs ${i + 1 === step ? "font-medium text-slate-900" : "text-slate-500"}`}>{label}</p>
            </div>
          ))}
        </div>

        {apiError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{apiError}</div>
        )}

        <div className="mt-5 grid gap-3">
          {step === 1 && (
            <>
              <Field label={t.storeName} value={storeName} placeholder={t.storeNamePh} error={errors.storeName} onChange={setStoreName} />
              <div>
                <Field label={t.slug} value={slug} placeholder={t.slugPh} error={errors.slug} onChange={(v) => setSlug(sanitizeSlug(v))} />
                <p className="mt-1 text-xs text-slate-500">{t.slugHint}</p>
                {effectiveSlug && !errors.slug && (
                  <p className="mt-1 text-xs text-slate-500">→ /s/{effectiveSlug}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-700">{t.logo}</label>
                <div className="mt-1">
                  <ImageUpload currentUrl={logoUrl} onUrlChange={setLogoUrl} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Field label={t.ownerName} value={ownerName} placeholder={t.ownerNamePh} error={errors.ownerName} onChange={setOwnerName} />
              <Field label={t.email} value={email} placeholder={t.emailPh} error={errors.email} onChange={setEmail} type="email" />
              <Field label={t.password} value={password} placeholder={t.passwordPh} error={errors.password} onChange={setPassword} type="password" />
              <Field label={t.confirmPassword} value={confirmPassword} placeholder={t.confirmPasswordPh} error={errors.confirmPassword} onChange={setConfirmPassword} type="password" />
            </>
          )}

          {step === 3 && (
            <div className="grid gap-3">
              <h3 className="font-medium text-slate-800">{t.review}</h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{t.store}</p>
                <p className="mt-1 text-sm text-slate-800">{storeName}</p>
                <p className="text-sm text-slate-600">/s/{effectiveSlug}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{t.account}</p>
                <p className="mt-1 text-sm text-slate-800">{ownerName}</p>
                <p className="text-sm text-slate-600">{email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          {step > 1 && (
            <button onClick={onBack} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t.back}
            </button>
          )}
          {step < 3 ? (
            <button onClick={onNext} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              {t.next}
            </button>
          ) : (
            <button onClick={onSubmit} disabled={loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? t.registering : t.register}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          {t.haveAccount}{" "}
          <Link href="/login" className="text-blue-600 underline underline-offset-2">{t.login}</Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring ${error ? "border-rose-400" : "border-slate-300"}`}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
