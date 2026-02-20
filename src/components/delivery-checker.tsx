'use client';

import { useState, useEffect } from 'react';
import { MapPin, Check, X, Loader2, Truck, Package, Clock } from 'lucide-react';

interface DeliveryMethod {
  id: number;
  name: string;
  type: string;
  cost: number;
  estimatedDays: number;
  description: string;
  pickupAddress?: string;
  pickupInstructions?: string;
}

interface DeliveryCheckerProps {
  sellerId: number;
  className?: string;
  currency?: string;
}

export default function DeliveryChecker({ sellerId, className = '', currency = 'USD' }: DeliveryCheckerProps) {
  const [location, setLocation] = useState({ city: '', country: 'Mozambique' });
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  const countries = [
    'Mozambique', 'South Africa', 'Zimbabwe', 'Botswana', 
    'Tanzania', 'Kenya', 'Angola', 'Other'
  ];

  const checkDelivery = async () => {
    if (!location.city.trim()) {
      setError('Please enter your city');
      return;
    }

    setLoading(true);
    setError('');
    setMethods([]);

    try {
      const response = await fetch('/api/shipping/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          customerLocation: location,
          cartTotal: 0, // For delivery check, we don't consider cart total
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMethods(data.methods || []);
        setChecked(true);
      } else {
        setError(data.error || 'Failed to check delivery options');
      }
    } catch (err) {
      setError('Failed to check delivery options');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkDelivery();
  };

  const resetCheck = () => {
    setChecked(false);
    setMethods([]);
    setError('');
    setLocation({ city: '', country: location.country });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <Package className="w-4 h-4 text-green-600" />;
      case 'free': return <Truck className="w-4 h-4 text-green-600" />;
      default: return <Truck className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="font-medium text-gray-900">Check Delivery</h3>
      </div>

      {!checked ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
                placeholder="Enter your city"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={location.country}
                onChange={(e) => setLocation({ ...location, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <X className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Check Delivery</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Location Info */}
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  {location.city}, {location.country}
                </span>
              </div>
              <button
                onClick={resetCheck}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Change
              </button>
            </div>
          </div>

          {/* Delivery Options */}
          {methods.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {methods.length} delivery option{methods.length !== 1 ? 's' : ''} available
                </span>
              </div>

              {methods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getMethodIcon(method.type)}
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {method.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {method.description}
                        </div>
                        {method.type === 'pickup' && method.pickupAddress && (
                          <div className="text-xs text-green-600 mt-1">
                            📍 {method.pickupAddress}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {method.cost === 0 ? 'Free' : `${currency} ${method.cost.toFixed(2)}`}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {method.estimatedDays} days
                      </div>
                    </div>
                  </div>
                  
                  {method.type === 'pickup' && method.pickupInstructions && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                      {method.pickupInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <X className="w-4 h-4" />
              <span className="text-sm">
                No delivery options available for your location
              </span>
            </div>
          )}

          <button
            onClick={resetCheck}
            className="w-full text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Check another location
          </button>
        </div>
      )}
    </div>
  );
}