'use client';

import { useState, useEffect } from 'react';
import { CartManager, CartItem } from '@/lib/cart';
import { ShoppingCart, Plus, Minus, X, ShoppingBag } from 'lucide-react';
import { getDict, type AppLang } from '@/lib/i18n';

interface CartSummaryProps {
  lang: AppLang;
  onCheckout?: () => void;
  className?: string;
}

export default function CartSummary({ lang, onCheckout, className = "" }: CartSummaryProps) {
  const [cart, setCart] = useState(CartManager.getCart());
  const [isOpen, setIsOpen] = useState(false);
  const dict = getDict(lang);
  
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(CartManager.getCart());
    };
    
    // Listen for cart changes
    window.addEventListener('storage', handleStorageChange);
    // Custom event for cart updates within the same tab
    window.addEventListener('cart-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleStorageChange);
    };
  }, []);
  
  const updateQuantity = (itemId: number, variantId: number | undefined, newQuantity: number) => {
    CartManager.updateQuantity(itemId, variantId, newQuantity);
    setCart(CartManager.getCart());
    window.dispatchEvent(new CustomEvent('cart-updated'));
  };
  
  const removeItem = (itemId: number, variantId?: number) => {
    CartManager.removeItem(itemId, variantId);
    setCart(CartManager.getCart());
    window.dispatchEvent(new CustomEvent('cart-updated'));
  };
  
  const itemCount = CartManager.getItemCount();
  const subtotal = CartManager.getSubtotal();
  const total = CartManager.getTotal();
  
  if (itemCount === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Cart Icon & Counter */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
      >
        <ShoppingCart className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
      
      {/* Cart Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Cart Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{dict.cart.title}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.items.map((item) => (
                <CartItemRow
                  key={`${item.id}-${item.variantId || 'main'}`}
                  item={item}
                  lang={lang}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t space-y-3">
              {/* Coupon Info */}
              {cart.couponCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">{dict.checkout.couponCode}: {cart.couponCode}</span>
                  <span className="text-green-600 font-medium">-${cart.discountAmount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              
              {/* Total */}
              <div className="flex items-center justify-between font-medium">
                <span>{dict.cart.total}</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCheckout?.();
                }}
                className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {dict.cart.proceedToCheckout}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  lang: AppLang;
  onUpdateQuantity: (itemId: number, variantId: number | undefined, quantity: number) => void;
  onRemove: (itemId: number, variantId?: number) => void;
}

function CartItemRow({ item, lang, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const dict = getDict(lang);
  
  return (
    <div className="flex items-start space-x-3">
      {/* Image */}
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
        {item.variantName && (
          <p className="text-xs text-gray-500 truncate">{item.variantName}</p>
        )}
        <p className="text-xs text-gray-500">{item.storeName}</p>
        
        {/* Price & Quantity Controls */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            
            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
            
            <button
              onClick={() => onUpdateQuantity(item.id, item.variantId, item.quantity + 1)}
              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            <button
              onClick={() => onRemove(item.id, item.variantId)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              {dict.cart.removeFromCart}
            </button>
          </div>
        </div>
        
        {/* Stock Warning */}
        {item.maxQuantity && item.quantity >= item.maxQuantity && (
          <p className="text-xs text-orange-600 mt-1">{dict.cart.maxQuantityReached}</p>
        )}
      </div>
    </div>
  );
}