'use client';

import { useState, useEffect } from 'react';
import { CartAddress } from '@/lib/cart';
import { getDict, type AppLang } from '@/lib/i18n';
import { User, Mail, Phone, MapPin, Globe, Check, Truck, Package, Clock, Loader2 } from 'lucide-react';

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

interface ShippingFormProps {
  lang: AppLang;
  data: {
    guestCheckout: boolean;
    shippingAddress?: CartAddress;
    billingAddress?: CartAddress;
    useSameAddress: boolean;
    saveAddress: boolean;
    selectedShippingMethod?: ShippingMethod;
  };
  customerSession: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ShippingForm({ 
  lang, 
  data, 
  customerSession, 
  onUpdate, 
  onNext, 
  onPrev 
}: ShippingFormProps) {
  const [formData, setFormData] = useState<CartAddress>(
    data.shippingAddress || {
      name: customerSession?.name || '',
      email: customerSession?.email || '',
      phone: '',
      address: '',
      city: '',
      country: 'Mozambique'
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(
    data.selectedShippingMethod || null
  );
  const dict = getDict(lang);
  
  // Load shipping methods when address changes
  useEffect(() => {
    if (formData.city && formData.country) {
      loadShippingMethods();
    }
  }, [formData.city, formData.country]);

  const loadShippingMethods = async () => {
    if (!formData.city || !formData.country) return;

    setLoadingMethods(true);
    try {
      // Get sellerId from the first item in cart (assuming single-seller cart for now)
      const cart = JSON.parse(localStorage.getItem('myshop_cart') || '{"items":[]}');
      if (cart.items.length === 0) return;

      const sellerId = cart.items[0].sellerId;
      const cartTotal = cart.items.reduce((total: number, item: any) => 
        total + (item.price * item.quantity), 0
      );

      const response = await fetch('/api/shipping/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          customerLocation: {
            city: formData.city,
            country: formData.country
          },
          cartTotal
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShippingMethods(result.methods || []);
        
        // Auto-select the first method if none selected
        if (!selectedMethod && result.methods.length > 0) {
          const firstMethod = result.methods[0];
          setSelectedMethod(firstMethod);
          onUpdate({
            ...data,
            selectedShippingMethod: firstMethod
          });
        }
      }
    } catch (error) {
      console.error('Failed to load shipping methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleMethodSelect = (method: ShippingMethod) => {
    setSelectedMethod(method);
    onUpdate({
      ...data,
      selectedShippingMethod: method
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = dict.checkout.nameRequired;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = dict.checkout.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = dict.checkout.emailInvalid;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = dict.checkout.phoneRequired;
    }
    
    if (!formData.address.trim()) {
      newErrors.address = dict.checkout.addressRequired;
    }
    
    if (!formData.city.trim()) {
      newErrors.city = dict.checkout.cityRequired;
    }

    if (shippingMethods.length > 0 && !selectedMethod) {
      newErrors.shipping = 'Please select a shipping method';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onUpdate({
        ...data,
        shippingAddress: formData,
        billingAddress: data.useSameAddress ? formData : data.billingAddress
      });
      onNext();
    }
  };
  
  const updateField = (field: keyof CartAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const toggleSameAddress = () => {
    const newUseSameAddress = !data.useSameAddress;
    onUpdate({
      ...data,
      useSameAddress: newUseSameAddress,
      billingAddress: newUseSameAddress ? formData : data.billingAddress
    });
  };
  
  const countries = [
    'Mozambique',
    'South Africa', 
    'Zimbabwe',
    'Botswana',
    'Tanzania',
    'Kenya',
    'Angola',
    'Other'
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Shipping Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">{dict.checkout.shippingInfo}</h2>
          
          {/* Guest vs Account Option */}
          {!customerSession && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="radio"
                  id="guest"
                  checked={data.guestCheckout}
                  onChange={() => onUpdate({ ...data, guestCheckout: true })}
                  className="w-4 h-4 text-green-600"
                />
                <label htmlFor="guest" className="font-medium text-gray-900">
                  {dict.checkout.continuousGuest}
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="account"
                  checked={!data.guestCheckout}
                  onChange={() => onUpdate({ ...data, guestCheckout: false })}
                  className="w-4 h-4 text-green-600"
                />
                <label htmlFor="account" className="text-gray-700">
                  {dict.checkout.createAccount}
                </label>
              </div>
              
              {!data.guestCheckout && (
                <p className="text-sm text-green-600 mt-2 ml-7">
                  Account creation will happen after order confirmation
                </p>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {dict.checkout.fullName} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {dict.checkout.emailAddress} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                {dict.checkout.phoneNumber} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+258 XX XXX XXXX"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
            
            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                {dict.checkout.streetAddress} *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Street address, apartment, suite, etc."
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address}</p>
              )}
            </div>
            
            {/* City & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {dict.checkout.city} *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  {dict.checkout.country} *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Shipping Methods */}
            {(shippingMethods.length > 0 || loadingMethods) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Shipping Method *
                </label>
                
                {loadingMethods ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">Loading shipping options...</span>
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No shipping methods available for your location</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
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
                              {method.type === 'pickup' ? (
                                <Package className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Truck className="w-4 h-4 text-gray-600" />
                              )}
                              <span className="font-medium text-gray-900">{method.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {method.cost === 0 ? 'Free' : `MZN ${method.cost.toFixed(2)}`}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {method.estimatedDays} days
                            </div>
                          </div>
                        </div>
                        
                        {method.description && (
                          <p className="text-sm text-gray-600 mt-2">{method.description}</p>
                        )}
                        
                        {method.type === 'pickup' && method.pickupAddress && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="font-medium text-green-900 mb-1">Pickup Location:</p>
                            <p className="text-sm text-green-800">{method.pickupAddress}</p>
                            {method.pickupInstructions && (
                              <p className="text-sm text-green-700 mt-1">{method.pickupInstructions}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.shipping && (
                  <p className="text-sm text-red-600 mt-2">{errors.shipping}</p>
                )}
              </div>
            )}
            
            {/* Options */}
            <div className="space-y-3">
              {!customerSession && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.saveAddress}
                    onChange={(e) => onUpdate({ ...data, saveAddress: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    {dict.checkout.saveAddress}
                  </span>
                </label>
              )}
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={data.useSameAddress}
                  onChange={toggleSameAddress}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  {dict.checkout.useSameForBilling}
                </span>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onPrev}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back to review
              </button>
              
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {dict.checkout.continuesToPayment}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Order Summary Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.shippingAddress}</h3>
          
          {formData.name ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{formData.name}</p>
              {formData.email && <p>{formData.email}</p>}
              {formData.phone && <p>{formData.phone}</p>}
              {formData.address && <p>{formData.address}</p>}
              {formData.city && <p>{formData.city}, {formData.country}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Fill out the form to see your shipping address</p>
          )}
        </div>
        
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Selected Shipping</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{selectedMethod.name}</span>
                <span className="font-medium text-gray-900">
                  {selectedMethod.cost === 0 ? 'Free' : `MZN ${selectedMethod.cost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Estimated delivery: {selectedMethod.estimatedDays} days
              </div>
            </div>
          </div>
        )}

        {data.useSameAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                Billing address same as shipping
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}