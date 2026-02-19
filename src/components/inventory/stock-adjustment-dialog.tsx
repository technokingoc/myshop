"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { X, Plus, Minus, Package, AlertCircle } from "lucide-react";

type StockChangeType = 'adjustment' | 'sale' | 'restock' | 'return' | 'damage' | 'transfer';

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    type: 'product' | 'variant';
    variantName?: string;
    currentStock: number;
    sku?: string;
  };
  onSuccess: () => void;
}

const dict = {
  en: {
    title: "Adjust Stock",
    currentStock: "Current Stock",
    newStock: "New Stock",
    quantity: "Quantity",
    changeType: "Change Type",
    reason: "Reason",
    notes: "Notes (optional)",
    cancel: "Cancel",
    save: "Save Changes",
    increase: "Increase",
    decrease: "Decrease",
    setAmount: "Set Amount",
    adjustment: "Adjustment",
    sale: "Sale",
    restock: "Restock",
    return: "Return",
    damage: "Damage",
    transfer: "Transfer",
    reasonPlaceholder: "Enter reason for stock change...",
    notesPlaceholder: "Additional notes...",
    invalidQuantity: "Please enter a valid quantity",
    reasonRequired: "Reason is required",
    adjusting: "Adjusting...",
    product: "Product",
    variant: "Variant",
  },
  pt: {
    title: "Ajustar Estoque",
    currentStock: "Estoque Atual",
    newStock: "Novo Estoque",
    quantity: "Quantidade",
    changeType: "Tipo de Mudança",
    reason: "Motivo",
    notes: "Notas (opcional)",
    cancel: "Cancelar",
    save: "Salvar Mudanças",
    increase: "Aumentar",
    decrease: "Diminuir",
    setAmount: "Definir Quantidade",
    adjustment: "Ajuste",
    sale: "Venda",
    restock: "Reposição",
    return: "Devolução",
    damage: "Dano",
    transfer: "Transferência",
    reasonPlaceholder: "Digite o motivo da mudança de estoque...",
    notesPlaceholder: "Notas adicionais...",
    invalidQuantity: "Digite uma quantidade válida",
    reasonRequired: "Motivo é obrigatório",
    adjusting: "Ajustando...",
    product: "Produto",
    variant: "Variante",
  },
};

export function StockAdjustmentDialog({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess 
}: StockAdjustmentDialogProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [adjustmentMode, setAdjustmentMode] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [quantity, setQuantity] = useState<string>('');
  const [changeType, setChangeType] = useState<StockChangeType>('adjustment');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateNewStock = () => {
    const qty = parseInt(quantity) || 0;
    switch (adjustmentMode) {
      case 'increase':
        return product.currentStock + qty;
      case 'decrease':
        return Math.max(0, product.currentStock - qty);
      case 'set':
        return Math.max(0, qty);
      default:
        return product.currentStock;
    }
  };

  const calculateQuantityChange = () => {
    const newStock = calculateNewStock();
    return newStock - product.currentStock;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    if (!qty || qty < 0) {
      setError(t.invalidQuantity);
      return;
    }

    if (!reason.trim()) {
      setError(t.reasonRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quantityChange = calculateQuantityChange();
      
      if (quantityChange === 0) {
        onClose();
        return;
      }

      const response = await fetch('/api/inventory/adjust-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.type === 'product' ? product.id : undefined,
          variantId: product.type === 'variant' ? product.id : undefined,
          quantityChange,
          changeType,
          reason,
          notes,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuantity('');
    setReason('');
    setNotes('');
    setAdjustmentMode('increase');
    setChangeType('adjustment');
    setError('');
  };

  if (!isOpen) return null;

  const newStock = calculateNewStock();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{product.name}</h3>
                {product.variantName && (
                  <p className="text-sm text-slate-600">{product.variantName}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded-full">
                    {product.type === 'product' ? t.product : t.variant}
                  </span>
                  {product.sku && (
                    <span className="font-mono">SKU: {product.sku}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stock Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm text-green-600 font-medium">{t.currentStock}</p>
              <p className="text-2xl font-bold text-green-900">{product.currentStock}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm text-green-600 font-medium">{t.newStock}</p>
              <p className="text-2xl font-bold text-green-900">{newStock}</p>
            </div>
          </div>

          {/* Adjustment Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Adjustment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'increase', label: t.increase, icon: Plus },
                { id: 'decrease', label: t.decrease, icon: Minus },
                { id: 'set', label: t.setAmount, icon: Package },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAdjustmentMode(id as any)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    adjustmentMode === id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-2">
              {t.quantity}
            </label>
            <input
              type="number"
              id="quantity"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={adjustmentMode === 'set' ? newStock.toString() : '0'}
            />
          </div>

          {/* Change Type */}
          <div>
            <label htmlFor="changeType" className="block text-sm font-medium text-slate-700 mb-2">
              {t.changeType}
            </label>
            <select
              id="changeType"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as StockChangeType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="adjustment">{t.adjustment}</option>
              <option value="sale">{t.sale}</option>
              <option value="restock">{t.restock}</option>
              <option value="return">{t.return}</option>
              <option value="damage">{t.damage}</option>
              <option value="transfer">{t.transfer}</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">
              {t.reason} *
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t.reasonPlaceholder}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              {t.notes}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t.notesPlaceholder}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.adjusting : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}