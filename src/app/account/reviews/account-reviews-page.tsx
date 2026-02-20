"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import {
  Star, Calendar, Store, Package, Clock, CheckCircle, 
  Eye, Edit, Trash2, Filter, Search
} from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";
// import { getCustomerSession } from "@/lib/customer-session"; // Removed - server-side only

const dict = {
  en: {
    myReviews: "My Reviews",
    noReviews: "No reviews yet",
    noReviewsHint: "Reviews you write will appear here",
    totalReviews: "Total Reviews",
    averageRating: "Your Average Rating",
    verified: "Verified Purchase",
    pending: "Pending Approval",
    published: "Published",
    viewProduct: "View Product", 
    editReview: "Edit Review",
    deleteReview: "Delete Review",
    filterBy: "Filter by",
    filterAll: "All Reviews",
    filterPublished: "Published",
    filterPending: "Pending",
    filterVerified: "Verified Purchases",
    searchPlaceholder: "Search your reviews...",
    reviewedOn: "Reviewed on",
    rating: "Rating",
    sortBy: "Sort by",
    sortNewest: "Newest First",
    sortOldest: "Oldest First",
    sortRatingHigh: "Highest Rating",
    sortRatingLow: "Lowest Rating",
    loading: "Loading your reviews...",
    error: "Error loading reviews",
    deleteConfirm: "Are you sure you want to delete this review?",
    deleteSuccess: "Review deleted successfully",
    helpfulVotes: "helpful votes",
  },
  pt: {
    myReviews: "Minhas Avaliações",
    noReviews: "Nenhuma avaliação ainda",
    noReviewsHint: "As avaliações que escrever aparecerão aqui",
    totalReviews: "Total de Avaliações",
    averageRating: "Sua Avaliação Média",
    verified: "Compra Verificada",
    pending: "Aguardando Aprovação",
    published: "Publicado",
    viewProduct: "Ver Produto",
    editReview: "Editar Avaliação",
    deleteReview: "Excluir Avaliação",
    filterBy: "Filtrar por",
    filterAll: "Todas as Avaliações",
    filterPublished: "Publicadas",
    filterPending: "Pendentes",
    filterVerified: "Compras Verificadas",
    searchPlaceholder: "Buscar suas avaliações...",
    reviewedOn: "Avaliado em",
    rating: "Classificação",
    sortBy: "Ordenar por",
    sortNewest: "Mais Recentes",
    sortOldest: "Mais Antigas",
    sortRatingHigh: "Maior Classificação",
    sortRatingLow: "Menor Classificação",
    loading: "Carregando suas avaliações...",
    error: "Erro ao carregar avaliações",
    deleteConfirm: "Tem certeza que deseja excluir esta avaliação?",
    deleteSuccess: "Avaliação excluída com sucesso",
    helpfulVotes: "votos úteis",
  },
};

interface Review {
  id: number;
  rating: number;
  title: string;
  content: string;
  imageUrls: string;
  helpful: number;
  verified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  itemName: string;
  itemImageUrl: string;
  sellerName: string;
  sellerSlug: string;
}

export default function AccountReviewsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Load customer reviews
  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch('/api/auth/customer/reviews', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          router.push('/login?redirect=/account/reviews');
          return;
        }
        
        if (response.ok) {
          const reviewsData = await response.json();
          setReviews(reviewsData);
          // Assume we have a customer if we got reviews successfully
          setCustomer({ authenticated: true });
        } else {
          console.error('Failed to load reviews');
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, [router]);

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (filter === "published" && review.status !== "published") return false;
      if (filter === "pending" && review.status !== "pending") return false;
      if (filter === "verified" && !review.verified) return false;
      if (searchQuery && !review.itemName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !review.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !review.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rating_high":
          return b.rating - a.rating;
        case "rating_low":
          return a.rating - b.rating;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Calculate stats
  const stats = {
    total: reviews.length,
    average: reviews.length > 0 
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0,
    verified: reviews.filter(r => r.verified).length,
    published: reviews.filter(r => r.status === "published").length,
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/auth/customer/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        // Show success toast
        const event = new CustomEvent('show-toast', {
          detail: { message: t.deleteSuccess, type: 'success' }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      const event = new CustomEvent('show-toast', {
        detail: { message: t.error, type: 'error' }
      });
      window.dispatchEvent(event);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.myReviews}</h1>
              <p className="text-gray-600 mt-1">
                {stats.total} {t.totalReviews.toLowerCase()}
                {stats.total > 0 && ` • ${stats.average} ${t.averageRating.toLowerCase()}`}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">{t.totalReviews}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.average}</div>
                <div className="text-sm text-gray-500">{t.averageRating}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
                <div className="text-sm text-gray-500">{t.verified}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters and Search */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">{t.filterAll}</option>
                  <option value="published">{t.filterPublished}</option>
                  <option value="pending">{t.filterPending}</option>
                  <option value="verified">{t.filterVerified}</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="newest">{t.sortNewest}</option>
                  <option value="oldest">{t.sortOldest}</option>
                  <option value="rating_high">{t.sortRatingHigh}</option>
                  <option value="rating_low">{t.sortRatingLow}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg border text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{t.noReviews}</h3>
            <p className="mt-2 text-gray-500">{t.noReviewsHint}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const images = review.imageUrls ? review.imageUrls.split(',').filter(Boolean) : [];
              
              return (
                <div key={review.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {review.itemImageUrl ? (
                        <Image
                          src={review.itemImageUrl}
                          alt={review.itemName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PlaceholderImage className="w-full h-full" />
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.itemName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Store className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{review.sellerName}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/s/${review.sellerSlug}/product/${review.id}`}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                            title={t.viewProduct}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                            title={t.deleteReview}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Rating and Status */}
                      <div className="flex items-center gap-4 mt-3">
                        {renderStars(review.rating)}
                        
                        <div className="flex items-center gap-2">
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              {t.verified}
                            </span>
                          )}
                          
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            review.status === 'published' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {review.status === 'published' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {review.status === 'published' ? t.published : t.pending}
                          </span>
                        </div>
                      </div>

                      {/* Review Title */}
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mt-3">{review.title}</h4>
                      )}

                      {/* Review Content */}
                      <p className="text-gray-700 mt-2 leading-relaxed">{review.content}</p>

                      {/* Review Images */}
                      {images.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {images.slice(0, 4).map((url, index) => (
                            <img
                              key={index}
                              src={url.trim()}
                              alt={`Review image ${index + 1}`}
                              className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(url.trim(), '_blank')}
                            />
                          ))}
                          {images.length > 4 && (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                              +{images.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Meta */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {t.reviewedOn} {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                          
                          {review.helpful > 0 && (
                            <div>
                              {review.helpful} {t.helpfulVotes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}