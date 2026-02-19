"use client";

import { useState } from "react";
import { AlertTriangle, DollarSign, MessageSquare, RefreshCw } from "lucide-react";
import type { OrderItem } from "./types";

type RefundReason = "customer_request" | "damaged_goods" | "wrong_item" | "not_delivered" | "seller_error" | "other";

type Props = {
  order: OrderItem;
  onRefund: (orderId: string, amount: string, reason: RefundReason, note: string) => Promise<void>;
  onCancel: (orderId: string, reason: string) => Promise<void>;
  onClose: () => void;
  t: Record<string, string>;
  language: "en" | "pt";
};

const refundReasons: Record<RefundReason, { en: string; pt: string }> = {
  customer_request: { en: "Customer requested refund", pt: "Cliente solicitou reembolso" },
  damaged_goods: { en: "Damaged goods", pt: "Mercadoria danificada" },
  wrong_item: { en: "Wrong item sent", pt: "Item errado enviado" },
  not_delivered: { en: "Not delivered", pt: "Não entregue" },
  seller_error: { en: "Seller error", pt: "Erro do vendedor" },
  other: { en: "Other", pt: "Outro" },
};

export function RefundFlow({ order, onRefund, onCancel, onClose, t, language }: Props) {
  const [action, setAction] = useState<"refund" | "cancel" | null>(null);
  const [reason, setReason] = useState<RefundReason>("customer_request");
  const [refundAmount, setRefundAmount] = useState(order.itemPrice || "0");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const isEn = language === "en";

  const handleRefund = async () => {
    if (!refundAmount.trim() || !note.trim()) return;
    
    setProcessing(true);
    try {
      await onRefund(order.id, refundAmount, reason, note);
      onClose();
    } catch (error) {
      console.error("Refund failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!note.trim()) return;
    
    setProcessing(true);
    try {
      await onCancel(order.id, note);
      onClose();
    } catch (error) {
      console.error("Cancel failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (!action) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEn ? "Order Action Required" : "Ação Necessária no Pedido"}
              </h2>
              <p className="text-sm text-slate-600">#{order.id}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setAction("refund")}
              className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
            >
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-slate-900">
                  {isEn ? "Process Refund" : "Processar Reembolso"}
                </p>
                <p className="text-sm text-slate-600">
                  {isEn ? "Refund money to customer" : "Devolver dinheiro ao cliente"}
                </p>
              </div>
            </button>

            <button
              onClick={() => setAction("cancel")}
              className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-left"
            >
              <RefreshCw className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-slate-900">
                  {isEn ? "Cancel Order" : "Cancelar Pedido"}
                </p>
                <p className="text-sm text-slate-600">
                  {isEn ? "Cancel without refund" : "Cancelar sem reembolso"}
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {isEn ? "Close" : "Fechar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            action === "refund" ? "bg-green-100" : "bg-red-100"
          }`}>
            {action === "refund" ? (
              <DollarSign className="h-5 w-5 text-green-600" />
            ) : (
              <RefreshCw className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {action === "refund" 
                ? (isEn ? "Process Refund" : "Processar Reembolso")
                : (isEn ? "Cancel Order" : "Cancelar Pedido")
              }
            </h2>
            <p className="text-sm text-slate-600">#{order.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isEn ? "Reason" : "Motivo"}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RefundReason)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
            >
              {Object.entries(refundReasons).map(([key, labels]) => (
                <option key={key} value={key}>
                  {labels[language]}
                </option>
              ))}
            </select>
          </div>

          {/* Refund Amount */}
          {action === "refund" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {isEn ? "Refund Amount" : "Valor do Reembolso"}
              </label>
              <input
                type="text"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={isEn ? "Enter amount" : "Digite o valor"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                {isEn ? "Original order value:" : "Valor original do pedido:"} {order.itemPrice || "—"}
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isEn ? "Internal Note" : "Nota Interna"} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isEn ? "Add details about this action..." : "Adicione detalhes sobre esta ação..."}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setAction(null)}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {isEn ? "Back" : "Voltar"}
          </button>
          <button
            onClick={action === "refund" ? handleRefund : handleCancel}
            disabled={processing || !note.trim() || (action === "refund" && !refundAmount.trim())}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              action === "refund"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isEn ? "Processing..." : "Processando..."}
              </div>
            ) : action === "refund" ? (
              isEn ? "Process Refund" : "Processar Reembolso"
            ) : (
              isEn ? "Cancel Order" : "Cancelar Pedido"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}