"use client";

import { OrderItem } from "./types";
import { Package, MapPin, Phone, Mail } from "lucide-react";

type Props = {
  order: OrderItem;
  sellerInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  t: Record<string, string>;
  language: "en" | "pt";
};

export function PackingSlip({ order, sellerInfo, t, language }: Props) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "pt" ? "pt-PT" : "en-US");
  };

  return (
    <div className="print-only:block hidden">
      <div className="max-w-2xl mx-auto p-8 bg-white text-black font-sans">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {sellerInfo?.logoUrl ? (
              <img src={sellerInfo.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
            ) : (
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-slate-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">{sellerInfo?.name || "MyShop Seller"}</h1>
              <p className="text-sm text-slate-600">{language === "en" ? "Packing Slip" : "Guia de Remessa"}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">#{order.id}</p>
            <p className="text-sm text-slate-600">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Order Status */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {language === "en" ? "Status" : "Estado"}:
            </span>
            <span className="px-3 py-1 text-sm font-medium bg-slate-200 text-slate-800 rounded-full capitalize">
              {t[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Ship To */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {language === "en" ? "Ship To" : "Entregar A"}
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="font-medium text-slate-900">{order.customerName}</p>
            <p className="text-slate-600 mt-1">{order.customerContact}</p>
            {order.message && (
              <div className="mt-3 p-3 bg-slate-50 rounded border-l-4 border-slate-300">
                <p className="text-xs font-medium text-slate-600 mb-1">
                  {language === "en" ? "Customer Note" : "Nota do Cliente"}:
                </p>
                <p className="text-sm text-slate-700">{order.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            {language === "en" ? "Items" : "Itens"}
          </h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-slate-700">
                <span>{language === "en" ? "Product" : "Produto"}</span>
                <span>{language === "en" ? "Type" : "Tipo"}</span>
                <span className="text-right">{language === "en" ? "Price" : "Preço"}</span>
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <p className="font-medium text-slate-900">{order.itemName || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-600">{order.itemType || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{order.itemPrice || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              {language === "en" ? "Order Notes" : "Notas do Pedido"}
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Seller Contact */}
        {sellerInfo && (sellerInfo.phone || sellerInfo.email || sellerInfo.address) && (
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              {language === "en" ? "Seller Contact" : "Contacto do Vendedor"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {sellerInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{sellerInfo.phone}</span>
                </div>
              )}
              {sellerInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{sellerInfo.email}</span>
                </div>
              )}
              {sellerInfo.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{sellerInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 mt-6 text-center text-xs text-slate-500">
          <p>{language === "en" ? "Thank you for your business!" : "Obrigado pela sua preferência!"}</p>
          <p className="mt-1">
            {language === "en" ? "Generated on" : "Gerado em"} {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}