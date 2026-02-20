"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { storeTemplates, getTemplate } from "@/lib/store-templates";
import { Smartphone, Monitor, Eye, Check } from "lucide-react";

interface TemplateSelectionStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  onNext: () => void;
  canProceed: boolean;
}

export function TemplateSelectionStep({
  formData,
  updateFormData,
  canProceed
}: TemplateSelectionStepProps) {
  const { t } = useLanguage();
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [previewTemplate, setPreviewTemplate] = useState(formData.selectedTemplate || "classic");

  const handleTemplateSelect = (templateId: string) => {
    updateFormData({ selectedTemplate: templateId });
    setPreviewTemplate(templateId);
  };

  const openFullPreview = () => {
    const template = getTemplate(previewTemplate);
    const params = new URLSearchParams({
      template: previewTemplate,
      storeName: formData.storeName || "Your Store Name",
      logo: formData.logoUrl || "",
      preview: "true"
    });
    window.open(`/setup/preview?${params.toString()}`, '_blank');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("title")}</h2>
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Template Options */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(storeTemplates).map(([templateId, template]) => (
            <div
              key={templateId}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                formData.selectedTemplate === templateId
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
              onClick={() => handleTemplateSelect(templateId)}
              onMouseEnter={() => setPreviewTemplate(templateId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {t(`templates.${templateId}.name`)}
                    </h3>
                    {formData.selectedTemplate === templateId && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        <span>{t("selected")}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    {t(`templates.${templateId}.description`)}
                  </p>
                  
                  {/* Template Features */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>Layout: {template.layout}</span>
                    <span>Grid: {template.gridCols.mobile}-{template.gridCols.lg} cols</span>
                    <span>Image: {template.imageSize}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(templateId);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    formData.selectedTemplate === templateId
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {formData.selectedTemplate === templateId ? t("selected") : t("select")}
                </button>
              </div>
            </div>
          ))}

          {/* Customization Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 {t("customizeHint")}
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-900">{t("preview")}</h4>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-2 py-1 text-xs rounded-md flex items-center space-x-1 ${
                    previewMode === "desktop" ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>{t("previewDevice.desktop")}</span>
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-2 py-1 text-xs rounded-md flex items-center space-x-1 ${
                    previewMode === "mobile" ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>{t("previewDevice.mobile")}</span>
                </button>
              </div>
            </div>

            {/* Mock Preview */}
            <div className={`
              border border-slate-200 rounded-lg overflow-hidden bg-white
              ${previewMode === "mobile" ? 'max-w-sm mx-auto' : ''}
            `}>
              <TemplatePreview
                template={getTemplate(previewTemplate)}
                storeName={formData.storeName || "Your Store"}
                logoUrl={formData.logoUrl}
                mobile={previewMode === "mobile"}
              />
            </div>

            {/* Full Preview Button */}
            <button
              onClick={openFullPreview}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{t("preview")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Step 2 progress:</span>
          <span className="font-medium text-slate-900">
            {canProceed ? "✓ Template selected" : "Choose a template to continue"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ 
  template, 
  storeName, 
  logoUrl, 
  mobile 
}: { 
  template: any; 
  storeName: string; 
  logoUrl?: string; 
  mobile: boolean;
}) {
  const headerHeight = mobile ? "h-16" : template.bannerHeight;
  const gridCols = mobile ? template.gridCols.mobile : template.gridCols.sm;
  
  return (
    <>
      {/* Header */}
      <div className={`bg-green-500 text-white p-3 ${headerHeight} flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          {logoUrl && (
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <img src={logoUrl} alt="" className="w-6 h-6 object-cover rounded-full" />
            </div>
          )}
          <span className="font-medium text-sm">{storeName}</span>
        </div>
        {!mobile && (
          <div className="flex space-x-2 text-xs">
            <span>Products</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3 min-h-[200px]">
        {template.layout === "list" ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-3 border border-slate-100 rounded p-2">
                <div className="w-12 h-12 bg-slate-100 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded mb-1"></div>
                  <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : template.layout === "single" ? (
          <div className="space-y-4">
            <div className="aspect-[16/10] bg-slate-100 rounded"></div>
            <div className="h-4 bg-slate-100 rounded"></div>
            <div className="h-3 bg-slate-100 rounded w-2/3"></div>
          </div>
        ) : (
          <div className={`grid grid-cols-${gridCols} gap-2`}>
            {[1, 2, 3, 4, 5, 6].slice(0, gridCols * 2).map(i => (
              <div key={i} className="space-y-2">
                <div className={`bg-slate-100 rounded ${template.aspectRatio}`}></div>
                <div className="h-2 bg-slate-100 rounded"></div>
                <div className="h-2 bg-slate-100 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}