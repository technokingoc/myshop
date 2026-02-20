"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getDict } from "@/lib/i18n";
import { PLANS, getPlan, type PlanId } from "@/lib/plans";
import { 
  Crown, 
  Check, 
  X, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";

const dict = {
  en: {
    title: "Subscription Management",
    subtitle: "Manage your plan, billing, and usage",
    currentPlan: "Current Plan",
    usage: "Usage This Month",
    billing: "Billing & Invoices",
    upgrade: "Upgrade Plan",
    downgrade: "Downgrade Plan",
    cancel: "Cancel Subscription",
    
    // Plan status
    active: "Active",
    cancelled: "Cancelled",
    pastDue: "Past Due",
    trialing: "Trial Period",
    
    // Usage metrics
    products: "Products",
    orders: "Orders",
    unlimited: "Unlimited",
    of: "of",
    
    // Billing
    nextBilling: "Next billing date",
    paymentMethod: "Payment method",
    managePayment: "Manage payment method",
    downloadInvoices: "Download invoices",
    
    // Actions
    upgradeToPro: "Upgrade to Pro",
    upgradeToBusiness: "Upgrade to Business",
    continuePlan: "Continue with current plan",
    
    // Grace period
    gracePeriod: "Grace Period",
    gracePeriodDesc: "Your account is in a grace period. Please update your payment method to continue service.",
    daysLeft: "days left",
    updatePayment: "Update Payment Method",
    
    // Features comparison
    featuresComparison: "Features Comparison",
    planFeatures: "Plan Features",
    
    // Usage warnings
    approachingLimit: "Approaching Limit",
    limitReached: "Limit Reached",
    usageWarning: "You're approaching your plan limits. Consider upgrading to avoid service interruption.",
    
    // Invoices
    invoiceHistory: "Invoice History",
    amount: "Amount",
    status: "Status",
    date: "Date",
    download: "Download",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    
    // Plan benefits
    planBenefits: "What's included in your plan",
    
    loading: "Loading...",
    error: "Error loading subscription data",
    
    // Confirmation dialogs
    confirmUpgrade: "Confirm Upgrade",
    confirmDowngrade: "Confirm Downgrade", 
    upgradeConfirmText: "Are you sure you want to upgrade your plan? You'll be charged immediately.",
    downgradeConfirmText: "Are you sure you want to downgrade? Some features may be limited.",
    
    // Success messages
    upgradeSuccess: "Successfully upgraded your plan!",
    downgradeSuccess: "Successfully downgraded your plan!",
    
    // Errors
    upgradeError: "Failed to upgrade plan. Please try again.",
    downgradeError: "Failed to downgrade plan. Please try again.",
  },
  pt: {
    title: "Gestão de Subscrição",
    subtitle: "Gerir o seu plano, faturação e uso",
    currentPlan: "Plano Atual",
    usage: "Uso Este Mês",
    billing: "Faturação & Facturas",
    upgrade: "Fazer Upgrade do Plano",
    downgrade: "Fazer Downgrade do Plano",
    cancel: "Cancelar Subscrição",
    
    // Plan status
    active: "Ativo",
    cancelled: "Cancelado",
    pastDue: "Em Atraso",
    trialing: "Período de Teste",
    
    // Usage metrics
    products: "Produtos",
    orders: "Pedidos",
    unlimited: "Ilimitado",
    of: "de",
    
    // Billing
    nextBilling: "Próxima data de faturação",
    paymentMethod: "Método de pagamento",
    managePayment: "Gerir método de pagamento",
    downloadInvoices: "Descarregar facturas",
    
    // Actions
    upgradeToPro: "Upgrade para Pro",
    upgradeToBusiness: "Upgrade para Business",
    continuePlan: "Continuar com plano atual",
    
    // Grace period
    gracePeriod: "Período de Tolerância",
    gracePeriodDesc: "A sua conta está num período de tolerância. Por favor, atualize o seu método de pagamento para continuar o serviço.",
    daysLeft: "dias restantes",
    updatePayment: "Atualizar Método de Pagamento",
    
    // Features comparison
    featuresComparison: "Comparação de Funcionalidades",
    planFeatures: "Funcionalidades do Plano",
    
    // Usage warnings
    approachingLimit: "Próximo do Limite",
    limitReached: "Limite Atingido",
    usageWarning: "Está a aproximar-se dos limites do seu plano. Considere fazer upgrade para evitar interrupção do serviço.",
    
    // Invoices
    invoiceHistory: "Histórico de Facturas",
    amount: "Valor",
    status: "Estado",
    date: "Data",
    download: "Descarregar",
    paid: "Pago",
    pending: "Pendente",
    failed: "Falhado",
    
    // Plan benefits
    planBenefits: "O que está incluído no seu plano",
    
    loading: "A carregar...",
    error: "Erro ao carregar dados da subscrição",
    
    // Confirmation dialogs
    confirmUpgrade: "Confirmar Upgrade",
    confirmDowngrade: "Confirmar Downgrade",
    upgradeConfirmText: "Tem a certeza que quer fazer upgrade do seu plano? Será cobrado imediatamente.",
    downgradeConfirmText: "Tem a certeza que quer fazer downgrade? Algumas funcionalidades podem ser limitadas.",
    
    // Success messages
    upgradeSuccess: "Plano atualizado com sucesso!",
    downgradeSuccess: "Plano alterado com sucesso!",
    
    // Errors
    upgradeError: "Falha ao fazer upgrade do plano. Tente novamente.",
    downgradeError: "Falha ao fazer downgrade do plano. Tente novamente.",
  },
};

type SubscriptionData = {
  currentPlan: PlanId;
  status: "active" | "cancelled" | "past_due" | "trialing";
  nextBillingDate: string | null;
  gracePeriodEnds: string | null;
  usage: {
    products: { current: number; limit: number };
    orders: { current: number; limit: number };
  };
  paymentMethod: {
    type: string;
    last4: string;
  } | null;
  invoices: Array<{
    id: string;
    amount: number;
    status: "paid" | "pending" | "failed";
    date: string;
    downloadUrl: string;
  }>;
};

export default function SubscriptionPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  
  useEffect(() => {
    loadSubscriptionData();
  }, []);
  
  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load subscription data");
      }
      
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpgrade = async (targetPlan: PlanId) => {
    if (!subscription) return;
    
    setProcessingUpgrade(true);
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan: targetPlan }),
      });
      
      if (!response.ok) {
        throw new Error("Upgrade failed");
      }
      
      toast.success(t.upgradeSuccess);
      await loadSubscriptionData();
    } catch (err) {
      toast.error(t.upgradeError);
    } finally {
      setProcessingUpgrade(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  if (error || !subscription) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">{t.error}</p>
        </div>
      </div>
    );
  }
  
  const currentPlan = getPlan(subscription.currentPlan);
  const isApproachingProductLimit = subscription.usage.products.limit > 0 && 
    subscription.usage.products.current / subscription.usage.products.limit > 0.8;
  const isApproachingOrderLimit = subscription.usage.orders.limit > 0 && 
    subscription.usage.orders.current / subscription.usage.orders.limit > 0.8;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      
      {/* Grace Period Warning */}
      {subscription.status === "past_due" && subscription.gracePeriodEnds && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">{t.gracePeriod}</h3>
              <p className="text-sm text-amber-700 mt-1">{t.gracePeriodDesc}</p>
              <p className="text-sm font-medium text-amber-800 mt-2">
                Expires: {new Date(subscription.gracePeriodEnds).toLocaleDateString()}
                {(() => {
                  const daysLeft = Math.ceil((new Date(subscription.gracePeriodEnds).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return ` (${daysLeft} ${t.daysLeft})`;
                })()}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  <CreditCard className="h-4 w-4" />
                  {t.updatePayment}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-600 bg-transparent px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                >
                  <Crown className="h-4 w-4" />
                  Change Plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Usage Warnings */}
      {(isApproachingProductLimit || isApproachingOrderLimit) && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800">{t.approachingLimit}</h3>
              <p className="text-sm text-orange-700 mt-1">{t.usageWarning}</p>
              <Link href="/pricing" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                <TrendingUp className="h-4 w-4" />
                {t.upgrade}
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">{t.currentPlan}</h2>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                subscription.status === "active" ? "bg-green-100 text-green-700" :
                subscription.status === "past_due" ? "bg-red-100 text-red-700" :
                subscription.status === "trialing" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-700"
              }`}>
                <Crown className="h-3 w-3" />
                {currentPlan.name[lang]} - {t[subscription.status as keyof typeof t] || subscription.status}
              </span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-2xl font-bold text-slate-900">
                  {currentPlan.price}
                  <span className="text-lg font-normal text-slate-600">{currentPlan.period[lang]}</span>
                </p>
                <p className="text-sm text-slate-600 mt-1">{currentPlan.description[lang]}</p>
              </div>
              
              {subscription.nextBillingDate && (
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-medium text-slate-700">{t.nextBilling}</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            {/* Plan Features */}
            <div className="mt-6">
              <h3 className="font-medium text-slate-900 mb-3">{t.planBenefits}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400"}`}>
                      {feature.label[lang]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Usage Metrics */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t.usage}</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <UsageCard
                title={t.products}
                icon={<Package className="h-5 w-5" />}
                current={subscription.usage.products.current}
                limit={subscription.usage.products.limit}
                unlimited={subscription.usage.products.limit === -1}
                t={t}
              />
              
              <UsageCard
                title={t.orders}
                icon={<ShoppingCart className="h-5 w-5" />}
                current={subscription.usage.orders.current}
                limit={subscription.usage.orders.limit}
                unlimited={subscription.usage.orders.limit === -1}
                t={t}
              />
            </div>
          </div>
          
          {/* Invoice History */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t.invoiceHistory}</h2>
            
            {subscription.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 font-medium text-slate-700">{t.date}</th>
                      <th className="text-left py-2 font-medium text-slate-700">{t.amount}</th>
                      <th className="text-left py-2 font-medium text-slate-700">{t.status}</th>
                      <th className="text-left py-2 font-medium text-slate-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscription.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100">
                        <td className="py-3">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-medium">${invoice.amount}</td>
                        <td className="py-3">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            invoice.status === "paid" ? "bg-green-100 text-green-700" :
                            invoice.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {t[invoice.status as keyof typeof t]}
                          </span>
                        </td>
                        <td className="py-3">
                          <a
                            href={invoice.downloadUrl}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            {t.download}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No invoices yet.</p>
            )}
          </div>
        </div>
        
        {/* Upgrade Options */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{t.upgrade}</h2>
            
            <div className="space-y-4">
              {Object.values(PLANS).map((plan) => {
                if (plan.id === subscription.currentPlan) return null;
                
                const isUpgrade = getOrderValue(plan.id) > getOrderValue(subscription.currentPlan);
                
                return (
                  <div
                    key={plan.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-900">{plan.name[lang]}</h3>
                      <span className={`text-lg font-bold ${plan.id === "business" ? "text-violet-600" : "text-green-600"}`}>
                        {plan.price}<span className="text-sm font-normal">{plan.period[lang]}</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{plan.description[lang]}</p>
                    
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={processingUpgrade}
                      className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isUpgrade
                          ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {processingUpgrade ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                          {t.loading}
                        </div>
                      ) : (
                        <>
                          {isUpgrade ? (
                            plan.id === "pro" ? t.upgradeToPro : t.upgradeToBusiness
                          ) : (
                            t.downgrade
                          )}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Payment Method */}
          {subscription.paymentMethod && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900 mb-4">{t.paymentMethod}</h2>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="h-5 w-5 text-slate-600" />
                <span className="text-sm text-slate-700">
                  {subscription.paymentMethod.type} ending in {subscription.paymentMethod.last4}
                </span>
              </div>
              <button className="text-sm font-medium text-green-600 hover:text-green-700">
                {t.managePayment}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  title,
  icon,
  current,
  limit,
  unlimited,
  t,
}: {
  title: string;
  icon: React.ReactNode;
  current: number;
  limit: number;
  unlimited: boolean;
  t: any;
}) {
  const percentage = unlimited ? 0 : (current / limit) * 100;
  const isNearLimit = percentage > 80;
  
  return (
    <div className="p-4 rounded-lg bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-600">{icon}</span>
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      </div>
      
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-slate-900">{current}</span>
        {!unlimited && (
          <span className="text-sm text-slate-600">
            {t.of} {limit}
          </span>
        )}
        {unlimited && (
          <span className="text-sm text-slate-600">{t.unlimited}</span>
        )}
      </div>
      
      {!unlimited && (
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isNearLimit ? "bg-orange-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

function getOrderValue(plan: PlanId): number {
  const order = { free: 0, pro: 1, business: 2 };
  return order[plan];
}