"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

const dict = {
  en: {
    unlimited: "Unlimited",
    of: "of",
    usage: "Usage",
    thisMonth: "this month",
    approaching: "Approaching limit",
    exceeded: "Limit exceeded",
    upgradeRecommended: "Upgrade recommended",
    withinLimits: "Within limits",
  },
  pt: {
    unlimited: "Ilimitado",
    of: "de",
    usage: "Uso",
    thisMonth: "este mês",
    approaching: "Próximo do limite",
    exceeded: "Limite excedido",
    upgradeRecommended: "Upgrade recomendado",
    withinLimits: "Dentro dos limites",
  },
};

type UsageMeterProps = {
  title: string;
  icon: React.ReactNode;
  current: number;
  limit: number;
  unlimited?: boolean;
  className?: string;
};

export function UsageMeter({ title, icon, current, limit, unlimited = false, className = "" }: UsageMeterProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isApproaching = percentage > 80 && percentage <= 100;
  const isExceeded = current > limit && !unlimited;
  const isGood = percentage <= 80;
  
  const statusColor = useMemo(() => {
    if (isExceeded) return "text-red-600 bg-red-50 border-red-200";
    if (isApproaching) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  }, [isExceeded, isApproaching]);
  
  const barColor = useMemo(() => {
    if (isExceeded) return "bg-red-500";
    if (isApproaching) return "bg-amber-500";
    return "bg-green-500";
  }, [isExceeded, isApproaching]);
  
  const statusText = useMemo(() => {
    if (isExceeded) return t.exceeded;
    if (isApproaching) return t.approaching;
    return t.withinLimits;
  }, [isExceeded, isApproaching, t]);
  
  const StatusIcon = useMemo(() => {
    if (isExceeded) return AlertTriangle;
    if (isApproaching) return TrendingUp;
    return CheckCircle;
  }, [isExceeded, isApproaching]);
  
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{icon}</span>
          <h3 className="text-sm font-medium text-slate-900">{title}</h3>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${statusColor}`}>
          <StatusIcon className="h-3 w-3" />
          <span>{statusText}</span>
        </div>
      </div>
      
      {/* Usage Numbers */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">{current.toLocaleString()}</span>
          {!unlimited && (
            <span className="text-sm text-slate-600">
              {t.of} {limit.toLocaleString()}
            </span>
          )}
          {unlimited && (
            <span className="text-sm text-slate-600">{t.unlimited}</span>
          )}
        </div>
        <p className="text-xs text-slate-500">{t.usage} {t.thisMonth}</p>
      </div>
      
      {/* Progress Bar */}
      {!unlimited && (
        <div className="space-y-2">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span>{percentage.toFixed(1)}%</span>
            <span>{limit.toLocaleString()}</span>
          </div>
        </div>
      )}
      
      {/* Upgrade Recommendation */}
      {(isApproaching || isExceeded) && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-amber-700 mb-2">{t.upgradeRecommended}</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
          >
            <TrendingUp className="h-3 w-3" />
            Upgrade Plan
          </a>
        </div>
      )}
    </div>
  );
}