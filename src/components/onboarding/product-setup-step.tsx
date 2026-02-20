"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUpload } from "@/components/image-upload";
import { Package, DollarSign, FileText, Image, Hash, CheckCircle2, SkipForward } from "lucide-react";

interface ProductSetupStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  onNext: () => void;
  canProceed: boolean;
}

export function ProductSetupStep({
  formData,
  updateFormData,
  onNext,
  canProceed
}: ProductSetupStepProps) {
  const t = useTranslations("onboarding.products");
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    category: formData.category || "", // Pre-fill with business category
    images: [] as string[],
    stockQuantity: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productAdded, setProductAdded] = useState(formData.productAdded || false);

  const categories = [
    { value: "retail", label: "Retail" },
    { value: "services", label: "Services" },
    { value: "food", label: "Food & Beverages" },
    { value: "fashion", label: "Fashion & Clothing" },
    { value: "electronics", label: "Electronics" },
    { value: "home", label: "Home & Garden" },
    { value: "beauty", label: "Beauty & Personal Care" },
    { value: "health", label: "Health & Wellness" },
    { value: "automotive", label: "Automotive" },
    { value: "other", label: "Other" },
  ];

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "name":
        if (!value.trim()) {
          newErrors.name = t("errors.nameRequired");
        } else if (value.trim().length < 3) {
          newErrors.name = t("errors.nameMinLength");
        } else {
          delete newErrors.name;
        }
        break;
      case "price":
        if (!value.trim()) {
          newErrors.price = t("errors.priceRequired");
        } else if (isNaN(Number(value)) || Number(value) <= 0) {
          newErrors.price = t("errors.priceInvalid");
        } else {
          delete newErrors.price;
        }
        break;
      case "category":
        if (!value) {
          newErrors.category = t("errors.categoryRequired");
        } else {
          delete newErrors.category;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleFieldChange = (field: string, value: string) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const canAddProduct = () => {
    return !!(
      productForm.name.trim() &&
      productForm.price.trim() &&
      productForm.category &&
      !Object.keys(errors).length
    );
  };

  const handleAddProduct = async () => {
    // Validate all fields
    validateField("name", productForm.name);
    validateField("price", productForm.price);
    validateField("category", productForm.category);

    if (!canAddProduct()) return;

    setIsSubmitting(true);

    try {
      // In a real implementation, this would make an API call to add the product
      // For now, we'll simulate success and store the data
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      const productData = {
        ...productForm,
        price: Number(productForm.price),
        stockQuantity: productForm.stockQuantity ? Number(productForm.stockQuantity) : null,
        addedAt: new Date().toISOString()
      };

      updateFormData({ 
        productAdded: true, 
        productData 
      });
      setProductAdded(true);

    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    updateFormData({ productAdded: false, productData: null });
    onNext();
  };

  const handleImageAdd = (url: string) => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
  };

  const handleImageRemove = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (productAdded) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("productAdded")}
          </h2>
          <p className="text-slate-600 mb-6">
            Your first product has been added successfully. You can add more products anytime from your dashboard.
          </p>
          
          {/* Product Summary */}
          <div className="bg-slate-50 rounded-lg p-4 max-w-md mx-auto mb-6">
            <div className="flex items-center space-x-3">
              {formData.productData?.images?.[0] && (
                <img
                  src={formData.productData.images[0]}
                  alt={formData.productData.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="text-left">
                <h3 className="font-medium text-slate-900">{formData.productData?.name}</h3>
                <p className="text-sm text-slate-600">${formData.productData?.price}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setProductAdded(false);
                setProductForm({
                  name: "",
                  price: "",
                  description: "",
                  category: formData.category || "",
                  images: [],
                  stockQuantity: ""
                });
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Add Another Product
            </button>
            <button
              onClick={onNext}
              className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Continue to Checklist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("title")}</h2>
        <p className="text-slate-600 mb-4">{t("subtitle")}</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">{t("tip")}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Form */}
        <div className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <Package className="w-4 h-4 text-slate-500" />
              <span>{t("productName")} *</span>
            </label>
            <input
              type="text"
              value={productForm.name}
              placeholder={t("productNamePlaceholder")}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.name ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
            <p className="text-xs text-slate-500">{t("productNameHint")}</p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <DollarSign className="w-4 h-4 text-slate-500" />
              <span>{t("price")} *</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.price}
                placeholder={t("pricePlaceholder")}
                onChange={(e) => handleFieldChange("price", e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.price ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-600">{errors.price}</p>
            )}
            <p className="text-xs text-slate-500">{t("priceHint")}</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{t("category")} *</span>
            </label>
            <select
              value={productForm.category}
              onChange={(e) => handleFieldChange("category", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.category ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">{t("categoryPlaceholder")}</option>
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

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{t("description")}</span>
            </label>
            <textarea
              value={productForm.description}
              placeholder={t("descriptionPlaceholder")}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
            <p className="text-xs text-slate-500">{t("descriptionHint")}</p>
          </div>

          {/* Stock Quantity */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <Hash className="w-4 h-4 text-slate-500" />
              <span>{t("stock")}</span>
            </label>
            <input
              type="number"
              min="0"
              value={productForm.stockQuantity}
              placeholder={t("stockPlaceholder")}
              onChange={(e) => handleFieldChange("stockQuantity", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-slate-500">{t("stockHint")}</p>
          </div>
        </div>

        {/* Product Images */}
        <div className="space-y-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Image className="w-4 h-4 text-slate-500" />
            <span>{t("images")}</span>
          </label>
          
          <div className="border border-slate-300 rounded-lg p-4">
            <ImageUpload
              currentUrl=""
              onUrlChange={handleImageAdd}
            />
          </div>
          
          {/* Image Gallery */}
          {productForm.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {productForm.images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-slate-500">{t("imagesHint")}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={handleSkip}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          <span>{t("skipProducts")}</span>
        </button>

        <button
          onClick={handleAddProduct}
          disabled={!canAddProduct() || isSubmitting}
          className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t("addingProduct") : t("addProductButton")}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Step 3 progress:</span>
          <span className="font-medium text-slate-900">
            {productAdded ? "✓ Product added" : "Optional - Add your first product"}
          </span>
        </div>
      </div>
    </div>
  );
}