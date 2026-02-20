"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { Clock, Phone, Package, Truck, CheckCircle, Ban, MessageCircle, ExternalLink } from "lucide-react";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { DeliveryConfirmation } from "@/components/orders/delivery-confirmation";
import { useToast } from "@/components/toast-provider";
import type { OrderStatus } from "@/components/orders/types";

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
  trackingNumber?: string;
  trackingProvider?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveryConfirmed?: boolean;
  deliveryConfirmedAt?: string;
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
    estimatedDelivery: "Estimated delivery",
    orderTimeline: "Order timeline",
    statusLabels: {
      placed: "Order Placed",
      confirmed: "Order Confirmed", 
      preparing: "Preparing",
      processing: "Processing",
      shipped: "Shipped",
      "in-transit": "In Transit",
      delivered: "Delivered",
      cancelled: "Cancelled",
      // Legacy status labels
      new: "Order Placed",
      contacted: "Order Confirmed",
      completed: "Delivered",
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
    estimatedDelivery: "Entrega estimada",
    orderTimeline: "Linha do tempo",
    statusLabels: {
      placed: "Pedido Feito",
      confirmed: "Pedido Confirmado",
      preparing: "Preparando",
      processing: "Em Processamento",
      shipped: "Enviado",
      "in-transit": "Em Trânsito",
      delivered: "Entregue",
      cancelled: "Cancelado",
      // Legacy status labels  
      new: "Pedido Feito",
      contacted: "Pedido Confirmado",
      completed: "Entregue",
    } as Record<string, string>,
  },
};

const STEPS = ["placed", "confirmed", "preparing", "shipped", "in-transit", "delivered"];
const stepIcons = [Clock, CheckCircle, Package, Truck, CheckCircle];

// Function to map status strings to OrderStatus type (handles legacy mappings)
const mapToOrderStatus = (status: string): OrderStatus => {
  const statusMap: Record<string, OrderStatus> = {
    // Current status types
    placed: "placed",
    confirmed: "confirmed", 
    processing: "processing",
    shipped: "shipped",
    delivered: "delivered",
    cancelled: "cancelled",
    // Legacy mappings
    new: "placed",
    contacted: "confirmed",
    completed: "delivered",
  };
  return statusMap[status] || "placed";
};

const statusBg: Record<string, string> = {
  placed: "bg-slate-500",
  confirmed: "bg-green-500",
  preparing: "bg-blue-500",
  processing: "bg-amber-500", 
  shipped: "bg-purple-500",
  "in-transit": "bg-indigo-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-red-500",
  // Legacy status mappings
  new: "bg-slate-500",
  contacted: "bg-green-500",
  completed: "bg-emerald-500",
};

export default function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const toast = useToast();
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/track/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        setData(row);
        // Show delivery confirmation for delivered orders that haven't been confirmed yet
        if (row && row.orderStatus === 'delivered' && !row.deliveryConfirmed) {
          setShowDeliveryConfirmation(true);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleDeliveryConfirmation = async (confirmationData: {
    confirmed: boolean;
    photos?: string[];
    notes?: string;
    deliveryRating?: number;
    sellerRating?: number;
    deliveredBy?: string;
    deliveryLocation?: string;
  }) => {
    try {
      const response = await fetch(`/api/orders/track/${token}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmationData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit confirmation');
      }

      // Update local state
      setData(prev => prev ? {
        ...prev,
        deliveryConfirmed: true,
        deliveryConfirmedAt: new Date().toISOString(),
      } : null);
      
      setShowDeliveryConfirmation(false);
      
    } catch (error) {
      console.error('Delivery confirmation error:', error);
      throw error; // Let the component handle the error
    }
  };

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
            <OrderTimeline
              currentStatus={mapToOrderStatus(data.orderStatus)}
              statusHistory={data.statusHistory}
              t={Object.fromEntries(Object.entries(t.statusLabels).map(([k, v]) => [k, v]))}
              variant="stepper"
            />
          </div>

          {/* Tracking Information */}
          {data.trackingNumber && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t.trackingInfo || "Tracking Information"}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t.trackingNumber || "Tracking Number"}</span>
                  <span className="text-sm font-mono font-medium text-slate-900">{data.trackingNumber}</span>
                </div>
                
                {data.trackingProvider && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{t.carrier || "Carrier"}</span>
                    <span className="text-sm font-medium text-slate-900">{data.trackingProvider}</span>
                  </div>
                )}
                
                {data.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{t.estimatedDelivery || "Estimated Delivery"}</span>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(data.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {data.trackingUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <a 
                      href={data.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t.trackPackage || "Track Package"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Confirmation */}
          {showDeliveryConfirmation && data && (
            <DeliveryConfirmation
              orderId={String(data.orderId)}
              customerName={data.customerName}
              onConfirm={handleDeliveryConfirmation}
              t={t}
            />
          )}

          {/* Delivery Confirmed Status */}
          {data.deliveryConfirmed && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {t.deliveryConfirmed || "Delivery Confirmed"}
                  </p>
                  {data.deliveryConfirmedAt && (
                    <p className="text-sm text-green-700">
                      {t.confirmedOn || "Confirmed on"} {new Date(data.deliveryConfirmedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Enhanced Timeline history */}
          {data.statusHistory && data.statusHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.orderTimeline}</h3>
              <div className="space-y-0">
                {[...data.statusHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${statusBg[entry.status] ? statusBg[entry.status] : "bg-slate-300"} text-white`}>
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      {idx < data.statusHistory!.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{t.statusLabels[entry.status] || entry.status}</p>
                      {entry.note && (
                        <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">{new Date(entry.at).toLocaleString()}</p>
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
