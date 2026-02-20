'use client';

import { useState, useEffect } from 'react';
import { Calculator, MapPin, Truck, Package, Clock, Loader2, X, Check } from 'lucide-react';

interface ShippingMethod {
  id: number;
  name: string;
  type: string;
  cost: number;
  estimatedDays: number;
  description: string;
  pickupAddress?: string;
  pickupInstructions?: string;
}

interface ShippingCalculatorProps {
  sellerId: number;
  cartTotal: number;
  currency?: string;
  onShippingSelect?: (method: ShippingMethod | null) => void;
  selectedMethodId?: number;
  className?: string;
}

export default function ShippingCalculator({ 
  sellerId, 
  cartTotal, 
  currency = 'USD',
  onShippingSelect,
  selectedMethodId,
  className = ''
}: ShippingCalculatorProps) {
  const [location, setLocation] = useState({ city: '', country: 'Mozambique' });
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const countries = [
    'Mozambique', 'South Africa', 'Zimbabwe', 'Botswana', 
    'Tanzania', 'Kenya', 'Angola', 'Other'
  ];

  useEffect(() => {
    if (selectedMethodId) {
      const method = methods.find(m => m.id === selectedMethodId);
      if (method) {
        setSelectedMethod(method);
        onShippingSelect?.(method);
      }
    }
  }, [selectedMethodId, methods, onShippingSelect]);

  const calculateShipping = async () => {
    if (!location.city.trim()) {
      setError('Please enter your city');
      return;
    }

    setLoading(true);
    setError('');
    setMethods([]);
    setSelectedMethod(null);

    try {
      const response = await fetch('/api/shipping/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          customerLocation: location,
          cartTotal,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMethods(data.methods || []);
        setCalculated(true);
        
        // Auto-select first method if only one available
        if (data.methods?.length === 1) {
          setSelectedMethod(data.methods[0]);
          onShippingSelect?.(data.methods[0]);
        }
      } else {
        setError(data.error || 'Failed to calculate shipping');
      }
    } catch (err) {
      setError('Failed to calculate shipping');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = (method: ShippingMethod) => {
    setSelectedMethod(method);
    onShippingSelect?.(method);
  };

  const resetCalculator = () => {
    setCalculated(false);
    setMethods([]);
    setSelectedMethod(null);
    setError('');
    setLocation({ city: '', country: location.country });
    onShippingSelect?.(null);
    setIsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateShipping();
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <Package className="w-4 h-4" />;
      case 'free': return <Truck className="w-4 h-4 text-green-600" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  if (!calculated) {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Calculate Shipping</span>
          </div>
          <span className="text-sm text-gray-500">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter your location to see shipping options and costs
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Calculate Shipping</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">Shipping Options</span>
        </div>
        <button
          onClick={resetCalculator}
          className="text-sm text-green-600 hover:text-green-700"
        >
          Recalculate
        </button>
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-md p-3 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">
            {location.city}, {location.country}
          </span>
        </div>
      </div>

      {/* Shipping Methods */}
      {methods.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            <span>
              {methods.length} shipping option{methods.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {methods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-md p-3 cursor-pointer transition-colors ${
                selectedMethod?.id === method.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodSelect(method)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedMethod?.id === method.id}
                    onChange={() => handleMethodSelect(method)}
                    className="w-4 h-4 text-green-600"
                  />
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(method.type)}
                    <span className="font-medium text-gray-900 text-sm">
                      {method.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {method.cost === 0 ? 'Free' : `${currency} ${method.cost.toFixed(2)}`}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {method.estimatedDays} days
                  </div>
                </div>
              </div>

              {method.description && (
                <p className="text-sm text-gray-600 mt-2 ml-7">{method.description}</p>
              )}
              
              {method.type === 'pickup' && method.pickupAddress && (
                <div className="mt-2 ml-7 p-2 bg-green-50 rounded text-sm">
                  <div className="font-medium text-green-900">Pickup Location:</div>
                  <div className="text-green-800">📍 {method.pickupAddress}</div>
                  {method.pickupInstructions && (
                    <div className="text-green-700 text-xs mt-1">
                      {method.pickupInstructions}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Selected Method Summary */}
          {selectedMethod && (
            <div className="border-t pt-3 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Selected shipping:</span>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {selectedMethod.name}
                  </div>
                  <div className="text-green-600">
                    {selectedMethod.cost === 0 ? 'Free' : `${currency} ${selectedMethod.cost.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm">
            No shipping options available for your location
          </p>
          <button
            onClick={resetCalculator}
            className="text-green-600 hover:text-green-700 text-sm mt-2"
          >
            Try a different location
          </button>
        </div>
      )}
    </div>
  );
}