'use client';

import { useState, useEffect } from 'react';
import { CartManager, CartAddress } from '@/lib/cart';
import { getDict, type AppLang } from '@/lib/i18n';
// Remove direct import of getCustomerSession - it's server-only
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Components for each step
import OrderReview from './order-review';
import ShippingForm from './shipping-form';
import PaymentForm from './payment-form';
import OrderConfirmation from './order-confirmation';

interface CheckoutFlowProps {
  lang: AppLang;
}

type CheckoutStep = 'review' | 'shipping' | 'payment' | 'confirmation';

interface ShippingMethod {
  id: number;
  name: string;
  type: string;
  cost: number;
  estimatedDays: number;
  description?: string;
}

interface CheckoutData {
  guestCheckout: boolean;
  shippingAddress?: CartAddress;
  billingAddress?: CartAddress;
  selectedShippingMethod?: ShippingMethod;
  paymentMethod?: 'bank_transfer' | 'cash_on_delivery' | 'mobile_money';
  notes?: string;
  useSameAddress: boolean;
  saveAddress: boolean;
}

export default function CheckoutFlow({ lang }: CheckoutFlowProps) {
  const [cart, setCart] = useState(CartManager.getCart());
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    guestCheckout: true,
    useSameAddress: true,
    saveAddress: false
  });
  const [customerSession, setCustomerSession] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  
  const dict = getDict(lang);
  const router = useRouter();
  
  useEffect(() => {
    // Check if cart is empty and redirect
    const currentCart = CartManager.getCart();
    if (currentCart.items.length === 0) {
      router.push('/cart');
      return;
    }
    
    setCart(currentCart);
    
    // Check for customer session via API
    fetch('/api/auth/customer/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          setCustomerSession(data.session);
          setCheckoutData(prev => ({ ...prev, guestCheckout: false }));
        }
      })
      .catch(() => {
        // Guest checkout by default
      });
  }, [router]);
  
  const steps: { key: CheckoutStep; label: string; completed: boolean }[] = [
    { key: 'review', label: dict.checkout.reviewOrder, completed: currentStep !== 'review' },
    { key: 'shipping', label: dict.checkout.shippingInfo, completed: ['payment', 'confirmation'].includes(currentStep) },
    { key: 'payment', label: dict.checkout.paymentMethod, completed: currentStep === 'confirmation' },
    { key: 'confirmation', label: dict.checkout.orderConfirmation, completed: false }
  ];
  
  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);
  
  const goToStep = (step: CheckoutStep) => {
    const stepIndex = steps.findIndex(s => s.key === step);
    const currentIndex = getCurrentStepIndex();
    
    // Only allow going backwards or to the next step if current step is valid
    if (stepIndex <= currentIndex || validateCurrentStep()) {
      setCurrentStep(step);
    }
  };
  
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'review':
        return cart.items.length > 0;
      case 'shipping':
        return !!(checkoutData.shippingAddress?.name && 
                 checkoutData.shippingAddress?.email && 
                 checkoutData.shippingAddress?.phone && 
                 checkoutData.shippingAddress?.address && 
                 checkoutData.shippingAddress?.city);
      case 'payment':
        return !!checkoutData.paymentMethod;
      default:
        return true;
    }
  };
  
  const nextStep = () => {
    if (!validateCurrentStep()) return;
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };
  
  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };
  
  const submitOrder = async () => {
    if (!validateCurrentStep()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          shippingAddress: checkoutData.shippingAddress,
          billingAddress: checkoutData.useSameAddress ? checkoutData.shippingAddress : checkoutData.billingAddress,
          shippingMethod: checkoutData.selectedShippingMethod,
          paymentMethod: checkoutData.paymentMethod,
          notes: checkoutData.notes,
          couponCode: cart.couponCode,
          guestCheckout: checkoutData.guestCheckout
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }
      
      setOrderResult(result);
      CartManager.clearCart(); // Clear cart after successful order
      setCurrentStep('confirmation');
      
    } catch (error) {
      console.error('Order submission error:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (cart.items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link 
            href="/stores" 
            className="text-blue-600 hover:text-blue-800"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/cart"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dict.checkout.backToCart}
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-8">{dict.checkout.title}</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => goToStep(step.key)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step.key === currentStep 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : step.completed 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-gray-300 text-gray-500 bg-white hover:border-blue-600'
                  }`}
                  disabled={!step.completed && step.key !== currentStep && !validateCurrentStep()}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                <span className={`ml-3 text-sm font-medium ${
                  step.key === currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-16 ${
                    step.completed ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Step Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {currentStep === 'review' && (
          <OrderReview 
            lang={lang}
            cart={cart}
            onNext={nextStep}
          />
        )}
        
        {currentStep === 'shipping' && (
          <ShippingForm
            lang={lang}
            data={checkoutData}
            customerSession={customerSession}
            onUpdate={setCheckoutData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 'payment' && (
          <PaymentForm
            lang={lang}
            data={checkoutData}
            cart={cart}
            onUpdate={setCheckoutData}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={submitOrder}
            isProcessing={isProcessing}
          />
        )}
        
        {currentStep === 'confirmation' && orderResult && (
          <OrderConfirmation
            lang={lang}
            orderResult={orderResult}
            shippingAddress={checkoutData.shippingAddress!}
          />
        )}
      </div>
    </div>
  );
}