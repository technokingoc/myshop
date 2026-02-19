'use client';

import { useState, useEffect } from 'react';
import { Truck, Clock, Package, MapPin, Info } from 'lucide-react';

interface ShippingInfo {
  sellerId: number;
  sellerCurrency: string;
  summary: {
    fastestDelivery: number;
    minShippingRate: number;
    hasFreeShipping: boolean;
    freeShippingMinOrder: number | null;
    hasPickup: boolean;
    totalMethods: number;
  };
  zones: Array<{
    id: number;
    name: string;
    regions: string[];
    countries: string[];
  }>;
}

interface ShippingInfoProps {
  sellerId: number;
  className?: string;
  compact?: boolean;
}

export default function ShippingInfo({ sellerId, className = '', compact = false }: ShippingInfoProps) {
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShippingInfo();
  }, [sellerId]);

  const loadShippingInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/shipping/info?sellerId=${sellerId}`);
      const data = await response.json();

      if (response.ok) {
        if (data.shippingInfo) {
          setShippingInfo(data.shippingInfo);
        } else {
          setError(data.message || 'No shipping information available');
        }
      } else {
        setError(data.error || 'Failed to load shipping information');
      }
    } catch (err) {
      console.error('Error loading shipping info:', err);
      setError('Failed to load shipping information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error || !shippingInfo) {
    return null; // Don't show error state, just hide the component
  }

  const { summary, sellerCurrency } = shippingInfo;

  if (compact) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        <div className="flex items-center space-x-4">
          {summary.fastestDelivery && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{summary.fastestDelivery} day{summary.fastestDelivery !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {summary.hasFreeShipping && (
            <div className="flex items-center space-x-1 text-green-600">
              <Truck className="w-3 h-3" />
              <span>Free shipping{summary.freeShippingMinOrder ? ` over ${sellerCurrency} ${summary.freeShippingMinOrder}` : ''}</span>
            </div>
          )}
          
          {summary.hasPickup && (
            <div className="flex items-center space-x-1">
              <Package className="w-3 h-3" />
              <span>Pickup available</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Truck className="w-4 h-4 text-blue-600" />
        <h3 className="font-medium text-gray-900">Shipping & Delivery</h3>
      </div>
      
      <div className="space-y-3">
        {/* Delivery Time */}
        {summary.fastestDelivery && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Fastest delivery</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {summary.fastestDelivery} day{summary.fastestDelivery !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Shipping Cost */}
        {summary.minShippingRate > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Shipping from</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {sellerCurrency} {summary.minShippingRate.toFixed(2)}
            </span>
          </div>
        )}

        {/* Free Shipping */}
        {summary.hasFreeShipping && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Free shipping</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {summary.freeShippingMinOrder 
                ? `Over ${sellerCurrency} ${summary.freeShippingMinOrder.toFixed(2)}`
                : 'Available'
              }
            </span>
          </div>
        )}

        {/* Pickup Option */}
        {summary.hasPickup && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Pickup</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Available</span>
          </div>
        )}

        {/* Shipping Zones */}
        {shippingInfo.zones.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Ships to:</span>
                <div className="mt-1 text-xs text-gray-500">
                  {shippingInfo.zones.map((zone, index) => (
                    <span key={zone.id}>
                      {zone.countries.length > 0 && zone.countries.join(', ')}
                      {zone.regions.length > 0 && (
                        <span className="text-gray-400">
                          {zone.countries.length > 0 ? ' (' : ''}
                          {zone.regions.join(', ')}
                          {zone.countries.length > 0 ? ')' : ''}
                        </span>
                      )}
                      {index < shippingInfo.zones.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {summary.totalMethods > 1 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">
                {summary.totalMethods} shipping methods available at checkout
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}