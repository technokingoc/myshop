"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { Clock, Phone, Package, Truck, CheckCircle, Ban, MessageCircle } from "lucide-react";

type Tracking = {
  token: string;
  orderId: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  itemName: string;
  itemPrice?: string;
  sellerName: string;
  sellerWhatsapp?: string;
  sellerEmail?: string;
  customerName: string;
  statusHistory?: Array<{ status: string; at: string; note?: string }>;
};

const dict = {
  en: {
    title: "Track your order",
    loading: "Loading tracking details...",
    notFound: "Tracking record not found.",
    order: "Order",
    payment: "Payment",
    seller: "Seller",
    item: "Item",
    created: "Created",
    contactSeller: "Contact seller",
    statusLabels: {
      new: "Order Received",
      contacted: "Seller Contacted",
      processing: "Processing",
      shipped: "Shipped",
      completed: "Completed",
      cancelled: "Cancelled",
    } as Record<string, string>,
  },
  pt: {
    title: "Acompanhar pedido",
    loading: "A carregar detalhes de rastreio...",
    notFound: "Registo de rastreio não encontrado.",
    order: "Pedido",
    payment: "Pagamento",
    seller: "Vendedor",
    item: "Item",
    created: "Criado",
    contactSeller: "Contactar vendedor",
    statusLabels: {
      new: "Pedido Recebido",
      contacted: "Vendedor Contactou",
      processing: "Em Processamento",
      shipped: "Enviado",
      completed: "Concluído",
      cancelled: "Cancelado",
    } as Record<string, string>,
  },
};

const STEPS = ["new", "contacted", "processing", "shipped", "completed"];
const stepIcons = [Clock, Phone, Package, Truck, CheckCircle];

const statusBg: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  processing: "bg-orange-500",
  shipped: "bg-purple-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export default function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/track/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => setData(row))
      .finally(() => setLoading(false));
  }, [token]);

  const currentStepIdx = data ? STEPS.indexOf(data.orderStatus) : -1;
  const isCancelled = data?.orderStatus === "cancelled";

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
      {loading ? (
        <p className="mt-3 text-slate-600">{t.loading}</p>
      ) : !data ? (
        <p className="mt-3 text-slate-600">{t.notFound}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Status stepper */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500 mb-4">#{data.token}</p>

            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                <Ban className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-700">{t.statusLabels.cancelled}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {STEPS.map((step, idx) => {
                  const Icon = stepIcons[idx];
                  const isActive = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div key={step} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent ? `${statusBg[step]} text-white ring-4 ring-opacity-20 ring-current` :
                          isActive ? `${statusBg[step]} text-white` :
                          "bg-slate-100 text-slate-400"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className={`mt-1.5 text-[10px] sm:text-xs text-center leading-tight ${isCurrent ? "font-semibold text-slate-900" : isActive ? "text-slate-700" : "text-slate-400"}`}>
                          {t.statusLabels[step] || step}
                        </p>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${idx < currentStepIdx ? "bg-emerald-400" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order details */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.item}</span>
                <span className="font-medium text-slate-900">{data.itemName}</span>
              </div>
              {data.itemPrice && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-medium text-slate-900">{data.itemPrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t.seller}</span>
                <span className="font-medium text-slate-900">{data.sellerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.payment}</span>
                <span className="font-medium text-slate-900 capitalize">{data.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.created}</span>
                <span className="font-medium text-slate-900">{new Date(data.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Contact seller */}
          {(data.sellerWhatsapp || data.sellerEmail) && (
            <div className="flex gap-2">
              {data.sellerWhatsapp && (
                <a href={`https://wa.me/${data.sellerWhatsapp.replace(/[^\d+]/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100">
                  <MessageCircle className="h-4 w-4" /> {t.contactSeller}
                </a>
              )}
            </div>
          )}

          {/* Timeline history */}
          {data.statusHistory && data.statusHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">{lang === "en" ? "Timeline" : "Linha do tempo"}</h3>
              <div className="space-y-0">
                {[...data.statusHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex gap-3 pb-3">
                    <div className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${statusBg[entry.status] || "bg-slate-300"}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.statusLabels[entry.status] || entry.status}</p>
                      {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
                      <p className="text-xs text-slate-400">{new Date(entry.at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
