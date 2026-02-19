"use client";

import { useEffect } from "react";
import { CartManager } from "@/lib/cart";

interface FlashSaleAutoApplyProps {
  storeId?: number;
  storeName?: string;
}

export default function FlashSaleAutoApply({ storeId, storeName }: FlashSaleAutoApplyProps) {
  useEffect(() => {
    const checkFlashSales = async () => {
      // Only check if we have store info and items in cart
      const cart = CartManager.getCart();
      if (!storeId || cart.items.length === 0) return;

      // Skip if user has already applied a coupon (coupon takes precedence)
      if (cart.couponCode && cart.discountAmount) return;

      try {
        const subtotal = CartManager.getSubtotal();
        const productIds = cart.items.map(item => item.id);

        const response = await fetch('/api/flash-sales/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: storeId,
            orderTotal: subtotal,
            productIds
          })
        });

        const result = await response.json();

        if (result.valid && result.flashSale) {
          // Check if this is a different/better flash sale than currently applied
          const currentFlashSaleDiscount = cart.flashSaleDiscount || 0;
          
          if (result.discount > currentFlashSaleDiscount) {
            CartManager.applyFlashSale(
              result.flashSale.id,
              result.flashSale.name,
              result.discount
            );
            
            // Show toast notification
            const event = new CustomEvent('show-toast', {
              detail: { 
                message: `Flash Sale Applied: ${result.flashSale.name}! You save $${result.discount.toFixed(2)}`,
                type: 'success' 
              }
            });
            window.dispatchEvent(event);
          }
        } else {
          // No valid flash sale, remove any existing one
          if (cart.flashSaleId) {
            CartManager.removeFlashSale();
          }
        }
      } catch (error) {
        console.error('Failed to check flash sales:', error);
      }
    };

    // Check immediately and set up interval for periodic checks
    checkFlashSales();
    
    // Check every 30 seconds for new flash sales or expired ones
    const interval = setInterval(checkFlashSales, 30000);
    
    return () => clearInterval(interval);
  }, [storeId]);

  // This component doesn't render anything
  return null;
}