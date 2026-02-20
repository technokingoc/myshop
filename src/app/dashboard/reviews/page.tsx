"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import {
  Star, MessageSquare, Loader2, CheckCircle, Clock, EyeOff, Eye,
  ThumbsUp, Calendar, User, Package, Camera, MoreHorizontal,
  Filter, Search, BarChart3, TrendingUp
} from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";
// import ReviewAnalyticsDashboard from "@/components/review-analytics-dashboard";
// import SellerResponseForm from "@/components/seller-response-form";

const dict = {
  en: {
    title: "Review Management",
    subtitle: "Manage customer reviews for your products",
    loading: "Loading reviews...",
    noReviews: "No reviews found",
    noReviewsHint: "Customer reviews will appear here when they're submitted.",
    
    // Stats
    totalReviews: "Total Reviews",
    published: "Published",
    pending: "Pending",
    hidden: "Hidden",
    
    // Filters
    allReviews: "All Reviews",
    publishedReviews: "Published",
    pendingReviews: "Pending",
    hiddenReviews: "Hidden",
    
    // Review actions
    publish: "Publish",
    hide: "Hide",
    unhide: "Unhide",
    setPending: "Set Pending",
    
    // Review details
    verifiedPurchase: "Verified Purchase",
    helpful: "helpful",
    stars: "stars",
    reviewFor: "Review for",
    by: "by",
    
    // Status labels
    statusPublished: "Published",
    statusPending: "Pending Moderation",
    statusHidden: "Hidden",
    
    // Messages
    statusUpdated: "Review status updated successfully",
    updateError: "Error updating review status",
    
    search: "Search reviews...",
    filterByStatus: "Filter by status",
    sortBy: "Sort by",
    sortRecent: "Most Recent",
    sortRating: "Rating",
    sortHelpful: "Most Helpful",
    
    // New S60 features
    reviews: "Reviews",
    analytics: "Analytics",
    respond: "Respond",
    responsePosted: "Response posted successfully",
    viewResponse: "View Response",
  },
  pt: {
    title: "Gestão de Avaliações",
    subtitle: "Gerir avaliações de clientes dos seus produtos",
    loading: "A carregar avaliações...",
    noReviews: "Nenhuma avaliação encontrada",
    noReviewsHint: "As avaliações de clientes aparecerão aqui quando forem submetidas.",
    
    // Stats
    totalReviews: "Total de Avaliações",
    published: "Publicadas",
    pending: "Pendentes",
    hidden: "Ocultas",
    
    // Filters
    allReviews: "Todas as Avaliações",
    publishedReviews: "Publicadas",
    pendingReviews: "Pendentes", 
    hiddenReviews: "Ocultas",
    
    // Review actions
    publish: "Publicar",
    hide: "Ocultar",
    unhide: "Mostrar",
    setPending: "Marcar Pendente",
    
    // Review details
    verifiedPurchase: "Compra Verificada",
    helpful: "útil",
    stars: "estrelas",
    reviewFor: "Avaliação para",
    by: "por",
    
    // Status labels
    statusPublished: "Publicada",
    statusPending: "Moderação Pendente",
    statusHidden: "Oculta",
    
    // Messages
    statusUpdated: "Estado da avaliação atualizado com sucesso",
    updateError: "Erro ao atualizar estado da avaliação",
    
    search: "Pesquisar avaliações...",
    filterByStatus: "Filtrar por estado",
    sortBy: "Ordenar por",
    sortRecent: "Mais Recentes",
    sortRating: "Classificação",
    sortHelpful: "Mais Úteis",
    
    // New S60 features
    reviews: "Avaliações",
    analytics: "Análises",
    respond: "Responder",
    responsePosted: "Resposta publicada com sucesso",
    viewResponse: "Ver Resposta",
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
  customerName: string;
  productName: string;
  productId: number;
  productImageUrl: string;
  sellerResponse?: {
    id: number;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ReviewSummary {
  total: number;
  published: number;
  pending: number;
  hidden: number;
}

export default function SellerReviewsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ total: 0, published: 0, pending: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [showingResponseForm, setShowingResponseForm] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/reviews?status=${statusFilter}&limit=50`, {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      
      if (data.reviews) {
        setReviews(data.reviews);
      }
      
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (reviewId: number, newStatus: string) => {
    try {
      setUpdating(reviewId);
      
      const response = await fetch('/api/dashboard/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reviewId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Update the review in the local state
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, status: newStatus }
            : review
        ));
        
        // Update summary counts
        fetchReviews();
        
        // Show success message (you could implement a toast here)
        console.log(t.statusUpdated);
      } else {
        console.error(t.updateError);
      }
    } catch (error) {
      console.error("Error updating review status:", error);
    } finally {
      setUpdating(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <CheckCircle className="h-3 w-3" />
            {t.statusPublished}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
            <Clock className="h-3 w-3" />
            {t.statusPending}
          </span>
        );
      case "hidden":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            <EyeOff className="h-3 w-3" />
            {t.statusHidden}
          </span>
        );
      default:
        return null;
    }
  };

  const getActionButtons = (review: Review) => {
    const buttons = [];
    
    if (review.status === 'pending') {
      buttons.push(
        <button
          key="publish"
          onClick={() => updateReviewStatus(review.id, 'published')}
          disabled={updating === review.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <CheckCircle className="h-3 w-3" />
          {t.publish}
        </button>
      );
      
      buttons.push(
        <button
          key="hide"
          onClick={() => updateReviewStatus(review.id, 'hidden')}
          disabled={updating === review.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <EyeOff className="h-3 w-3" />
          {t.hide}
        </button>
      );
    }
    
    if (review.status === 'published') {
      buttons.push(
        <button
          key="hide"
          onClick={() => updateReviewStatus(review.id, 'hidden')}
          disabled={updating === review.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <EyeOff className="h-3 w-3" />
          {t.hide}
        </button>
      );
      
      buttons.push(
        <button
          key="pending"
          onClick={() => updateReviewStatus(review.id, 'pending')}
          disabled={updating === review.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          <Clock className="h-3 w-3" />
          {t.setPending}
        </button>
      );
    }
    
    if (review.status === 'hidden') {
      buttons.push(
        <button
          key="publish"
          onClick={() => updateReviewStatus(review.id, 'published')}
          disabled={updating === review.id}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Eye className="h-3 w-3" />
          {t.unhide}
        </button>
      );
    }
    
    return buttons;
  };

  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      review.productName.toLowerCase().includes(query) ||
      review.customerName.toLowerCase().includes(query) ||
      review.title.toLowerCase().includes(query) ||
      review.content.toLowerCase().includes(query)
    );
  });

  const statusFilters = [
    { value: 'all', label: t.allReviews, count: summary.total },
    { value: 'published', label: t.publishedReviews, count: summary.published },
    { value: 'pending', label: t.pendingReviews, count: summary.pending },
    { value: 'hidden', label: t.hiddenReviews, count: summary.hidden },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <MessageSquare className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'reviews'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {t.reviews}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {t.analytics}
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'analytics' ? (
        <div className="bg-white rounded-lg p-6">
          {/* <ReviewAnalyticsDashboard /> */}
          <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
          <p className="text-gray-500">Analytics dashboard will be available soon.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.totalReviews}</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.published}</p>
              <p className="text-2xl font-bold text-green-600">{summary.published}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.pending}</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.hidden}</p>
              <p className="text-2xl font-bold text-slate-600">{summary.hidden}</p>
            </div>
            <EyeOff className="h-8 w-8 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  statusFilter === filter.value
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noReviews}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noReviewsHint}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const hasImages = review.imageUrls && review.imageUrls.trim();
            const images = hasImages ? review.imageUrls.split(',').filter(Boolean) : [];

            return (
              <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Product Image */}
                    <div className="shrink-0">
                      {review.productImageUrl ? (
                        <img 
                          src={review.productImageUrl} 
                          alt={review.productName}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <PlaceholderImage className="h-16 w-16 rounded-lg" />
                      )}
                    </div>

                    {/* Review Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 truncate">{review.productName}</h4>
                        {getStatusBadge(review.status)}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {review.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.verified && (
                          <span className="text-green-600 font-medium">
                            {t.verifiedPurchase}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-slate-500">
                          {review.rating} {t.stars}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {updating === review.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      getActionButtons(review)
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="pl-20">
                  {review.title && (
                    <h5 className="font-medium text-slate-900 mb-2">{review.title}</h5>
                  )}
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {review.content}
                  </p>

                  {/* Review Images */}
                  {images.length > 0 && (
                    <div className="flex gap-2 mb-3">
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
                        <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Helpful Count */}
                  {review.helpful > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpful} {t.helpful}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
}