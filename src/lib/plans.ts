// Subscription plan definitions and helpers

export type PlanId = "free" | "pro" | "business";

export type PlanFeature = {
  key: string;
  label: { en: string; pt: string };
  included: boolean;
  limit?: number | "unlimited";
};

export type PlanDef = {
  id: PlanId;
  name: { en: string; pt: string };
  price: string;
  period: { en: string; pt: string };
  description: { en: string; pt: string };
  badge: string; // tailwind classes
  limits: {
    products: number; // -1 = unlimited
    ordersPerMonth: number; // -1 = unlimited
  };
  features: PlanFeature[];
};

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: { en: "Free", pt: "Grátis" },
    price: "$0",
    period: { en: "forever", pt: "para sempre" },
    description: {
      en: "Perfect for trying out MyShop with a small catalog.",
      pt: "Perfeito para experimentar o MyShop com um catálogo pequeno.",
    },
    badge: "bg-slate-100 text-slate-700",
    limits: { products: 10, ordersPerMonth: 50 },
    features: [
      { key: "products", label: { en: "Up to 10 products", pt: "Até 10 produtos" }, included: true, limit: 10 },
      { key: "orders", label: { en: "50 orders/month", pt: "50 pedidos/mês" }, included: true, limit: 50 },
      { key: "analytics", label: { en: "Basic analytics", pt: "Análises básicas" }, included: true },
      { key: "branding", label: { en: "MyShop branding on storefront", pt: "Marca MyShop na loja" }, included: true },
      { key: "priority_support", label: { en: "Priority support", pt: "Suporte prioritário" }, included: false },
      { key: "custom_domain", label: { en: "Custom domain", pt: "Domínio próprio" }, included: false },
      { key: "api_access", label: { en: "API access", pt: "Acesso à API" }, included: false },
      { key: "white_label", label: { en: "White-label", pt: "White-label" }, included: false },
    ],
  },
  pro: {
    id: "pro",
    name: { en: "Pro", pt: "Pro" },
    price: "$19",
    period: { en: "/ month", pt: "/ mês" },
    description: {
      en: "For growing sellers who need more capacity and insights.",
      pt: "Para vendedores em crescimento que precisam de mais capacidade.",
    },
    badge: "bg-indigo-100 text-indigo-700",
    limits: { products: 100, ordersPerMonth: -1 },
    features: [
      { key: "products", label: { en: "Up to 100 products", pt: "Até 100 produtos" }, included: true, limit: 100 },
      { key: "orders", label: { en: "Unlimited orders", pt: "Pedidos ilimitados" }, included: true, limit: "unlimited" },
      { key: "analytics", label: { en: "Full analytics", pt: "Análises completas" }, included: true },
      { key: "branding", label: { en: "No MyShop branding", pt: "Sem marca MyShop" }, included: true },
      { key: "priority_support", label: { en: "Priority support", pt: "Suporte prioritário" }, included: true },
      { key: "custom_domain", label: { en: "Custom domain", pt: "Domínio próprio" }, included: false },
      { key: "api_access", label: { en: "API access", pt: "Acesso à API" }, included: false },
      { key: "white_label", label: { en: "White-label", pt: "White-label" }, included: false },
    ],
  },
  business: {
    id: "business",
    name: { en: "Business", pt: "Business" },
    price: "$49",
    period: { en: "/ month", pt: "/ mês" },
    description: {
      en: "For established sellers who need unlimited power.",
      pt: "Para vendedores estabelecidos que precisam de tudo.",
    },
    badge: "bg-violet-100 text-violet-700",
    limits: { products: -1, ordersPerMonth: -1 },
    features: [
      { key: "products", label: { en: "Unlimited products", pt: "Produtos ilimitados" }, included: true, limit: "unlimited" },
      { key: "orders", label: { en: "Unlimited orders", pt: "Pedidos ilimitados" }, included: true, limit: "unlimited" },
      { key: "analytics", label: { en: "Full analytics", pt: "Análises completas" }, included: true },
      { key: "branding", label: { en: "No MyShop branding", pt: "Sem marca MyShop" }, included: true },
      { key: "priority_support", label: { en: "Priority support", pt: "Suporte prioritário" }, included: true },
      { key: "custom_domain", label: { en: "Custom domain (coming soon)", pt: "Domínio próprio (em breve)" }, included: true },
      { key: "api_access", label: { en: "API access", pt: "Acesso à API" }, included: true },
      { key: "white_label", label: { en: "White-label", pt: "White-label" }, included: true },
    ],
  },
};

export function getPlan(id: string | null | undefined): PlanDef {
  return PLANS[(id as PlanId)] || PLANS.free;
}

export function checkLimit(
  plan: string | null | undefined,
  feature: "products" | "ordersPerMonth",
  current: number,
): { allowed: boolean; limit: number; current: number } {
  const p = getPlan(plan);
  const limit = p.limits[feature];
  if (limit === -1) return { allowed: true, limit: -1, current };
  return { allowed: current < limit, limit, current };
}

export function getPlanFeatures(plan: string | null | undefined, lang: "en" | "pt" = "en"): Array<{ label: string; included: boolean }> {
  const p = getPlan(plan);
  return p.features.map((f) => ({ label: f.label[lang], included: f.included }));
}

export function isFreePlan(plan: string | null | undefined): boolean {
  return !plan || plan === "free";
}
