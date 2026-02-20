"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronDown, ThumbsUp, ThumbsDown, Camera, CheckCircle, Clock } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    reviews: "Reviews",
    writeReview: "Write a Review",
    sortBy: "Sort by",
    sortRecent: "Most Recent",
    sortHelpful: "Most Helpful", 
    sortRatingHigh: "Highest Rating",
    sortRatingLow: "Lowest Rating",
    noReviews: "No reviews yet",
    noReviewsHint: "Be the first to review this product",
    helpful: "Helpful",
    unhelpful: "Unhelpful",
    verified: "Verified Purchase",
    stars: "stars",
    outOf: "out of",
    ratingDistribution: "Rating Distribution",
    average: "Average",
    basedOn: "based on",
    reviewsCount: "reviews",
    loadMore: "Load More",
    loading: "Loading...",
    markHelpful: "Mark as helpful",
    markUnhelpful: "Mark as unhelpful",
    wasHelpful: "Was this helpful?",
    loginToReview: "Login to write a review",
    photoReviews: "Photo Reviews",
  },
  pt: {
    reviews: "Avaliações",
    writeReview: "Escrever Avaliação",
    sortBy: "Ordenar por",
    sortRecent: "Mais Recentes", 
    sortHelpful: "Mais Úteis",
    sortRatingHigh: "Maior Avaliação",
    sortRatingLow: "Menor Avaliação",
    noReviews: "Sem avaliações",
    noReviewsHint: "Seja o primeiro a avaliar este produto",
    helpful: "Útil",
    unhelpful: "Não útil",
    verified: "Compra Verificada",
    stars: "estrelas",
    outOf: "de",
    ratingDistribution: "Distribuição de Avaliações",
    average: "Média",
    basedOn: "baseado em",
    reviewsCount: "avaliações",
    loadMore: "Carregar Mais",
    loading: "A carregar...",
    markHelpful: "Marcar como útil",
    markUnhelpful: "Marcar como não útil",
    wasHelpful: "Foi útil?",
    loginToReview: "Entre para escrever uma avaliação",
    photoReviews: "Avaliações com Fotos",
  },
};

interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  imageUrls: string;
  helpful: number;
  unhelpful: number;
  verified: boolean;
  createdAt: string;
  customerName: string;
}

interface ReviewSummary {
  total: number;
  average: number;
  distribution: { [key: number]: number };
}

interface ProductReviewsProps {
  productId: number;
  onWriteReview?: () => void;
  customer?: any;
}

export default function ProductReviews({ productId, onWriteReview, customer }: ProductReviewsProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ total: 0, average: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState('recent');
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [userVotes, setUserVotes] = useState<Record<number, string>>({});

  const loadReviews = useCallback(async (sortBy: string, offset = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/products/${productId}/reviews?sort=${sortBy}&limit=10&offset=${offset}`);
      const data = await response.json();
      
      if (data.reviews) {
        const newReviews = append ? [...reviews, ...data.reviews] : data.reviews;
        setReviews(newReviews);

        // Load user votes for these reviews if customer is logged in
        if (customer && newReviews.length > 0) {
          loadUserVotes(newReviews.map((r: Review) => r.id));
        }
      }
      
      if (data.summary) {
        setSummary(data.summary);
      }

      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId, customer, reviews]);

  const loadUserVotes = useCallback(async (reviewIds: number[]) => {
    if (!customer || reviewIds.length === 0) return;

    try {
      const response = await fetch(`/api/products/${productId}/reviews/votes?reviewIds=${reviewIds.join(',')}`);
      const data = await response.json();
      
      if (data.votes) {
        setUserVotes(prev => ({ ...prev, ...data.votes }));
      }
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  }, [productId, customer]);

  useEffect(() => {
    loadReviews(sort);
  }, [sort, loadReviews]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setReviews([]);
  };

  const handleLoadMore = () => {
    loadReviews(sort, reviews.length, true);
  };

  const voteOnReview = async (reviewId: number, voteType: 'helpful' | 'unhelpful') => {
    if (!customer) return;
    
    try {
      const response = await fetch(`/api/products/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ voteType }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update review counts
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpful: data.helpful, unhelpful: data.unhelpful }
            : review
        ));

        // Update user votes
        if (data.action === 'removed') {
          setUserVotes(prev => {
            const newVotes = { ...prev };
            delete newVotes[reviewId];
            return newVotes;
          });
        } else {
          setUserVotes(prev => ({ ...prev, [reviewId]: voteType }));
        }
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
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

  const renderRatingDistribution = () => {
    if (summary.total === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">{t.ratingDistribution}</h4>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.distribution[rating] || 0;
          const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-3">
              <span className="w-8 text-xs text-slate-600">{rating} ★</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-xs text-slate-500">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const toggleExpandReview = (reviewId: number) => {
    setExpandedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const sortOptions = [
    { value: 'recent', label: t.sortRecent },
    { value: 'helpful', label: t.sortHelpful },
    { value: 'rating_high', label: t.sortRatingHigh },
    { value: 'rating_low', label: t.sortRatingLow },
  ];

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto" />
        <p className="mt-2 text-sm text-slate-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t.reviews}</h3>
          {summary.total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(Math.round(summary.average), 'sm')}
                <span className="text-sm font-semibold text-slate-700">{summary.average}</span>
                <span className="text-xs text-slate-500">
                  {t.outOf} 5 • {t.basedOn} {summary.total} {t.reviewsCount}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {onWriteReview && (
          <button
            onClick={onWriteReview}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            {t.writeReview}
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      {summary.total > 0 && (
        <div className="bg-slate-50 rounded-xl p-4">
          {renderRatingDistribution()}
        </div>
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{summary.total} {t.reviews}</span>
          
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noReviews}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noReviewsHint}</p>
          {onWriteReview && (
            <button
              onClick={onWriteReview}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              {t.writeReview}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const hasImages = review.imageUrls && review.imageUrls.trim();
            const images = hasImages ? review.imageUrls.split(',').filter(Boolean) : [];
            const shouldTruncate = review.content.length > 300;
            const displayContent = shouldTruncate && !isExpanded 
              ? review.content.slice(0, 300) + '...' 
              : review.content;

            return (
              <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-sm font-semibold text-slate-600">
                        {review.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{review.customerName}</span>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            {t.verified}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(review.rating)}
                        <span className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Title */}
                {review.title && (
                  <h4 className="mt-3 font-semibold text-slate-900">{review.title}</h4>
                )}

                {/* Review Content */}
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {displayContent}
                  {shouldTruncate && (
                    <button
                      onClick={() => toggleExpandReview(review.id)}
                      className="ml-1 text-green-600 hover:text-green-700 font-medium"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>

                {/* Review Images */}
                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex gap-2 flex-wrap">
                      {images.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url.trim()}
                          alt={`Review image ${index + 1}`}
                          className="h-20 w-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(url.trim(), '_blank')}
                        />
                      ))}
                      {images.length > 4 && (
                        <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Voting Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">{t.wasHelpful}</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => voteOnReview(review.id, 'helpful')}
                      disabled={!customer}
                      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        userVotes[review.id] === 'helpful'
                          ? 'text-green-600 font-medium'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {t.helpful} ({review.helpful || 0})
                    </button>
                    <button
                      onClick={() => voteOnReview(review.id, 'unhelpful')}
                      disabled={!customer}
                      className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        userVotes[review.id] === 'unhelpful'
                          ? 'text-red-600 font-medium'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      {t.unhelpful} ({review.unhelpful || 0})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}