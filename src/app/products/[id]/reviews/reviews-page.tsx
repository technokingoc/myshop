"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language";
import { ArrowLeft, Star, Store } from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";
import { getTheme } from "@/lib/theme-colors";
import ProductReviews from "@/components/product-reviews";
import ReviewForm from "@/components/review-form";
interface Props {
  product: any;
  seller: any;
  store: any;
  customer: any;
}

const dict = {
  en: {
    reviews: "Reviews & Ratings",
    backToProduct: "Back to Product",
    writeReview: "Write a Review",
    productDetails: "Product Details",
    averageRating: "Average Rating",
    totalReviews: "Total Reviews",
    starBreakdown: "Rating Breakdown",
  },
  pt: {
    reviews: "Avaliações",
    backToProduct: "Voltar ao Produto",
    writeReview: "Escrever Avaliação",
    productDetails: "Detalhes do Produto",
    averageRating: "Avaliação Média",
    totalReviews: "Total de Avaliações",
    starBreakdown: "Distribuição de Avaliações",
  },
};

export default function ProductReviewsPage({ product, seller, store, customer }: Props) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [showReviewForm, setShowReviewForm] = useState(false);

  const currentStore = store || seller;
  const theme = getTheme(currentStore?.themeColor || "green");
  const storeSlug = currentStore?.slug || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link 
                href={storeSlug ? `/s/${storeSlug}/product/${product.id}` : `/products/${product.id}`} 
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-medium text-gray-900">
                  {t.reviews}
                </h1>
                <p className="text-sm text-gray-500 truncate max-w-48">
                  {product.name}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowReviewForm(true)}
              className={`px-4 py-2 ${theme.bg} text-white rounded-lg text-sm font-medium hover:opacity-90`}
            >
              {t.writeReview}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Product Info Card */}
        <div className="bg-white rounded-lg p-6 mb-6 border">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PlaceholderImage className="w-full h-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
              
              <div className="flex items-center space-x-2 mb-3">
                <Link
                  href={storeSlug ? `/s/${storeSlug}` : '#'}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  <Store className="h-4 w-4 mr-1" />
                  {currentStore?.name}
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`text-2xl font-bold ${theme.text}`}>
                  {currentStore?.currency || 'USD'} {parseFloat(product.price).toFixed(2)}
                </span>
                
                {product.category && (
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {product.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Review Form Modal/Card */}
        {showReviewForm && (
          <div className="mb-6">
            <ReviewForm
              productId={product.id}
              productName={product.name}
              customer={customer}
              onSuccess={() => {
                setShowReviewForm(false);
                // Refresh reviews will be handled by ProductReviews component
                window.location.reload();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <ProductReviews
              productId={product.id}
              customer={customer}
              onWriteReview={() => setShowReviewForm(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}