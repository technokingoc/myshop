"use client";

import { useState } from "react";
import { Star, Camera, X, Upload, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language";

const dict = {
  en: {
    writeReview: "Write a Review",
    rating: "Rating",
    selectRating: "Select your rating",
    title: "Review Title (Optional)",
    titlePlaceholder: "Summarize your experience...",
    content: "Your Review",
    contentPlaceholder: "Tell others about your experience with this product. What did you like or dislike?",
    addPhotos: "Add Photos (Optional)",
    addPhotosHint: "Upload up to 5 photos to show how the product looks",
    dragDrop: "Drag & drop images here or click to browse",
    maxPhotos: "Maximum 5 photos",
    submit: "Submit Review",
    submitting: "Submitting...",
    cancel: "Cancel",
    error: "Error submitting review. Please try again.",
    success: "Review submitted successfully!",
    successHint: "Your review is under moderation and will be published once approved by the seller.",
    ratingRequired: "Please select a rating",
    contentRequired: "Please write your review",
    loginRequired: "Please login to write a review",
    alreadyReviewed: "You have already reviewed this product",
    imageUploadError: "Error uploading image. Please try again.",
    removeImage: "Remove image",
    excellent: "Excellent",
    good: "Good", 
    average: "Average",
    poor: "Poor",
    terrible: "Terrible",
  },
  pt: {
    writeReview: "Escrever Avaliação",
    rating: "Classificação",
    selectRating: "Selecione sua classificação",
    title: "Título da Avaliação (Opcional)",
    titlePlaceholder: "Resuma sua experiência...",
    content: "Sua Avaliação",
    contentPlaceholder: "Conte aos outros sobre sua experiência com este produto. O que gostou ou não gostou?",
    addPhotos: "Adicionar Fotos (Opcional)",
    addPhotosHint: "Carregue até 5 fotos para mostrar como o produto fica",
    dragDrop: "Arraste e solte imagens aqui ou clique para procurar",
    maxPhotos: "Máximo 5 fotos",
    submit: "Enviar Avaliação",
    submitting: "A enviar...",
    cancel: "Cancelar",
    error: "Erro ao enviar avaliação. Tente novamente.",
    success: "Avaliação enviada com sucesso!",
    successHint: "Sua avaliação está em moderação e será publicada após aprovação do vendedor.",
    ratingRequired: "Selecione uma classificação",
    contentRequired: "Escreva sua avaliação",
    loginRequired: "Entre para escrever uma avaliação",
    alreadyReviewed: "Já avaliou este produto",
    imageUploadError: "Erro ao carregar imagem. Tente novamente.",
    removeImage: "Remover imagem",
    excellent: "Excelente",
    good: "Bom",
    average: "Médio",
    poor: "Fraco",
    terrible: "Terrível",
  },
};

interface ReviewFormProps {
  productId: number;
  productName: string;
  customer?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ 
  productId, 
  productName, 
  customer, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const ratingLabels = [t.terrible, t.poor, t.average, t.good, t.excellent];

  const handleImageUpload = async (files: FileList) => {
    if (images.length + files.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Image upload error:', error);
      setError(t.imageUploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) {
      setError(t.loginRequired);
      return;
    }

    if (!rating) {
      setError(t.ratingRequired);
      return;
    }

    if (!content.trim()) {
      setError(t.contentRequired);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/products/${productId}/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          title: title.trim(),
          content: content.trim(),
          imageUrls: images.join(','),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(error.message || t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.success}</h3>
        <p className="mt-2 text-sm text-slate-600">{t.successHint}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6">{t.writeReview}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-sm text-slate-600">Reviewing: <span className="font-semibold text-slate-900">{productName}</span></p>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {t.rating} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <span className="text-sm font-medium text-slate-600">
                {ratingLabels[(hoveredRating || rating) - 1]}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {t.title}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            maxLength={100}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {t.content} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.contentPlaceholder}
            rows={5}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">{content.length}/1000</span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            {t.addPhotos}
          </label>
          <p className="text-xs text-slate-500 mb-3">{t.addPhotosHint}</p>
          
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors"
          >
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Camera className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">{t.dragDrop}</p>
              <p className="text-xs text-slate-500 mt-1">{t.maxPhotos}</p>
            </label>
          </div>

          {/* Uploaded Images */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.removeImage}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t.cancel}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              t.submit
            )}
          </button>
        </div>
      </form>
    </div>
  );
}