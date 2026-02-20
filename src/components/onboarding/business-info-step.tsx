"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { ImageUpload } from "@/components/image-upload";
import { Store, MapPin, Tag, FileText, Upload } from "lucide-react";

interface BusinessInfoStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

export function BusinessInfoStep({
  formData,
  updateFormData,
  onNext,
  canProceed
}: BusinessInfoStepProps) {
  const { t } = useLanguage();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate slug from store name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const effectiveSlug = formData.slug || generateSlug(formData.storeName);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "storeName":
        if (!value.trim()) {
          newErrors.storeName = t("errors.nameRequired");
        } else if (value.trim().length < 2) {
          newErrors.storeName = t("errors.nameMinLength");
        } else {
          delete newErrors.storeName;
        }
        break;
      case "category":
        if (!value) {
          newErrors.category = t("errors.categoryRequired");
        } else {
          delete newErrors.category;
        }
        break;
      case "location":
        if (!value.trim()) {
          newErrors.location = t("errors.locationRequired");
        } else {
          delete newErrors.location;
        }
        break;
      case "slug":
        if (value && !/^[a-z0-9-]+$/.test(value)) {
          newErrors.slug = t("errors.slugFormat");
        } else {
          delete newErrors.slug;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleFieldChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
    validateField(field, value);

    // Auto-generate slug when store name changes
    if (field === "storeName" && !formData.slug) {
      const newSlug = generateSlug(value);
      updateFormData({ slug: newSlug });
    }
  };

  const categories = [
    { value: "retail", label: t("categories.retail") },
    { value: "services", label: t("categories.services") },
    { value: "food", label: t("categories.food") },
    { value: "fashion", label: t("categories.fashion") },
    { value: "electronics", label: t("categories.electronics") },
    { value: "home", label: t("categories.home") },
    { value: "beauty", label: t("categories.beauty") },
    { value: "health", label: t("categories.health") },
    { value: "automotive", label: t("categories.automotive") },
    { value: "other", label: t("categories.other") },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("title")}</h2>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Store Name */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Store className="w-4 h-4 text-slate-500" />
            <span>{t("storeName")} *</span>
          </label>
          <input
            type="text"
            value={formData.storeName}
            placeholder={t("storeNamePlaceholder")}
            onChange={(e) => handleFieldChange("storeName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.storeName ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.storeName && (
            <p className="text-sm text-red-600">{errors.storeName}</p>
          )}
          <p className="text-xs text-slate-500">{t("storeNameHint")}</p>
        </div>

        {/* Store URL/Slug */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>{t("slug")}</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg">
              /s/
            </span>
            <input
              type="text"
              value={formData.slug}
              placeholder={t("slugPlaceholder")}
              onChange={(e) => handleFieldChange("slug", generateSlug(e.target.value))}
              className={`flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.slug ? "border-red-500" : "border-slate-300"
              }`}
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-red-600">{errors.slug}</p>
          )}
          {effectiveSlug && !errors.slug && (
            <p className="text-sm text-green-600">
              {t("slugHint").replace("{slug}", effectiveSlug)}
            </p>
          )}
        </div>

        {/* Business Category */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Tag className="w-4 h-4 text-slate-500" />
            <span>{t("category")} *</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleFieldChange("category", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.category ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span>{t("location")} *</span>
          </label>
          <input
            type="text"
            value={formData.location}
            placeholder={t("locationPlaceholder")}
            onChange={(e) => handleFieldChange("location", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.location ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.location && (
            <p className="text-sm text-red-600">{errors.location}</p>
          )}
          <p className="text-xs text-slate-500">{t("locationHint")}</p>
        </div>

        {/* Store Description */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t("description")}</span>
          </label>
          <textarea
            value={formData.description}
            placeholder={t("descriptionPlaceholder")}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
          <p className="text-xs text-slate-500">{t("descriptionHint")}</p>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{t("logo")}</span>
          </label>
          <div className="border border-slate-300 rounded-lg p-4">
            <ImageUpload
              currentUrl={formData.logoUrl}
              onUrlChange={(url) => updateFormData({ logoUrl: url })}
            />
          </div>
          <p className="text-xs text-slate-500">{t("logoHint")}</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Step 1 progress:</span>
          <span className="font-medium text-slate-900">
            {canProceed ? "✓ Ready to continue" : "Fill required fields to continue"}
          </span>
        </div>
      </div>
    </div>
  );
}