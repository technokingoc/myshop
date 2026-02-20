"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { [key: number]: number };
}

interface ProductReviewSummaryProps {
  productId: number;
  className?: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProductReviewSummary({ 
  productId, 
  className = "",
  showCount = true,
  size = 'sm'
}: ProductReviewSummaryProps) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews?limit=0`);
        const data = await response.json();
        
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Error loading review summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [productId]);

  const renderStars = (rating: number) => {
    const starSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
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
          <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'}`}>No reviews</span>
        )}
      </div>
    );
  }

  const roundedAverage = Math.round(summary.average);
  const textSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-xs';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderStars(roundedAverage)}
      {showCount && (
        <span className={`${textSize} text-slate-600 font-medium`}>
          {summary.average.toFixed(1)} ({summary.total})
        </span>
      )}
    </div>
  );
}