"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    reviews: "reviews",
    review: "review", 
    noReviews: "No reviews",
    verified: "verified",
    avgRating: "Average",
    outOf: "out of",
    ratingBreakdown: "Rating breakdown",
  },
  pt: {
    reviews: "avaliações",
    review: "avaliação",
    noReviews: "Sem avaliações",
    verified: "verificada",
    avgRating: "Média",
    outOf: "de",
    ratingBreakdown: "Distribuição",
  },
};

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { [key: number]: number };
}

interface ProductReviewSummaryProps {
  productId: number;
  className?: string;
  showCount?: boolean;
  showBreakdown?: boolean;
  showVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'detailed' | 'compact';
}

export default function ProductReviewSummary({ 
  productId, 
  className = "",
  showCount = true,
  showBreakdown = false,
  showVerified = false,
  size = 'sm',
  variant = 'default'
}: ProductReviewSummaryProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews?limit=0`);
        const data = await response.json();
        
        if (data.summary) {
          setSummary(data.summary);
          
          // Count verified reviews if needed
          if (showVerified && data.reviews) {
            const verified = data.reviews.filter((r: any) => r.verified).length;
            setVerifiedCount(verified);
          }
        }
      } catch (error) {
        console.error('Error loading review summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [productId, showVerified]);

  const renderStars = (rating: number, useActual = false) => {
    const displayRating = useActual ? rating : Math.round(rating);
    const starSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= displayRating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingBreakdown = () => {
    if (!summary || summary.total === 0) return null;

    return (
      <div className="mt-3 space-y-1.5">
        <div className="text-xs font-medium text-gray-700 mb-2">{t.ratingBreakdown}</div>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.distribution[rating] || 0;
          const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-gray-600 text-right">{rating}</span>
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-16">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-gray-500 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className={`${size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} bg-slate-200 rounded`} />
          ))}
        </div>
        {showCount && (
          <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
        )}
      </div>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        {renderStars(0)}
        {showCount && (
          <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{t.noReviews}</span>
        )}
      </div>
    );
  }

  const textSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs';

  // Compact variant - minimal space
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {renderStars(summary.average)}
        <span className="text-xs text-gray-600 font-medium">
          {summary.average.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({summary.total})
        </span>
      </div>
    );
  }

  // Detailed variant - with breakdown
  if (variant === 'detailed') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            {renderStars(summary.average, true)}
            <span className="text-lg font-bold text-gray-900">
              {summary.average.toFixed(1)}
            </span>
            <span className="text-sm text-gray-600">
              {t.outOf} 5
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-1">
          {summary.total} {summary.total === 1 ? t.review : t.reviews}
          {showVerified && verifiedCount > 0 && (
            <span className="text-green-600 ml-2 inline-flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {verifiedCount} {t.verified}
            </span>
          )}
        </div>

        {showBreakdown && renderRatingBreakdown()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        {renderStars(summary.average)}
        {showCount && (
          <div className="flex items-center gap-1">
            <span className={`${textSize} text-slate-600 font-medium`}>
              {summary.average.toFixed(1)} ({summary.total})
            </span>
            {showVerified && verifiedCount > 0 && (
              <span className={`${textSize} text-green-600 inline-flex items-center gap-0.5`}>
                <CheckCircle className="h-3 w-3" />
                {verifiedCount} {t.verified}
              </span>
            )}
          </div>
        )}
      </div>
      
      {showBreakdown && renderRatingBreakdown()}
    </div>
  );
}