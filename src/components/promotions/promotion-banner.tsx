"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

type Promotion = {
  id: number;
  title: string;
  description: string;
  type: string;
  bannerImageUrl: string;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  priority: number;
};

interface PromotionBannerProps {
  storeSlug: string;
  className?: string;
}

export default function PromotionBanner({ storeSlug, className = "" }: PromotionBannerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch(`/api/storefront/${storeSlug}/promotions`);
        if (response.ok) {
          const data = await response.json();
          setPromotions(data.promotions || []);
        }
      } catch (error) {
        console.error("Failed to fetch promotions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeSlug) {
      fetchPromotions();
    }
  }, [storeSlug]);

  useEffect(() => {
    // Load dismissed banners from localStorage
    try {
      const dismissed = JSON.parse(localStorage.getItem(`dismissed-promotions-${storeSlug}`) || "[]");
      setDismissedIds(new Set(dismissed));
    } catch {
      // Ignore localStorage errors
    }
  }, [storeSlug]);

  const dismissPromotion = (promotionId: number) => {
    const newDismissed = new Set([...dismissedIds, promotionId]);
    setDismissedIds(newDismissed);
    
    // Save to localStorage
    try {
      localStorage.setItem(`dismissed-promotions-${storeSlug}`, JSON.stringify([...newDismissed]));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleBannerClick = (promotion: Promotion) => {
    if (promotion.linkUrl) {
      if (promotion.linkUrl.startsWith('http')) {
        window.open(promotion.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = promotion.linkUrl;
      }
    }
  };

  if (loading || promotions.length === 0) return null;

  // Filter out dismissed promotions and sort by priority
  const activePromotions = promotions
    .filter(p => !dismissedIds.has(p.id))
    .sort((a, b) => b.priority - a.priority);

  if (activePromotions.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {activePromotions.map((promotion) => (
        <div
          key={promotion.id}
          className={`relative rounded-xl p-4 text-center transition-all duration-200 ${
            promotion.linkUrl ? 'cursor-pointer hover:shadow-md' : ''
          }`}
          style={{
            backgroundColor: promotion.backgroundColor,
            color: promotion.textColor,
            backgroundImage: promotion.bannerImageUrl 
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${promotion.bannerImageUrl})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => handleBannerClick(promotion)}
        >
          <div className="relative">
            <h3 className="text-lg font-bold mb-1">{promotion.title}</h3>
            {promotion.description && (
              <p className="text-sm opacity-90">{promotion.description}</p>
            )}
            {promotion.linkUrl && (
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
                <span>Learn more</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            )}
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissPromotion(promotion.id);
            }}
            className="absolute right-2 top-2 rounded-full p-1 hover:bg-black/10 transition-colors"
            aria-label="Dismiss promotion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}