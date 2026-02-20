"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language";
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Star, Store, MapPin,
  MessageCircle, CheckCircle, AlertCircle, Plus, Minus, Truck,
  Shield, RotateCcw
} from "lucide-react";
import { CartManager } from "@/lib/cart";
import { PlaceholderImage } from "@/components/placeholder-image";
import { getTheme } from "@/lib/theme-colors";
import ProductReviews from "@/components/product-reviews";
import ProductReviewSummary from "@/components/product-review-summary";
import ReviewForm from "@/components/review-form";
import { ProductJsonLd, StoreJsonLd } from "@/components/json-ld";
import SocialShare from "@/components/social-share";
import MessageSellerButton from "@/components/messaging/message-seller-button";

interface Props {
  product: any;
  seller: any;
  store: any;
  reviews: any[];
  slug: string;
}

export default function ProductPage({ product, seller, store, reviews, slug }: Props) {
  const { lang } = useLanguage();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const currentStore = store || seller;
  const theme = getTheme(currentStore?.themeColor || "green");

  // Parse product images
  const images = useMemo(() => {
    const imageList = [];
    if (product.imageUrl) imageList.push(product.imageUrl);

    if (product.imageUrls) {
      try {
        const additionalImages = JSON.parse(product.imageUrls);
        if (Array.isArray(additionalImages)) {
          imageList.push(...additionalImages);
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return imageList.length > 0 ? imageList : [null];
  }, [product.imageUrl, product.imageUrls]);

  // Calculate average rating
  const ratingData = useMemo(() => {
    const validReviews = reviews.filter(r => r.rating && r.rating > 0);
    if (validReviews.length === 0) return { average: 0, count: 0 };

    const sum = validReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / validReviews.length) * 10) / 10,
      count: validReviews.length
    };
  }, [reviews]);

  const price = parseFloat(product.price) || 0;
  const compareAtPrice = parseFloat(product.compareAtPrice) || 0;
  const hasDiscount = compareAtPrice > price;
  const discountPercent = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  const addToCart = () => {
    const cartItem = {
      id: product.id,
      storeId: currentStore.id,
      storeName: currentStore.name,
      name: product.name,
      price,
      imageUrl: images[0] || undefined,
      quantity,
    };

    CartManager.addItem(cartItem);

    // Show success message
    const event = new CustomEvent('show-toast', {
      detail: { message: lang === 'pt' ? 'Adicionado ao carrinho' : 'Added to cart', type: 'success' }
    });
    window.dispatchEvent(event);
  };

  const shareProduct = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.name,
          url,
        });
      } catch (err) {
        // Fall back to copying URL
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Link copied!', type: 'success' }
      });
      window.dispatchEvent(event);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      <ProductJsonLd
        name={product.name}
        description={product.shortDescription}
        image={images[0]}
        images={images.filter(Boolean)}
        price={price.toString()}
        currency={currentStore?.currency || "USD"}
        url={typeof window !== 'undefined' ? window.location.href : ""}
        seller={currentStore?.name}
        category={product.category}
        sku={product.id.toString()}
        availability={product.stockQuantity === 0 ? "OutOfStock" : "InStock"}
        aggregateRating={ratingData.count > 0 ? {
          ratingValue: ratingData.average,
          ratingCount: ratingData.count
        } : undefined}
        reviews={reviews.filter(r => r.rating && r.content).map(r => ({
          author: r.authorName,
          datePublished: r.createdAt?.toISOString() || new Date().toISOString(),
          reviewBody: r.content,
          reviewRating: r.rating
        }))}
      />

      <StoreJsonLd
        name={currentStore?.name}
        description={currentStore?.description}
        url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz"}/s/${slug}`}
        logo={currentStore?.logoUrl}
        image={currentStore?.bannerUrl}
        address={currentStore?.address}
        city={currentStore?.city}
        country={currentStore?.country}
        email={currentStore?.email}
        socialLinks={currentStore?.socialLinks}
      />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/s/${slug}`} className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-medium text-gray-900 truncate max-w-48">
                {product.name}
              </h1>
              <Link href={`/s/${slug}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                <Store className="h-3 w-3 mr-1" />
                {currentStore?.name}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <SocialShare 
              url={`/s/${slug}/products/${product.id}`}
              title={product.name}
              description={product.shortDescription}
              imageUrl={product.imageUrl}
              compact
            />
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`p-2 rounded-lg hover:bg-gray-100 ${isWishlisted ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Image Gallery */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="aspect-square relative">
            {images[selectedImageIndex] ? (
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <PlaceholderImage className="w-full h-full" />
            )}

            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                -{discountPercent}%
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex space-x-2 p-3 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    idx === selectedImageIndex ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PlaceholderImage className="w-full h-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

            <div className="mb-3">
              <ProductReviewSummary
                productId={product.id}
                size="md"
                showVerified={true}
                className=""
              />
            </div>

            <div className="flex items-center space-x-3">
              <span className={`text-3xl font-bold ${theme.text}`}>
                {currentStore?.currency || 'USD'} {price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-500 line-through">
                  {currentStore?.currency || 'USD'} {compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {product.category && (
              <div className="mt-3">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {product.category}
                </span>
              </div>
            )}
          </div>

          {product.shortDescription && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{product.shortDescription}</p>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-50"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-3 min-w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={addToCart}
              className={`flex-1 ${theme.bg} hover:opacity-90 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
            <div className="flex flex-col items-center space-y-1">
              <Truck className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-600">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-600">Secure Payment</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <RotateCcw className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-600">Easy Returns</span>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Store Information</h3>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {currentStore?.logoUrl ? (
                <Image
                  src={currentStore.logoUrl}
                  alt={currentStore.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{currentStore?.name}</h4>
              {currentStore?.description && (
                <p className="text-gray-600 text-sm mt-1">{currentStore.description}</p>
              )}
              {(currentStore?.city || currentStore?.country) && (
                <div className="flex items-center text-gray-500 text-sm mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {[currentStore?.city, currentStore?.country].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Link
                  href={`/s/${slug}`}
                  className={`inline-flex items-center ${theme.text} text-sm font-medium hover:underline`}
                >
                  Visit Store
                </Link>
                <MessageSellerButton
                  storeId={currentStore?.id}
                  sellerId={currentStore?.userId || seller?.id}
                  storeName={currentStore?.name}
                  productId={product.id}
                  productName={product.name}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Share Section */}
        <div className="bg-white rounded-lg p-6">
          <SocialShare 
            url={`/s/${slug}/products/${product.id}`}
            title={product.name}
            description={product.shortDescription || `Check out ${product.name} from ${currentStore?.name}`}
            imageUrl={product.imageUrl}
          />
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Reviews ({reviews.length})
            </h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className={`${theme.text} text-sm font-medium hover:underline`}
            >
              Write a Review
            </button>
          </div>

          {showReviewForm && (
            <div className="mb-6 p-4 border rounded-lg">
              <ReviewForm
                productId={product.id} productName={product.name}
                onSuccess={() => {
                  setShowReviewForm(false);
                  // Refresh page to show new review
                  window.location.reload();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          )}

          <ProductReviews
            productId={product.id}
            showViewAll={true}
            maxReviews={5}
          />
        </div>
      </div>
    </div>
  );
}