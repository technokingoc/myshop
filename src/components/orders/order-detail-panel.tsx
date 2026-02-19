"use client";

import { useState, useEffect } from "react";
import { X, Clock, Phone, Package, Truck, CheckCircle, Ban, MessageCircle, Mail, Printer, RefreshCw } from "lucide-react";
import type { OrderItem, OrderStatus } from "./types";
import { STATUS_FLOW, statusColorMap } from "./types";
import { PackingSlip } from "./packing-slip";
import { RefundFlow } from "./refund-flow";

const statusIcons: Record<string, typeof Clock> = {
  placed: Clock, confirmed: Phone, processing: Package, shipped: Truck, delivered: CheckCircle, cancelled: Ban,
  // Legacy mappings
  new: Clock, contacted: Phone, completed: CheckCircle,
};

type PaymentState = "pending" | "paid" | "failed" | "manual";

type Props = {
  order: OrderItem;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus, note?: string) => void;
  onAddNote: (id: string, note: string) => void;
  onRefund?: (orderId: string, amount: string, reason: string, note: string) => Promise<void>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  t: Record<string, string>;
  sellerId?: number | null;
  sellerInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  language?: "en" | "pt";
};

export function OrderDetailPanel({ order, onClose, onStatusChange, onAddNote, onRefund, onCancel, t, sellerId, sellerInfo, language = "en" }: Props) {
  const [tab, setTab] = useState<"details" | "timeline" | "notes">("details");
  const [noteText, setNoteText] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentState>("pending");
  const [paymentLink, setPaymentLink] = useState("");
  const [showRefundFlow, setShowRefundFlow] = useState(false);
  const [showPackingSlip, setShowPackingSlip] = useState(false);

  useEffect(() => {
    fetch(`/api/payments/status?orderId=${order.id}`)
      .then(r => r.ok ? r.json() : { status: "pending" })
      .then(p => { setPaymentStatus((p?.status || "pending") as PaymentState); setPaymentLink(p?.externalUrl || ""); })
      .catch(() => { setPaymentStatus("pending"); setPaymentLink(""); });
  }, [order.id]);

  const updatePayment = async (status: PaymentState) => {
    if (!sellerId) return;
    await fetch("/api/payments/status", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: Number(order.id), sellerId, status, externalUrl: paymentLink || undefined }),
    }).catch(() => null);
    setPaymentStatus(status);
  };

  const handlePrint = () => {
    setShowPackingSlip(true);
    // Allow time for the packing slip to render, then print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleRefund = async (orderId: string, amount: string, reason: string, note: string) => {
    if (onRefund) {
      await onRefund(orderId, amount, reason, note);
    }
    setShowRefundFlow(false);
  };

  const handleCancel = async (orderId: string, reason: string) => {
    if (onCancel) {
      await onCancel(orderId, reason);
    } else {
      // Fallback to status change
      onStatusChange(orderId, "cancelled", reason);
    }
    setShowRefundFlow(false);
  };

  const isEmail = order.customerContact.includes("@");
  const isPhone = /[\d+]/.test(order.customerContact) && !isEmail;
  const colors = statusColorMap[order.status] || statusColorMap.new;
  const Icon = statusIcons[order.status] || Clock;

  const tabs = [
    { key: "details" as const, label: t.details || "Details" },
    { key: "timeline" as const, label: t.timeline || "Timeline" },
    { key: "notes" as const, label: t.notes || "Notes" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40" onClick={onClose}>
      {/* Panel - full screen on mobile, slide-out on desktop */}
      <div className="ml-auto h-full w-full sm:max-w-lg overflow-y-auto bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-500">ORD-{order.id}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.badge}`}>
                <Icon className="h-3 w-3" />{t[order.status] || order.status}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrint} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title={t.printPackingSlip || "Print packing slip"}>
                <Printer className="h-4 w-4" />
              </button>
              {(onRefund || onCancel) && order.status !== "cancelled" && (
                <button onClick={() => setShowRefundFlow(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title={t.refundCancel || "Refund/Cancel"}>
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Status change */}
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className={`w-full rounded-lg border-0 px-3 py-1.5 text-sm font-medium ${colors.bg} ${colors.text}`}>
              {STATUS_FLOW.filter(s => {
                const currentIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
                const statusIndex = STATUS_FLOW.indexOf(s);
                return statusIndex >= currentIndex; // Only allow forward progression
              }).map(s => <option key={s} value={s}>{t[s] || s}</option>)}
              <option value="cancelled">{t.cancelled || "Cancelled"}</option>
            </select>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex-1 px-3 py-2.5 text-sm font-medium transition ${tab === tb.key ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "details" && (
            <div className="space-y-4">
              {/* Customer */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{order.customerName}</p>
                <p className="text-sm text-slate-600">{order.customerContact}</p>
                {order.message && <p className="mt-2 text-sm text-slate-600 italic">&ldquo;{order.message}&rdquo;</p>}
              </div>

              {/* Contact buttons */}
              <div className="flex gap-2">
                {isPhone && (
                  <a href={`https://wa.me/${order.customerContact.replace(/[^\d+]/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                {isEmail && (
                  <a href={`mailto:${order.customerContact}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
              </div>

              {/* Item */}
              {order.itemName && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-800">{order.itemName}</p>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    {order.itemType && <span>{order.itemType}</span>}
                    {order.itemPrice && <span className="font-semibold text-slate-700">${order.itemPrice}</span>}
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{t.paymentStatus || "Payment status"}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(["pending", "paid", "failed", "manual"] as PaymentState[]).map(s => (
                    <button key={s} onClick={() => updatePayment(s)}
                      className={`rounded-full border px-2.5 py-1 text-xs capitalize ${paymentStatus === s ? "border-green-300 bg-green-50 text-green-700" : "border-slate-300 text-slate-600"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="External payment link (optional)" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs" />
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div>
              {(!order.statusHistory || order.statusHistory.length === 0) ? (
                <p className="text-sm text-slate-500 py-6 text-center">{t.noTimeline || "No status history yet."}</p>
              ) : (
                <div className="space-y-0">
                  {order.statusHistory.map((entry, idx) => {
                    const EntryIcon = statusIcons[entry.status] || Clock;
                    const entryColors = statusColorMap[entry.status] || statusColorMap.new;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${entryColors.badge}`}>
                            <EntryIcon className="h-3.5 w-3.5" />
                          </div>
                          {idx < order.statusHistory!.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-0.5" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-slate-700">{t[entry.status] || entry.status}</p>
                          {entry.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(entry.at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              {/* Existing notes from history */}
              {order.statusHistory?.filter(e => e.note).map((entry, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-sm text-slate-700">{entry.note}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(entry.at).toLocaleString()} — {t[entry.status] || entry.status}</p>
                </div>
              ))}
              {order.notes && !order.statusHistory?.some(e => e.note) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
              {/* Add note form */}
              <div className="sticky bottom-0 bg-white pt-2">
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t.notePlaceholder} rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none" />
                <button onClick={() => { if (noteText.trim()) { onAddNote(order.id, noteText.trim()); setNoteText(""); } }}
                  disabled={!noteText.trim()}
                  className="mt-1.5 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {t.addNote || "Add note"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Packing Slip */}
      {showPackingSlip && (
        <PackingSlip 
          order={order} 
          sellerInfo={sellerInfo} 
          t={t} 
          language={language} 
        />
      )}

      {/* Refund Flow */}
      {showRefundFlow && (
        <RefundFlow
          order={order}
          onRefund={handleRefund}
          onCancel={handleCancel}
          onClose={() => setShowRefundFlow(false)}
          t={t}
          language={language}
        />
      )}
    </div>
  );
}
