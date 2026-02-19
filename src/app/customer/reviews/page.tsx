"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language";
import { Star, MessageSquare, Loader2, CheckCircle, Clock, Eye, EyeOff } from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";

const dict = {
  en: {
    title: "My Reviews", subtitle: "Reviews you've written",
    loading: "Loading...", empty: "No reviews yet", emptyHint: "Your reviews will appear here after you write them.",
    published: "Published", pending: "Pending", hidden: "Hidden", verified: "Verified Purchase",
    helpful: "helpful", helpfulVotes: "people found this helpful", writeReview: "Write Review",
    viewStore: "View Store", stars: "stars",
  },
  pt: {
    title: "Minhas Avaliações", subtitle: "Avaliações que escreveu",
    loading: "A carregar...", empty: "Sem avaliações", emptyHint: "Suas avaliações aparecerão aqui depois de escrever.",
    published: "Publicada", pending: "Pendente", hidden: "Oculta", verified: "Compra Verificada",
    helpful: "útil", helpfulVotes: "pessoas acharam isto útil", writeReview: "Escrever Avaliação",
    viewStore: "Ver Loja", stars: "estrelas",
  },
};

type Review = {
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
};

export default function CustomerReviewsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/auth/customer/reviews", { credentials: "include" });
      if (response.status === 401) {
        router.push("/customer/login");
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "hidden": return <EyeOff className="h-4 w-4 text-slate-400" />;
      default: return <Eye className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-50 text-green-700";
      case "pending": return "bg-yellow-50 text-yellow-700";
      case "hidden": return "bg-slate-50 text-slate-600";
      default: return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    return (t as Record<string, string>)[status] || status;
  };

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
          <MessageSquare className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="mt-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.empty}</p>
          <p className="mt-1 text-xs text-slate-400">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="shrink-0">
                  {review.itemImageUrl ? (
                    <img 
                      src={review.itemImageUrl} 
                      alt={review.itemName} 
                      className="h-16 w-16 rounded-lg object-cover" 
                    />
                  ) : (
                    <PlaceholderImage className="h-16 w-16 rounded-lg" />
                  )}
                </div>

                {/* Review Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {review.itemName}
                      </h3>
                      <Link 
                        href={`/s/${review.sellerSlug}`}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        {review.sellerName}
                      </Link>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle className="h-3 w-3" /> {t.verified}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(review.status)}`}>
                        {getStatusIcon(review.status)} {getStatusLabel(review.status)}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mt-2 flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-slate-500">
                      {review.rating} {t.stars}
                    </span>
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h4 className="mt-2 text-sm font-medium text-slate-900">{review.title}</h4>
                  )}

                  {/* Review Content */}
                  {review.content && (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-3">{review.content}</p>
                  )}

                  {/* Review Images */}
                  {review.imageUrls && (
                    <div className="mt-3 flex gap-2">
                      {review.imageUrls.split(',').filter(Boolean).slice(0, 3).map((url, index) => (
                        <img 
                          key={index}
                          src={url.trim()} 
                          alt={`Review image ${index + 1}`}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ))}
                      {review.imageUrls.split(',').filter(Boolean).length > 3 && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                          +{review.imageUrls.split(',').filter(Boolean).length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {review.helpful > 0 && (
                        <span>{review.helpful} {review.helpful === 1 ? '1 person' : `${review.helpful} ${t.helpfulVotes}`}</span>
                      )}
                    </div>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}