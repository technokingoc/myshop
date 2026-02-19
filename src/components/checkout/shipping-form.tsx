'use client';

import { useState } from 'react';
import { CartAddress } from '@/lib/cart';
import { getDict, type AppLang } from '@/lib/i18n';
import { User, Mail, Phone, MapPin, Globe, Check } from 'lucide-react';

interface ShippingFormProps {
  lang: AppLang;
  data: {
    guestCheckout: boolean;
    shippingAddress?: CartAddress;
    billingAddress?: CartAddress;
    useSameAddress: boolean;
    saveAddress: boolean;
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
  const dict = getDict(lang);
  
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
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="radio"
                  id="guest"
                  checked={data.guestCheckout}
                  onChange={() => onUpdate({ ...data, guestCheckout: true })}
                  className="w-4 h-4 text-blue-600"
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
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="account" className="text-gray-700">
                  {dict.checkout.createAccount}
                </label>
              </div>
              
              {!data.guestCheckout && (
                <p className="text-sm text-blue-600 mt-2 ml-7">
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              {!customerSession && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.saveAddress}
                    onChange={(e) => onUpdate({ ...data, saveAddress: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
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
                  className="w-4 h-4 text-blue-600 rounded"
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
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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