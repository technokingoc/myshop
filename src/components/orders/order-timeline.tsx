"use client";

import { Clock, Phone, Package, Truck, CheckCircle, Ban, Circle } from "lucide-react";
import type { OrderStatus } from "./types";

const statusIcons: Record<string, typeof Clock> = {
  placed: Clock,
  confirmed: Phone,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: Ban,
  // Legacy mappings for backward compatibility
  new: Clock,
  contacted: Phone,
  completed: CheckCircle,
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  placed: { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500" },
  confirmed: { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" },
  processing: { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-500" },
  shipped: { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-500" },
  delivered: { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500" },
  cancelled: { bg: "bg-red-500", text: "text-red-700", border: "border-red-500" },
  // Legacy mappings for backward compatibility
  new: { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-500" },
  contacted: { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" },
  completed: { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500" },
};

const FLOW_STEPS: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered"];

type StatusHistoryEntry = { status: string; at: string; note?: string };

type Props = {
  currentStatus: OrderStatus;
  statusHistory?: StatusHistoryEntry[];
  t: Record<string, string>;
  variant?: "stepper" | "timeline";
};

export function OrderTimeline({ currentStatus, statusHistory = [], t, variant = "stepper" }: Props) {
  const currentStepIndex = FLOW_STEPS.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (variant === "stepper") {
    return (
      <div className="w-full">
        {isCancelled ? (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
              <Ban className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">{t.cancelled || "Cancelled"}</p>
                <p className="text-sm text-red-600">
                  {statusHistory.find(h => h.status === "cancelled")?.note || t.orderCancelled || "This order has been cancelled"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Desktop stepper */}
            <div className="hidden md:flex items-center justify-between">
              {FLOW_STEPS.map((step, index) => {
                const Icon = statusIcons[step];
                const colors = statusColors[step];
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`relative h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCurrent 
                          ? `${colors.bg} text-white ${colors.border} shadow-lg ring-4 ring-opacity-20 ring-current scale-110`
                          : isCompleted
                          ? `${colors.bg} text-white ${colors.border}`
                          : isActive
                          ? `bg-white ${colors.text} ${colors.border}`
                          : "bg-slate-100 text-slate-400 border-slate-300"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                        {isCurrent && (
                          <div className="absolute inset-0 rounded-full animate-pulse bg-current opacity-25" />
                        )}
                      </div>
                      
                      <p className={`mt-2 text-xs text-center font-medium leading-tight ${
                        isCurrent ? "text-slate-900" 
                        : isActive ? "text-slate-700" 
                        : "text-slate-400"
                      }`}>
                        {t[step] || step}
                      </p>
                      
                      {/* Show timestamp for current/completed steps */}
                      {(isActive) && statusHistory.length > 0 && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          {(() => {
                            const entry = statusHistory.find(h => h.status === step);
                            return entry ? new Date(entry.at).toLocaleDateString() : "";
                          })()}
                        </p>
                      )}
                    </div>
                    
                    {/* Connector line */}
                    {index < FLOW_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-3 transition-all duration-300 ${
                        index < currentStepIndex ? colors.bg : "bg-slate-200"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile stepper */}
            <div className="md:hidden space-y-3">
              {FLOW_STEPS.map((step, index) => {
                const Icon = statusIcons[step];
                const colors = statusColors[step];
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCurrent 
                        ? `${colors.bg} text-white ${colors.border} shadow-md`
                        : isCompleted
                        ? `${colors.bg} text-white ${colors.border}`
                        : isActive
                        ? `bg-white ${colors.text} ${colors.border}`
                        : "bg-slate-100 text-slate-400 border-slate-300"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isCurrent ? "text-slate-900" 
                        : isActive ? "text-slate-700" 
                        : "text-slate-400"
                      }`}>
                        {t[step] || step}
                      </p>
                      
                      {(isActive) && statusHistory.length > 0 && (
                        <p className="text-xs text-slate-500">
                          {(() => {
                            const entry = statusHistory.find(h => h.status === step);
                            return entry ? new Date(entry.at).toLocaleString() : "";
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Timeline variant (for detailed history view)
  return (
    <div className="space-y-0">
      {statusHistory.length === 0 ? (
        <div className="text-center py-8">
          <Circle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">{t.noHistory || "No status history yet"}</p>
        </div>
      ) : (
        [...statusHistory].reverse().map((entry, index) => {
          const Icon = statusIcons[entry.status] || Clock;
          const colors = statusColors[entry.status] || statusColors.new;
          const isLast = index === statusHistory.length - 1;
          
          return (
            <div key={`${entry.status}-${entry.at}`} className="flex gap-4 pb-6 relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-4 top-10 w-0.5 h-full bg-gradient-to-b from-slate-300 to-transparent" />
              )}
              
              {/* Icon */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${colors.bg} text-white ${colors.border} shadow-sm z-10`}>
                <Icon className="h-4 w-4" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {t[entry.status] || entry.status}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.at).toLocaleString()}
                  </span>
                </div>
                
                {entry.note && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mt-2 border-l-4 border-slate-200">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}