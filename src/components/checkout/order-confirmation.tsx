'use client';

import { getDict, type AppLang } from '@/lib/i18n';
import { Check, Mail, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CartAddress } from '@/lib/cart';

interface OrderConfirmationProps {
  lang: AppLang;
  orderResult: {
    success: boolean;
    orders: Array<{
      id: number;
      trackingToken: string;
      status: string;
    }>;
    trackingTokens: string[];
  };
  shippingAddress: CartAddress;
}

export default function OrderConfirmation({ 
  lang, 
  orderResult, 
  shippingAddress 
}: OrderConfirmationProps) {
  const dict = getDict(lang);
  
  if (!orderResult.success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <div className="text-white text-xl">!</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Failed</h2>
        <p className="text-gray-600 mb-8">
          There was an issue processing your order. Please try again or contact support.
        </p>
        <Link
          href="/cart"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Back to Cart
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{dict.checkout.orderPlaced}</h2>
        <p className="text-gray-600">
          {dict.checkout.confirmationEmail} {shippingAddress.email}
        </p>
      </div>
      
      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.orderSummary}</h3>
        
        <div className="space-y-4">
          {orderResult.orders.map((order, index) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {dict.checkout.orderNumber}: #{order.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tracking: {order.trackingToken}
                  </p>
                </div>
              </div>
              
              <Link
                href={`/track/${order.trackingToken}`}
                className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
              >
                {dict.checkout.trackYourOrder}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Shipping Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.shippingAddress}</h3>
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">{shippingAddress.name}</p>
          <p>{shippingAddress.email}</p>
          <p>{shippingAddress.phone}</p>
          <p>{shippingAddress.address}</p>
          <p>{shippingAddress.city}, {shippingAddress.country}</p>
        </div>
      </div>
      
      {/* What Happens Next */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• You'll receive a confirmation email with order details</li>
              <li>• Sellers will be notified and will prepare your items</li>
              <li>• You'll receive updates as your orders are processed and shipped</li>
              <li>• Use the tracking numbers above to monitor delivery status</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/stores"
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
        >
          {dict.checkout.continueShoppingLower}
        </Link>
        
        <Link
          href="/customer/orders"
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
        >
          View All Orders
        </Link>
      </div>
      
      {/* Support */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Need help with your order?
        </p>
        <Link
          href="/support"
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}