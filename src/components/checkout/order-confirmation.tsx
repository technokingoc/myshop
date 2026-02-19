'use client';

import { useState, useEffect } from 'react';
import { getDict, type AppLang } from '@/lib/i18n';
import { CartAddress } from '@/lib/cart';
import { CheckCircle, Download, Eye, ArrowRight, CreditCard, Smartphone, Truck } from 'lucide-react';
import Link from 'next/link';
import PaymentConfirmation from '../payments/payment-confirmation';

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
  paymentMethod?: 'bank_transfer' | 'cash_on_delivery' | 'mobile_money';
}

export default function OrderConfirmation({ 
  lang, 
  orderResult, 
  shippingAddress,
  paymentMethod = 'bank_transfer'
}: OrderConfirmationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const dict = getDict(lang);

  // Initiate payment for M-Pesa orders
  useEffect(() => {
    if (orderResult.success && paymentMethod === 'mobile_money' && !paymentInitiated) {
      initiatePayment();
    }
  }, [orderResult, paymentMethod, paymentInitiated]);

  const initiatePayment = async () => {
    if (!orderResult.orders.length) return;

    try {
      setPaymentInitiated(true);
      
      // For now, initiate payment for the first order
      // In a real implementation, you might handle multiple orders differently
      const firstOrder = orderResult.orders[0];
      
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: firstOrder.id,
          method: 'mpesa',
          provider: 'vodacom', // Default to Vodacom for Mozambique
          customerPhone: shippingAddress.phone,
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.name
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentStatus('processing');
      } else {
        console.error('Payment initiation failed:', result.error);
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
    }
  };

  if (!orderResult.success) {
    return (
      <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-900 mb-2">
            {lang === 'en' ? 'Order Failed' : 'Pedido Falhado'}
          </h2>
          <p className="text-red-700">
            {lang === 'en' ? 'There was a problem processing your order. Please try again.' : 'Houve um problema ao processar seu pedido. Tente novamente.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <div>
            <h2 className="text-xl font-bold text-green-900 mb-2">
              {dict.checkout.orderPlaced}
            </h2>
            <p className="text-green-700">
              {dict.checkout.confirmationEmail} {shippingAddress.email}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Section for M-Pesa */}
      {paymentMethod === 'mobile_money' && orderResult.orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Smartphone className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">
              {lang === 'en' ? 'Complete Your Payment' : 'Complete o Seu Pagamento'}
            </h3>
          </div>
          
          <PaymentConfirmation
            lang={lang}
            orderId={orderResult.orders[0].id}
            onStatusChange={setPaymentStatus}
          />
        </div>
      )}

      {/* Bank Transfer Instructions */}
      {paymentMethod === 'bank_transfer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-3">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-medium text-blue-900">
              {lang === 'en' ? 'Payment Instructions' : 'Instruções de Pagamento'}
            </h3>
          </div>
          <p className="text-blue-800">
            {lang === 'en'
              ? 'The seller will contact you with bank transfer details. Please keep your order number ready.'
              : 'O vendedor entrará em contato com os detalhes da transferência bancária. Mantenha o número do seu pedido pronto.'
            }
          </p>
        </div>
      )}

      {/* Cash on Delivery */}
      {paymentMethod === 'cash_on_delivery' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Truck className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-medium text-green-900">
              {lang === 'en' ? 'Cash on Delivery' : 'Pagamento na Entrega'}
            </h3>
          </div>
          <p className="text-green-800">
            {lang === 'en'
              ? 'You will pay when your order is delivered. Please have the exact amount ready.'
              : 'Pagará quando a sua encomenda for entregue. Por favor, tenha o valor exato pronto.'
            }
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {lang === 'en' ? 'Order Details' : 'Detalhes do Pedido'}
        </h3>
        
        <div className="space-y-4">
          {orderResult.orders.map((order, index) => (
            <div key={order.id} className="border-l-4 border-green-500 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {dict.checkout.orderNumber}: #{order.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    {lang === 'en' ? 'Tracking' : 'Rastreamento'}: {order.trackingToken}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    Status: {order.status}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/track/${order.trackingToken}`}
                    className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {dict.checkout.trackYourOrder}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            {showDetails 
              ? (lang === 'en' ? 'Hide Details' : 'Ocultar Detalhes')
              : (lang === 'en' ? 'Show Details' : 'Mostrar Detalhes')
            }
          </button>
          
          {showDetails && (
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>{lang === 'en' ? 'Shipping to' : 'Envio para'}:</strong></p>
              <p>{shippingAddress.name}</p>
              <p>{shippingAddress.address}</p>
              <p>{shippingAddress.city}, {shippingAddress.country}</p>
              <p>{shippingAddress.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {lang === 'en' ? 'What happens next?' : 'O que acontece a seguir?'}
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">
              1
            </div>
            <p>
              {paymentMethod === 'mobile_money' ? (
                lang === 'en' 
                  ? 'Complete your M-Pesa payment using the instructions above'
                  : 'Complete o seu pagamento M-Pesa usando as instruções acima'
              ) : (
                lang === 'en' 
                  ? 'You will receive an order confirmation email with all the details'
                  : 'Receberá um e-mail de confirmação do pedido com todos os detalhes'
              )}
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">
              2
            </div>
            <p>
              {lang === 'en' 
                ? 'The seller will contact you to confirm payment and delivery details'
                : 'O vendedor entrará em contato para confirmar os detalhes de pagamento e entrega'
              }
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">
              3
            </div>
            <p>
              {lang === 'en' 
                ? 'Track your order status using the tracking links above'
                : 'Acompanhe o status do seu pedido usando os links de rastreamento acima'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/stores"
          className="flex-1 bg-green-600 text-white text-center py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          {dict.checkout.continueShoppingLower}
        </Link>
        
        <Link
          href="/customer/orders"
          className="flex-1 bg-gray-100 text-gray-700 text-center py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
        >
          <span>{lang === 'en' ? 'View Orders' : 'Ver Pedidos'}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    </div>
  );
}