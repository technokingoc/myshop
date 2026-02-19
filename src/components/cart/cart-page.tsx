'use client';

import { useState, useEffect } from 'react';
import { CartManager, CartItem } from '@/lib/cart';
import { ShoppingBag, Plus, Minus, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { getDict, type AppLang } from '@/lib/i18n';
import Link from 'next/link';

interface CartPageProps {
  lang: AppLang;
}

export default function CartPage({ lang }: CartPageProps) {
  const [cart, setCart] = useState(CartManager.getCart());
  const [couponCode, setCouponCode] = useState(cart.couponCode || '');
  const [couponError, setCouponError] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const dict = getDict(lang);
  
  useEffect(() => {
    setCart(CartManager.getCart());
  }, []);
  
  const updateCart = () => {
    const updatedCart = CartManager.getCart();
    setCart(updatedCart);
    setCouponCode(updatedCart.couponCode || '');
  };
  
  const updateQuantity = (itemId: number, variantId: number | undefined, newQuantity: number) => {
    CartManager.updateQuantity(itemId, variantId, newQuantity);
    updateCart();
  };
  
  const removeItem = (itemId: number, variantId?: number) => {
    CartManager.removeItem(itemId, variantId);
    updateCart();
  };
  
  const clearCart = () => {
    CartManager.clearCart();
    updateCart();
  };
  
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoadingCoupon(true);
    setCouponError('');
    
    try {
      // Mock coupon validation - in real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, let's say "SAVE10" gives 10% discount
      if (couponCode.toUpperCase() === 'SAVE10') {
        const subtotal = CartManager.getSubtotal();
        const discount = subtotal * 0.1;
        CartManager.applyCoupon(couponCode.toUpperCase(), discount);
        updateCart();
      } else {
        setCouponError(dict.checkout.invalidCoupon);
      }
    } catch (error) {
      setCouponError(dict.common.genericError);
    } finally {
      setLoadingCoupon(false);
    }
  };
  
  const removeCoupon = () => {
    CartManager.removeCoupon();
    setCouponCode('');
    setCouponError('');
    updateCart();
  };
  
  const subtotal = CartManager.getSubtotal();
  const total = CartManager.getTotal();
  const discount = cart.discountAmount || 0;
  
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">{dict.cart.empty}</h2>
            <p className="text-gray-500 mb-6">{dict.cart.emptyDescription}</p>
            <Link 
              href="/stores"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {dict.cart.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/stores"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {dict.cart.continueShopping}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.cart.title}</h1>
          <p className="text-gray-600">
            {cart.items.length} {dict.cart.itemsInCart}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {CartManager.getStoreGroups().map((group) => (
              <div key={group.storeId} className="bg-white rounded-lg shadow-sm border">
                {/* Store Header */}
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                  <h3 className="font-medium text-gray-900">{group.storeName}</h3>
                </div>
                
                {/* Store Items */}
                <div className="divide-y">
                  {group.items.map((item) => (
                    <CartItemCard
                      key={`${item.id}-${item.variantId || 'main'}`}
                      item={item}
                      lang={lang}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Clear Cart */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Clear all items
              </button>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            {/* Coupon Code */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.couponCode}</h3>
              
              {cart.couponCode ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{cart.couponCode}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    {dict.checkout.removeCoupon}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder={dict.checkout.couponCode}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingCoupon}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={loadingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {loadingCoupon ? '...' : dict.checkout.applyCoupon}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">{dict.checkout.orderSummary}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{dict.cart.subtotal}</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{dict.cart.discount}</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">{dict.cart.total}</span>
                    <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Link
                href="/checkout"
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
              >
                {dict.cart.proceedToCheckout}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  lang: AppLang;
  onUpdateQuantity: (itemId: number, variantId: number | undefined, quantity: number) => void;
  onRemove: (itemId: number, variantId?: number) => void;
}

function CartItemCard({ item, lang, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const dict = getDict(lang);
  
  return (
    <div className="p-6 flex space-x-4">
      {/* Image */}
      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
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
            <p className="text-sm text-blue-600 mt-1">${item.price.toFixed(2)} each</p>
          </div>
          
          <button
            onClick={() => onRemove(item.id, item.variantId)}
            className="text-gray-400 hover:text-red-600 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quantity Controls & Total */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <span className="font-medium w-12 text-center">{item.quantity}</span>
            
            <button
              onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity + 1)}
              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="font-medium text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Stock Warning */}
        {item.maxQuantity && item.quantity >= item.maxQuantity && (
          <p className="text-sm text-orange-600 mt-2">{dict.cart.maxQuantityReached}</p>
        )}
      </div>
    </div>
  );
}