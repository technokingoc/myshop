"use client";

import { useState, useCallback } from "react";
import { Camera, Upload, X, Check, Star, MessageSquare } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface DeliveryConfirmationProps {
  orderId: string;
  customerName: string;
  onConfirm: (data: {
    confirmed: boolean;
    photos?: string[];
    notes?: string;
    deliveryRating?: number;
    sellerRating?: number;
    deliveredBy?: string;
    deliveryLocation?: string;
  }) => void;
  t: Record<string, string>;
}

export function DeliveryConfirmation({ orderId, customerName, onConfirm, t }: DeliveryConfirmationProps) {
  const [step, setStep] = useState<'initial' | 'details' | 'submitting' | 'completed'>('initial');
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryRating, setDeliveryRating] = useState<number>(0);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handlePhotoUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const newPhotos: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 5 - photos.length); i++) {
        const file = files[i];
        
        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(t.fileTooLarge || 'File too large (max 5MB)');
          continue;
        }
        
        if (!file.type.startsWith('image/')) {
          toast.error(t.invalidFileType || 'Only image files are allowed');
          continue;
        }
        
        // Convert to base64 for now (in a real app, you'd upload to a service like Vercel Blob)
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        newPhotos.push(base64);
      }
      
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      toast.error(t.uploadFailed || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [photos.length, toast, t]);

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!confirmed) {
      await onConfirm({ confirmed: false });
      setStep('completed');
      return;
    }
    
    setStep('submitting');
    
    try {
      await onConfirm({
        confirmed: true,
        photos: photos.length > 0 ? photos : undefined,
        notes: notes.trim() || undefined,
        deliveryRating: deliveryRating > 0 ? deliveryRating : undefined,
        sellerRating: sellerRating > 0 ? sellerRating : undefined,
        deliveredBy: deliveredBy.trim() || undefined,
        deliveryLocation: deliveryLocation.trim() || undefined,
      });
      setStep('completed');
      toast.success(t.confirmationSubmitted || 'Delivery confirmation submitted');
    } catch (error) {
      toast.error(t.confirmationFailed || 'Failed to submit confirmation');
      setStep('details');
    }
  };

  if (step === 'completed') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          {t.deliveryConfirmed || 'Delivery Confirmed!'}
        </h3>
        <p className="text-green-700">
          {t.thankYouForConfirming || 'Thank you for confirming your delivery. Your feedback helps us improve our service.'}
        </p>
      </div>
    );
  }

  if (step === 'submitting') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="h-8 w-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">
          {t.submittingConfirmation || 'Submitting confirmation...'}
        </p>
      </div>
    );
  }

  if (step === 'initial') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {t.confirmDelivery || 'Confirm Delivery'}
        </h3>
        <p className="text-blue-800 mb-4">
          {t.confirmDeliveryDesc || 'Did you receive your order successfully?'}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={() => setStep('details')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            {t.yesReceived || 'Yes, I received it'}
          </button>
          <button
            onClick={() => handleConfirm(false)}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            {t.notReceived || 'Not yet received'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {t.deliveryDetails || 'Delivery Details'}
          </h3>
          <p className="text-sm text-slate-600">
            {t.deliveryDetailsDesc || 'Help us improve by sharing details about your delivery (optional)'}
          </p>
        </div>
        <button
          onClick={() => setStep('initial')}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.deliveryPhotos || 'Delivery Photos'} ({t.optional || 'Optional'})
          </label>
          <p className="text-xs text-slate-500 mb-3">
            {t.photosDesc || 'Upload photos of your delivered package (max 5 photos, 5MB each)'}
          </p>
          
          {photos.length < 5 && (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <label
                htmlFor="photo-upload"
                className={`block w-full p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-slate-300 bg-slate-50 cursor-not-allowed' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {uploading ? (
                    <div className="h-6 w-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-600">
                    {uploading ? (t.uploading || 'Uploading...') : (t.clickToUpload || 'Click to upload photos')}
                  </span>
                </div>
              </label>
            </div>
          )}
          
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Delivery photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.deliveryRating || 'Delivery Experience'}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setDeliveryRating(rating)}
                  className={`p-1 rounded ${rating <= deliveryRating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.sellerRating || 'Seller Rating'}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSellerRating(rating)}
                  className={`p-1 rounded ${rating <= sellerRating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.deliveredBy || 'Delivered by'} ({t.optional || 'Optional'})
            </label>
            <input
              type="text"
              value={deliveredBy}
              onChange={(e) => setDeliveredBy(e.target.value)}
              placeholder={t.deliveredByPlaceholder || 'Courier name or company'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.deliveryLocation || 'Delivery location'} ({t.optional || 'Optional'})
            </label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder={t.deliveryLocationPlaceholder || 'e.g., Left at door, Handed to me'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.additionalNotes || 'Additional notes'} ({t.optional || 'Optional'})
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder || 'Any additional feedback about the delivery...'}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleConfirm(true)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            {t.confirmDelivery || 'Confirm Delivery'}
          </button>
          <button
            onClick={() => handleConfirm(true)}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            {t.skipDetails || 'Skip details'}
          </button>
        </div>
      </div>
    </div>
  );
}