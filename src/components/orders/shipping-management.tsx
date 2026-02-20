"use client";

import { useState } from "react";
import { Package, Truck, ExternalLink, Calendar, MapPin, Phone } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { OrderItem } from "./types";

interface ShippingManagementProps {
  order: OrderItem;
  onUpdate: (orderId: string, data: { 
    trackingNumber?: string; 
    trackingProvider?: string; 
    trackingUrl?: string;
    estimatedDelivery?: string;
    status?: string;
  }) => void;
  t: Record<string, string>;
}

const SHIPPING_PROVIDERS = [
  { id: 'correios', name: 'Correios de Moçambique', trackingUrl: 'https://www.correios.co.mz/track?code=' },
  { id: 'dhl', name: 'DHL', trackingUrl: 'https://www.dhl.com/mz-en/home/tracking.html?tracking-id=' },
  { id: 'fedex', name: 'FedEx', trackingUrl: 'https://www.fedex.com/track/?loc=en_mz&trackNums=' },
  { id: 'ups', name: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { id: 'tnt', name: 'TNT', trackingUrl: 'https://www.tnt.com/express/en_mz/site_tools/tracking.html?searchType=con&cons=' },
  { id: 'aramex', name: 'Aramex', trackingUrl: 'https://www.aramex.com/us/en/track/shipments' },
  { id: 'other', name: 'Other', trackingUrl: '' },
];

export function ShippingManagement({ order, onUpdate, t }: ShippingManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingProvider, setTrackingProvider] = useState(order.trackingProvider || 'correios');
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!trackingNumber.trim()) {
      toast.error(t.trackingNumberRequired || 'Tracking number is required');
      return;
    }

    setLoading(true);
    try {
      const provider = SHIPPING_PROVIDERS.find(p => p.id === trackingProvider);
      const trackingUrl = provider?.trackingUrl ? `${provider.trackingUrl}${trackingNumber}` : '';

      await onUpdate(order.id, {
        trackingNumber: trackingNumber.trim(),
        trackingProvider,
        trackingUrl,
        estimatedDelivery,
        status: order.status === 'confirmed' || order.status === 'preparing' ? 'shipped' : order.status,
      });

      setIsEditing(false);
      toast.success(t.trackingUpdated || 'Tracking information updated');
    } catch (error) {
      toast.error(t.updateFailed || 'Failed to update tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTrackingNumber(order.trackingNumber || '');
    setTrackingProvider(order.trackingProvider || 'correios');
    setEstimatedDelivery(
      order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : ''
    );
    setIsEditing(false);
  };

  const currentProvider = SHIPPING_PROVIDERS.find(p => p.id === (order.trackingProvider || trackingProvider));
  const fullTrackingUrl = order.trackingUrl || (currentProvider?.trackingUrl ? `${currentProvider.trackingUrl}${order.trackingNumber}` : '');

  if (!isEditing && !order.trackingNumber) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {t.addTrackingInfo || 'Add Tracking Information'}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {t.addTrackingDesc || 'Add tracking number and estimated delivery to keep your customer informed.'}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Truck className="h-4 w-4" />
              {t.addTracking || 'Add Tracking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4" />
          {t.shippingInfo || 'Shipping Information'}
        </h4>
        
        <div className="space-y-4">
          {/* Shipping Provider */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.shippingProvider || 'Shipping Provider'}
            </label>
            <select
              value={trackingProvider}
              onChange={(e) => setTrackingProvider(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {SHIPPING_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.trackingNumber || 'Tracking Number'}
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t.trackingNumberPlaceholder || 'Enter tracking number'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Estimated Delivery */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.estimatedDelivery || 'Estimated Delivery Date'}
            </label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.saving || 'Saving...'}
                </>
              ) : (
                t.saveTracking || 'Save Tracking'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {t.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display tracking info
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Truck className="h-4 w-4" />
          {t.shippingInfo || 'Shipping Information'}
        </h4>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t.edit || 'Edit'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Provider and Tracking */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">
              {currentProvider?.name || 'Unknown Provider'}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-600 font-mono">
                {order.trackingNumber}
              </p>
              {fullTrackingUrl && (
                <a
                  href={fullTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t.track || 'Track'}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        {order.estimatedDelivery && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {t.estimatedDelivery || 'Estimated Delivery'}
              </p>
              <p className="text-sm text-slate-600">
                {new Date(order.estimatedDelivery).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {order.customerName}
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {order.customerContact}
              </p>
              {order.shippingAddress && (
                <p className="text-sm text-slate-600 mt-1">
                  {order.shippingAddress.address}, {order.shippingAddress.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}