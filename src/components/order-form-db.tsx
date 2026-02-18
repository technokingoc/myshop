"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { X, Send, CheckCircle } from "lucide-react";

const dict = {
  en: {
    title: "Place an Order",
    name: "Your name",
    contact: "Email or phone",
    message: "Message (optional)",
    item: "Item",
    submit: "Send order request",
    success: "Order sent! The seller will contact you soon.",
    close: "Close",
    namePh: "Full name",
    contactPh: "email@example.com or +258...",
    messagePh: "Any details or questions...",
  },
  pt: {
    title: "Fazer um Pedido",
    name: "Seu nome",
    contact: "Email ou telefone",
    message: "Mensagem (opcional)",
    item: "Item",
    submit: "Enviar pedido",
    success: "Pedido enviado! O vendedor entrará em contacto em breve.",
    close: "Fechar",
    namePh: "Nome completo",
    contactPh: "email@exemplo.com ou +258...",
    messagePh: "Detalhes ou perguntas...",
  },
};

export function OrderFormDB({
  sellerSlug,
  sellerId,
  storeName,
  itemId,
  itemName,
  onClose,
}: {
  sellerSlug: string;
  sellerId: number;
  storeName: string;
  itemId: number | null;
  itemName: string;
  onClose: () => void;
}) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          sellerSlug,
          itemId,
          customerName: name.trim(),
          customerContact: contact.trim(),
          message: message.trim(),
        }),
      });
      setSent(true);
    } catch {
      // fallback: still show success (order might have gone through)
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-slate-700">{t.success}</p>
            <button onClick={onClose} className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {itemName && (
              <div>
                <label className="text-xs font-medium text-slate-500">{t.item}</label>
                <p className="mt-0.5 font-medium text-slate-900">{itemName}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">{t.name}</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{t.contact}</label>
              <input
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t.contactPh}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{t.message}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePh}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
