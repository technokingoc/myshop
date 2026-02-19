"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(
    () => ({
      toast: {
        success: (message: string) => push("success", message),
        error: (message: string) => push("error", message),
        info: (message: string) => push("info", message),
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => setToasts((prev) => prev.filter((t) => t.id !== item.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onClose }: { item: Toast; onClose: () => void }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-green-200 bg-green-50 text-green-900",
  } as const;

  const Icon = item.type === "success" ? CheckCircle2 : item.type === "error" ? AlertCircle : Info;

  return (
    <div className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm ${styles[item.type]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{item.message}</p>
      <button onClick={onClose} className="rounded p-0.5 hover:bg-black/5" aria-label="Close toast">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context.toast;
}
