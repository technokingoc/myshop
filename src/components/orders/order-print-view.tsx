"use client";

import { useEffect } from "react";
import { OrderTimeline } from "./order-timeline";
import type { OrderItem } from "./types";

type Props = {
  order: OrderItem;
  sellerInfo?: {
    name: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  t: Record<string, string>;
  type?: "invoice" | "packing-slip";
};

export function OrderPrintView({ order, sellerInfo, t, type = "invoice" }: Props) {
  const isPacking = type === "packing-slip";

  useEffect(() => {
    // Load print styles
    if (typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/styles/print.css";
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-preview">
      {/* Screen-only controls */}
      <div className="no-print mb-6 flex justify-between items-center bg-slate-100 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isPacking ? (t.packingSlip || "Packing Slip") : (t.orderInvoice || "Order Invoice")}
          </h2>
          <p className="text-sm text-slate-600">Order #{order.id}</p>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t.print || "Print"}
        </button>
      </div>

      {/* Print content */}
      <div className={`print-content ${isPacking ? "packing-slip" : ""}`}>
        {/* Header */}
        <div className="print-header">
          <div>
            <h1>
              {isPacking ? (t.packingSlip || "Packing Slip") : (t.orderInvoice || "Order Invoice")}
            </h1>
            <div className="order-number">#{order.id}</div>
          </div>
          {sellerInfo?.logoUrl && (
            <img src={sellerInfo.logoUrl} alt="Logo" className="print-logo" />
          )}
        </div>

        {/* Order info */}
        <div className="print-order-info">
          <div className="print-section">
            <h3>{t.orderDetails || "Order Details"}</h3>
            <p><span className="label">{t.orderNumber || "Order #"}:</span> <span className="value">ORD-{order.id}</span></p>
            <p><span className="label">{t.orderDate || "Date"}:</span> <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span></p>
            <p><span className="label">{t.status || "Status"}:</span> <span className="print-status">{t[order.status] || order.status}</span></p>
            <div className="print-tracking">
              <p style={{ fontSize: '9pt', margin: '0 0 4pt 0' }}>{t.trackingCode || "Tracking Code"}</p>
              <div className="print-tracking-code">ORD-{order.id}</div>
              <div className="print-qr-placeholder">QR</div>
            </div>
          </div>

          <div className="print-section">
            <h3>{t.customerInfo || "Customer Information"}</h3>
            <p><span className="label">{t.name || "Name"}:</span> <span className="value">{order.customerName}</span></p>
            <p><span className="label">{t.contact || "Contact"}:</span> <span className="value">{order.customerContact}</span></p>
            {order.message && (
              <p><span className="label">{t.message || "Message"}:</span> <span className="value">{order.message}</span></p>
            )}
          </div>
        </div>

        {sellerInfo && (
          <div className="print-order-info">
            <div className="print-section">
              <h3>{t.sellerInfo || "Seller Information"}</h3>
              <p><span className="value">{sellerInfo.name}</span></p>
              {sellerInfo.address && <p>{sellerInfo.address}</p>}
              {sellerInfo.phone && <p><span className="label">{t.phone || "Phone"}:</span> {sellerInfo.phone}</p>}
              {sellerInfo.email && <p><span className="label">{t.email || "Email"}:</span> {sellerInfo.email}</p>}
            </div>
          </div>
        )}

        {/* Items table */}
        <table className="print-items-table">
          <thead>
            <tr>
              <th>{t.item || "Item"}</th>
              <th className="qty-col">{t.qty || "Qty"}</th>
              {!isPacking && <th className="price-col">{t.price || "Price"}</th>}
              {!isPacking && <th className="price-col">{t.total || "Total"}</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {order.itemName || t.customOrder || "Custom Order"}
                {order.itemType && (
                  <div style={{ fontSize: '9pt', color: '#666', marginTop: '2pt' }}>
                    {order.itemType}
                  </div>
                )}
              </td>
              <td className="qty-col">1</td>
              {!isPacking && <td className="price-col">${order.itemPrice || "0.00"}</td>}
              {!isPacking && <td className="price-col">${order.itemPrice || "0.00"}</td>}
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        {!isPacking && order.itemPrice && (
          <div className="print-totals">
            <div className="total-row">
              <span>{t.subtotal || "Subtotal"}:</span>
              <span>${order.itemPrice}</span>
            </div>
            <div className="total-row grand-total">
              <span>{t.total || "Total"}:</span>
              <span>${order.itemPrice}</span>
            </div>
          </div>
        )}

        {/* Timeline for invoice */}
        {!isPacking && order.statusHistory && order.statusHistory.length > 0 && (
          <div className="print-section" style={{ marginTop: '20pt' }}>
            <h3>{t.orderTimeline || "Order Timeline"}</h3>
            <div className="print-timeline">
              {order.statusHistory.map((entry, index) => (
                <div key={index} className="print-timeline-item">
                  <div className="print-timeline-date">
                    {new Date(entry.at).toLocaleDateString()}
                  </div>
                  <div className="print-timeline-status">
                    {t[entry.status] || entry.status}
                    {entry.note && (
                      <span className="print-timeline-note"> — {entry.note}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="print-notes">
            <h4>{t.notes || "Notes"}</h4>
            <p>{order.notes}</p>
          </div>
        )}

        {/* Signature for packing slip */}
        {isPacking && (
          <div className="print-signature">
            <p>
              {t.receivedBy || "Received by"}: <span className="print-signature-line"></span> 
              {t.date || "Date"}: <span className="print-signature-line"></span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <p>
            {sellerInfo?.name && `${sellerInfo.name} • `}
            {t.printedOn || "Printed on"} {new Date().toLocaleString()}
            {order.id && ` • Order #${order.id}`}
          </p>
        </div>
      </div>
    </div>
  );
}