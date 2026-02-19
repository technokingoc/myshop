'use client';

import { CartManager, CartState } from '@/lib/cart';
import { getDict, type AppLang } from '@/lib/i18n';
import { ShoppingBag } from 'lucide-react';

interface OrderReviewProps {
  lang: AppLang;
  cart: CartState;
  onNext: () => void;
}

export default function OrderReview({ lang, cart, onNext }: OrderReviewProps) {
  const dict = getDict(lang);
  const subtotal = CartManager.getSubtotal();
  const total = CartManager.getTotal();
  const discount = cart.discountAmount || 0;
  
  if (cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">{dict.cart.empty}</h2>
        <p className="text-gray-500">{dict.cart.emptyDescription}</p>
      </div>
    );
  }
  
  const storeGroups = CartManager.getStoreGroups();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Items */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-xl font-medium text-gray-900 mb-4">{dict.checkout.reviewOrder}</h2>
          <p className="text-gray-600 mb-6">
            Review your items before proceeding to checkout
          </p>
        </div>
        
        {storeGroups.map((group) => (
          <div key={group.storeId} className="bg-white rounded-lg shadow-sm border">
            {/* Store Header */}
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
              <h3 className="font-medium text-gray-900">{group.storeName}</h3>
              <p className="text-sm text-gray-600">
                {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            
            {/* Store Items */}
            <div className="divide-y">
              {group.items.map((item) => (
                <div key={`${item.id}-${item.variantId || 'main'}`} className="p-6 flex space-x-4">
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.variantName && (
                          <p className="text-sm text-gray-500 mt-1">{item.variantName}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Order Summary */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.orderSummary}</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{dict.cart.subtotal}</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>{dict.cart.discount} {cart.couponCode && `(${cart.couponCode})`}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">{dict.cart.total}</span>
                <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action */}
        <div className="space-y-4">
          <button
            onClick={onNext}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {dict.checkout.continuesToShipping}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            By proceeding, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}