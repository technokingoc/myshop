"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, X } from "lucide-react";

type FlashSale = {
  id: number;
  name: string;
  description: string;
  discountType: string;
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  maxUses: number;
  usedCount: number;
  startTime: string;
  endTime: string;
  products: string;
  bannerText: string;
  bannerColor: string;
  showCountdown: boolean;
};

interface FlashSaleBannerProps {
  storeSlug: string;
  className?: string;
}

function formatTimeRemaining(endTime: string): { display: string; isUrgent: boolean } | null {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;
  
  if (diff <= 0) return null;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  const isUrgent = diff <= 3600000; // 1 hour
  
  if (hours > 0) {
    return { 
      display: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, 
      isUrgent 
    };
  }
  
  return { 
    display: `${minutes}:${seconds.toString().padStart(2, '0')}`, 
    isUrgent: true 
  };
}

export default function FlashSaleBanner({ storeSlug, className = "" }: FlashSaleBannerProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const response = await fetch(`/api/storefront/${storeSlug}/promotions`);
        if (response.ok) {
          const data = await response.json();
          setFlashSales(data.flashSales || []);
        }
      } catch (error) {
        console.error("Failed to fetch flash sales:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug) {
      fetchFlashSales();
    }
  }, [storeSlug]);

  useEffect(() => {
    // Load dismissed banners from localStorage
    try {
      const dismissed = JSON.parse(localStorage.getItem(`dismissed-flash-sales-${storeSlug}`) || "[]");
      setDismissedIds(new Set(dismissed));
    } catch {
      // Ignore localStorage errors
    }
  }, [storeSlug]);

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const dismissFlashSale = (saleId: number) => {
    const newDismissed = new Set([...dismissedIds, saleId]);
    setDismissedIds(newDismissed);
    
    // Save to localStorage
    try {
      localStorage.setItem(`dismissed-flash-sales-${storeSlug}`, JSON.stringify([...newDismissed]));
    } catch {
      // Ignore localStorage errors
    }
  };

  if (loading || flashSales.length === 0) return null;

  // Filter out dismissed and expired flash sales
  const activeFlashSales = flashSales
    .filter(sale => {
      if (dismissedIds.has(sale.id)) return false;
      const now = new Date().getTime();
      const end = new Date(sale.endTime).getTime();
      return end > now;
    })
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()); // earliest ending first

  if (activeFlashSales.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {activeFlashSales.map((sale) => {
        const timeRemaining = sale.showCountdown ? formatTimeRemaining(sale.endTime) : null;
        
        return (
          <div
            key={sale.id}
            className="relative rounded-xl p-4 text-center transition-all duration-200"
            style={{
              backgroundColor: sale.bannerColor,
              color: '#ffffff',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="text-lg font-bold">
                {sale.bannerText || `Flash Sale: ${sale.discountType === 'percentage' ? sale.discountValue + '% OFF' : '$' + sale.discountValue + ' OFF'}!`}
              </span>
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            
            {sale.description && (
              <p className="text-sm opacity-90 mb-2">{sale.description}</p>
            )}
            
            {timeRemaining && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
                timeRemaining.isUrgent 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-white/20 backdrop-blur'
              }`}>
                <Clock className="h-4 w-4" />
                <span>Ends in {timeRemaining.display}</span>
              </div>
            )}
            
            {sale.maxUses > 0 && sale.usedCount < sale.maxUses && (
              <div className="mt-2 text-xs opacity-75">
                {sale.maxUses - sale.usedCount} left!
              </div>
            )}
            
            {Number(sale.minOrderAmount) > 0 && (
              <div className="mt-1 text-xs opacity-75">
                Minimum order: ${sale.minOrderAmount}
              </div>
            )}
            
            {/* Dismiss button */}
            <button
              onClick={() => dismissFlashSale(sale.id)}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-black/10 transition-colors"
              aria-label="Dismiss flash sale"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}