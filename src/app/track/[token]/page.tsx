"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/language";

type Tracking = {
  token: string;
  orderId: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  itemName: string;
  sellerName: string;
  customerName: string;
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
  },
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

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
      {loading ? (
        <p className="mt-3 text-slate-600">{t.loading}</p>
      ) : !data ? (
        <p className="mt-3 text-slate-600">{t.notFound}</p>
      ) : (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">#{data.token}</p>
          <div className="mt-3 grid gap-2 text-sm">
            <p><span className="font-medium">{t.order}:</span> {data.orderStatus}</p>
            <p><span className="font-medium">{t.payment}:</span> {data.paymentStatus}</p>
            <p><span className="font-medium">{t.seller}:</span> {data.sellerName}</p>
            <p><span className="font-medium">{t.item}:</span> {data.itemName}</p>
            <p><span className="font-medium">{t.created}:</span> {new Date(data.createdAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </main>
  );
}
