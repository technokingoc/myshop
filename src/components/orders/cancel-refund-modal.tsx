"use client";

import { useState } from "react";
import { X, AlertTriangle, RefreshCw } from "lucide-react";
import type { OrderItem } from "./types";

type Props = {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: "cancel" | "refund", reason: string, refundAmount?: number) => Promise<void>;
  t: Record<string, string>;
};

const cancelReasons = [
  "customer_request",
  "out_of_stock", 
  "payment_failed",
  "shipping_issues",
  "seller_unavailable",
  "other"
];

const refundReasons = [
  "customer_request",
  "defective_product",
  "wrong_item",
  "not_as_described",
  "shipping_damage",
  "other"
];

export function CancelRefundModal({ order, isOpen, onClose, onConfirm, t }: Props) {
  const [action, setAction] = useState<"cancel" | "refund">("cancel");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const finalReason = reason === "other" ? customReason : reason;
    if (!finalReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(action, finalReason, action === "refund" ? refundAmount : undefined);
      onClose();
      // Reset form
      setReason("");
      setCustomReason("");
      setRefundAmount(undefined);
    } catch (error) {
      console.error("Cancel/refund error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCancel = ["new", "contacted", "processing"].includes(order.status);
  const canRefund = ["completed", "shipped"].includes(order.status);

  // Auto-select appropriate action based on order status
  if (canCancel && !canRefund && action === "refund") {
    setAction("cancel");
  } else if (canRefund && !canCancel && action === "cancel") {
    setAction("refund");
  }

  const reasons = action === "cancel" ? cancelReasons : refundReasons;
  const orderAmount = parseFloat(order.itemPrice || "0");

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {action === "cancel" ? (t.cancelOrder || "Cancel Order") : (t.processRefund || "Process Refund")}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Order info */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-900">Order #{order.id}</p>
            <p className="text-sm text-slate-600">{order.customerName}</p>
            <p className="text-sm text-slate-600">{order.itemName}</p>
            {order.itemPrice && (
              <p className="text-sm font-medium text-slate-900">${order.itemPrice}</p>
            )}
          </div>

          {/* Action selector */}
          {canCancel && canRefund && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.selectAction || "Select Action"}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction("cancel")}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    action === "cancel"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setAction("refund")}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    action === "refund"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.refund || "Refund"}
                </button>
              </div>
            </div>
          )}

          {/* Reason selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {action === "cancel" ? (t.cancelReason || "Cancellation Reason") : (t.refundReason || "Refund Reason")}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">{t.selectReason || "Select a reason..."}</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {t[`reason_${r}`] || r.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Custom reason input */}
          {reason === "other" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.customReason || "Custom Reason"}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t.customReasonPlaceholder || "Please explain the reason..."}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>
          )}

          {/* Refund amount */}
          {action === "refund" && orderAmount > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t.refundAmount || "Refund Amount"}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  max={orderAmount}
                  step="0.01"
                  value={refundAmount || ""}
                  onChange={(e) => setRefundAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={orderAmount.toString()}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setRefundAmount(orderAmount)}
                  className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  {t.fullAmount || "Full Amount"}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {t.refundAmountNote || "Leave blank for full refund"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {t.cancel_action || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || (reason === "other" && !customReason.trim())}
              className={`flex-1 py-2 px-4 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                action === "cancel" 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t.processing || "Processing..."}
                </div>
              ) : (
                action === "cancel" ? (t.confirmCancel || "Confirm Cancel") : (t.confirmRefund || "Confirm Refund")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}