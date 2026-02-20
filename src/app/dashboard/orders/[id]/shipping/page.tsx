"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { ArrowLeft, Package, User, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";
import { ShippingManagement } from "@/components/orders/shipping-management";
import { OrderTimeline } from "@/components/orders/order-timeline";
import type { OrderItem, OrderStatus } from "@/components/orders/types";

const statusLabels = {
  en: {
    placed: "Order Placed",
    confirmed: "Order Confirmed", 
    preparing: "Preparing",
    shipped: "Shipped",
    "in-transit": "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  },
  pt: {
    placed: "Pedido Feito",
    confirmed: "Pedido Confirmado",
    preparing: "Preparando",
    shipped: "Enviado",
    "in-transit": "Em Trânsito",
    delivered: "Entregue",
    cancelled: "Cancelado",
  },
} as const;

export default function OrderShippingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = getDict(lang).orders as unknown as Record<string, string>;
  const common = getDict(lang).common;
  const toast = useToast();

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<number | null>(null);

  // Load seller ID from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("myshop_seller_id");
    const sellerIdNum = raw ? Number(raw) : null;
    setSellerId(sellerIdNum);
  }, []);

  // Fetch order details
  useEffect(() => {
    if (!sellerId || !id) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await fetchJsonWithRetry<OrderItem>(
          `/api/orders/${id}?sellerId=${sellerId}`, 
          undefined, 
          3, 
          "orders:fetch-single"
        );
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error(t.orderNotFound || 'Order not found');
        router.push('/dashboard/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, sellerId, router, toast, t]);

  const handleUpdateShipping = async (orderId: string, data: {
    trackingNumber?: string;
    trackingProvider?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    status?: string;
  }) => {
    if (!sellerId) return;

    try {
      await fetchJsonWithRetry(`/api/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, ...data }),
      }, 3, 'orders:update-shipping');

      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        ...data,
        status: (data.status as OrderStatus) || prev.status,
      } : null);

    } catch (error) {
      console.error('Failed to update shipping:', error);
      throw error;
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus, note?: string) => {
    if (!sellerId) return;

    try {
      await fetchJsonWithRetry(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      }, 3, 'orders:update-status');

      const historyEntry = { status, at: new Date().toISOString(), note };
      
      setOrder(prev => prev ? {
        ...prev,
        status,
        statusHistory: [...(prev.statusHistory || []), historyEntry]
      } : null);

      toast.success(t.statusUpdated || 'Status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t.statusUpdateFailed || 'Failed to update status');
    }
  };

  const statusLabelsForLang = statusLabels[lang as keyof typeof statusLabels] || statusLabels.en;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
            <div className="h-48 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {t.orderNotFound || 'Order not found'}
          </h3>
          <p className="text-slate-600 mb-4">
            {t.orderNotFoundDesc || 'The order you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToOrders || 'Back to Orders'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToOrders || 'Back to Orders'}
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t.shippingManagement || 'Shipping Management'}
            </h1>
            <p className="text-slate-600 mt-1">
              {t.orderNumber || 'Order'} #{order.id} • {order.itemName}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
            order.status === 'shipped' || order.status === 'in-transit' ? 'bg-purple-100 text-purple-700' :
            order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
            order.status === 'confirmed' ? 'bg-green-100 text-green-700' :
            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {statusLabelsForLang[order.status] || order.status}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Management */}
          <ShippingManagement
            order={order}
            onUpdate={handleUpdateShipping}
            t={t}
          />

          {/* Quick Status Actions */}
          {(order.status === 'confirmed' || order.status === 'preparing') && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                {t.quickActions || 'Quick Actions'}
              </h4>
              
              <div className="flex gap-2">
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'preparing', 'Started preparing order')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {t.startPreparing || 'Start Preparing'}
                  </button>
                )}
                
                {order.status === 'preparing' && !order.trackingNumber && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'shipped', 'Order shipped')}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {t.markAsShipped || 'Mark as Shipped'}
                  </button>
                )}
              </div>
              
              <p className="text-sm text-slate-600 mt-2">
                {order.status === 'confirmed' && (t.startPreparingDesc || 'Mark order as being prepared')}
                {order.status === 'preparing' && (t.markAsShippedDesc || 'Use this if you shipped without adding tracking info')}
              </p>
            </div>
          )}

          {/* Order Timeline */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">
              {t.orderTimeline || 'Order Timeline'}
            </h4>
            <OrderTimeline
              currentStatus={order.status}
              statusHistory={order.statusHistory}
              t={statusLabelsForLang}
              variant="timeline"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.customerInfo || 'Customer Information'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
                <p className="text-sm text-slate-600">{order.customerContact}</p>
              </div>
              
              {order.shippingAddress && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    {t.shippingAddress || 'Shipping Address'}
                  </p>
                  <div className="text-sm text-slate-600 space-y-0.5">
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                    {order.shippingAddress.postalCode && (
                      <p>{order.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>
              )}
              
              {order.message && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {t.customerMessage || 'Customer Message'}
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                    {order.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              {t.orderSummary || 'Order Summary'}
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{t.orderDate || 'Order Date'}</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-600">{t.item || 'Item'}</span>
                <span className="font-medium">{order.itemName}</span>
              </div>
              
              {order.itemPrice && (
                <div className="flex justify-between">
                  <span className="text-slate-600">{t.price || 'Price'}</span>
                  <span className="font-medium">{order.itemPrice}</span>
                </div>
              )}
              
              {order.estimatedDelivery && (
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.estimatedDelivery || 'Est. Delivery'}
                  </span>
                  <span className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                </div>
              )}

              {order.deliveryConfirmed && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    {t.deliveryConfirmed || 'Delivery Confirmed'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}