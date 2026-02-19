'use client';

import { useState } from 'react';
import { CartState } from '@/lib/cart';
import { getDict, type AppLang } from '@/lib/i18n';
import { CreditCard, Truck, Smartphone, MessageSquare, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  lang: AppLang;
  data: {
    guestCheckout: boolean;
    shippingAddress?: any;
    billingAddress?: any;
    paymentMethod?: 'bank_transfer' | 'cash_on_delivery' | 'mobile_money';
    notes?: string;
    useSameAddress: boolean;
  };
  cart: CartState;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => Promise<void>;
  isProcessing: boolean;
}

export default function PaymentForm({ 
  lang, 
  data, 
  cart,
  onUpdate, 
  onNext, 
  onPrev,
  onSubmit,
  isProcessing
}: PaymentFormProps) {
  const [notes, setNotes] = useState(data.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dict = getDict(lang);
  
  const paymentMethods = [
    {
      id: 'bank_transfer' as const,
      name: dict.checkout.bankTransfer,
      icon: CreditCard,
      description: 'Transfer funds directly to seller\'s bank account'
    },
    {
      id: 'cash_on_delivery' as const,
      name: dict.checkout.cashOnDelivery,
      icon: Truck,
      description: 'Pay when your order is delivered'
    },
    {
      id: 'mobile_money' as const,
      name: dict.checkout.mobileMoney,
      icon: Smartphone,
      description: 'Pay via M-Pesa or other mobile money services'
    }
  ];
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.paymentMethod) {
      newErrors.payment = dict.checkout.paymentRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Update notes first
      onUpdate({ ...data, notes });
      await onSubmit();
    }
  };
  
  const selectPaymentMethod = (method: typeof data.paymentMethod) => {
    onUpdate({ ...data, paymentMethod: method });
    if (errors.payment) {
      setErrors(prev => ({ ...prev, payment: '' }));
    }
  };
  
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = cart.discountAmount || 0;
  const total = subtotal - discount;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Payment Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-6">{dict.checkout.paymentMethod}</h2>
          
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  data.paymentMethod === method.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={data.paymentMethod === method.id}
                  onChange={() => selectPaymentMethod(method.id)}
                  className="w-4 h-4 text-green-600 mt-1 mr-4"
                />
                
                <div className="flex items-start space-x-3 flex-1">
                  <method.icon className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          {errors.payment && (
            <p className="text-sm text-red-600 mt-3">{errors.payment}</p>
          )}
          
          {data.paymentMethod && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                {dict.checkout.paymentInstructions}
              </p>
            </div>
          )}
        </div>
        
        {/* Order Notes */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            {dict.checkout.orderNotes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder={dict.checkout.orderNotesPlaceholder}
          />
        </div>
        
        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to shipping
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !data.paymentMethod}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {dict.checkout.placingOrder}
              </>
            ) : (
              dict.checkout.placeOrder
            )}
          </button>
        </div>
      </div>
      
      {/* Order Summary Sidebar */}
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.orderSummary}</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Shipping Address */}
        {data.shippingAddress && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.shippingAddress}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{data.shippingAddress.name}</p>
              <p>{data.shippingAddress.email}</p>
              <p>{data.shippingAddress.phone}</p>
              <p>{data.shippingAddress.address}</p>
              <p>{data.shippingAddress.city}, {data.shippingAddress.country}</p>
            </div>
          </div>
        )}
        
        {/* Payment Method Selected */}
        {data.paymentMethod && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.paymentMethodSelected}</h3>
            <div className="flex items-center space-x-3">
              {(() => {
                const method = paymentMethods.find(m => m.id === data.paymentMethod);
                if (!method) return null;
                return (
                  <>
                    <method.icon className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{method.name}</span>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}