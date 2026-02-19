"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import Link from "next/link";

const dict = {
  en: {
    title: "Create your account",
    subtitle: "Join MyShop and start shopping or selling",
    name: "Full name",
    namePh: "John Doe",
    email: "Email address",
    emailPh: "john@example.com",
    password: "Password",
    passwordPh: "At least 6 characters",
    phone: "Phone number (optional)",
    phonePh: "+258 84 123 4567",
    city: "City (optional)",
    cityPh: "Maputo",
    country: "Country (optional)",
    countryPh: "Mozambique",
    register: "Create account",
    registering: "Creating account...",
    success: "Welcome to MyShop!",
    successSub: "Your account has been created successfully.",
    continue: "Continue",
    haveAccount: "Already have an account?",
    login: "Sign in",
    storeOptionTitle: "Want to sell on MyShop?",
    storeOptionDesc: "You can open your store anytime from your profile",
    errors: {
      nameRequired: "Full name is required.",
      emailInvalid: "Please enter a valid email address.",
      passwordShort: "Password must be at least 6 characters.",
      emailTaken: "An account with this email already exists.",
      generic: "Something went wrong. Please try again.",
    },
  },
  pt: {
    title: "Criar conta",
    subtitle: "Junte-se ao MyShop para comprar ou vender",
    name: "Nome completo",
    namePh: "João Silva",
    email: "Email",
    emailPh: "joao@exemplo.com",
    password: "Palavra-passe",
    passwordPh: "Mínimo 6 caracteres",
    phone: "Telemóvel (opcional)",
    phonePh: "+258 84 123 4567",
    city: "Cidade (opcional)",
    cityPh: "Maputo",
    country: "País (opcional)",
    countryPh: "Moçambique",
    register: "Criar conta",
    registering: "A criar conta...",
    success: "Bem-vindo ao MyShop!",
    successSub: "A sua conta foi criada com sucesso.",
    continue: "Continuar",
    haveAccount: "Já tem conta?",
    login: "Entrar",
    storeOptionTitle: "Quer vender no MyShop?",
    storeOptionDesc: "Pode abrir a sua loja a qualquer momento no seu perfil",
    errors: {
      nameRequired: "Nome completo é obrigatório.",
      emailInvalid: "Introduza um email válido.",
      passwordShort: "A palavra-passe deve ter pelo menos 6 caracteres.",
      emailTaken: "Já existe uma conta com este email.",
      generic: "Algo correu mal. Tente novamente.",
    },
  },
};

export default function UnifiedRegisterPage() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    country: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [done, setDone] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    
    if (!formData.name.trim()) e.name = t.errors.nameRequired;
    if (!formData.email.includes("@")) e.email = t.errors.emailInvalid;
    if (formData.password.length < 6) e.password = t.errors.passwordShort;
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch("/api/auth/unified/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("email")) {
          setApiError(t.errors.emailTaken);
        } else {
          setApiError(data.error || t.errors.generic);
        }
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setApiError(t.errors.generic);
      setLoading(false);
    }
  };

  const onContinue = () => {
    router.push("/"); // Go to home page after registration
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
          
          {/* Store option hint */}
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-left">
            <h3 className="text-sm font-medium text-blue-900">{t.storeOptionTitle}</h3>
            <p className="mt-1 text-xs text-blue-700">{t.storeOptionDesc}</p>
          </div>
          
          <button
            onClick={onContinue}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t.continue}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>

        {apiError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{apiError}</div>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <Field
            label={t.name}
            value={formData.name}
            placeholder={t.namePh}
            error={errors.name}
            onChange={(v) => updateField("name", v)}
            required
          />

          <Field
            label={t.email}
            value={formData.email}
            placeholder={t.emailPh}
            error={errors.email}
            onChange={(v) => updateField("email", v)}
            type="email"
            required
          />

          <Field
            label={t.password}
            value={formData.password}
            placeholder={t.passwordPh}
            error={errors.password}
            onChange={(v) => updateField("password", v)}
            type="password"
            required
          />

          <Field
            label={t.phone}
            value={formData.phone}
            placeholder={t.phonePh}
            error={errors.phone}
            onChange={(v) => updateField("phone", v)}
          />

          <Field
            label={t.city}
            value={formData.city}
            placeholder={t.cityPh}
            error={errors.city}
            onChange={(v) => updateField("city", v)}
          />

          <Field
            label={t.country}
            value={formData.country}
            placeholder={t.countryPh}
            error={errors.country}
            onChange={(v) => updateField("country", v)}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? t.registering : t.register}
          </button>
        </form>

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
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
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