"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { 
  CheckCircle2, 
  Circle, 
  Store, 
  Package, 
  Palette, 
  Upload,
  Eye,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface ChecklistStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  onNext: () => void;
  canProceed: boolean;
}

export function ChecklistStep({
  formData,
  updateFormData,
  onNext,
  canProceed
}: ChecklistStepProps) {
  const { t } = useLanguage();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Calculate task completion
  const tasks = [
    {
      key: "businessInfo",
      title: t("tasks.businessInfo.title"),
      description: t("tasks.businessInfo.description"),
      icon: Store,
      completed: !!(formData.storeName && formData.category && formData.location),
      required: true
    },
    {
      key: "templateSelected",
      title: t("tasks.templateSelected.title"),
      description: t("tasks.templateSelected.description"),
      icon: Palette,
      completed: !!formData.selectedTemplate,
      required: true
    },
    {
      key: "firstProduct",
      title: t("tasks.firstProduct.title"),
      description: t("tasks.firstProduct.description"),
      icon: Package,
      completed: formData.productAdded,
      required: false,
      action: formData.productAdded ? null : {
        label: t("actions.addProduct"),
        onClick: () => window.open("/dashboard/catalog", "_blank")
      }
    },
    {
      key: "logoUploaded",
      title: t("tasks.logoUploaded.title"),
      description: t("tasks.logoUploaded.description"),
      icon: Upload,
      completed: !!formData.logoUrl,
      required: false,
      action: !formData.logoUrl ? {
        label: t("actions.uploadLogo"),
        onClick: () => {
          // Could open a modal or navigate back to business info step
        }
      } : null
    },
    {
      key: "storePublished",
      title: t("tasks.storePublished.title"),
      description: t("tasks.storePublished.description"),
      icon: Eye,
      completed: false, // Will be completed when store is created
      required: false
    }
  ];

  const completedTasks = tasks.filter(task => task.completed);
  const requiredTasks = tasks.filter(task => task.required);
  const completedRequiredTasks = requiredTasks.filter(task => task.completed);
  const totalTasks = tasks.length;
  const progress = (completedTasks.length / totalTasks) * 100;
  const canPublish = completedRequiredTasks.length === requiredTasks.length;

  // Auto-show publish dialog when 100% complete
  useEffect(() => {
    if (progress === 100 && !showPublishDialog) {
      setShowPublishDialog(true);
    }
  }, [progress, showPublishDialog]);

  const handlePublishStore = async () => {
    setIsPublishing(true);
    
    try {
      // The onNext function will handle store creation
      await onNext();
    } catch (error) {
      console.error("Failed to publish store:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (showPublishDialog && progress === 100) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t("autoPublish.title")}
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            {t("autoPublish.message")}
          </p>
          
          {/* Store Preview Card */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              {formData.logoUrl && (
                <img
                  src={formData.logoUrl}
                  alt="Store logo"
                  className="w-12 h-12 object-cover rounded-full"
                />
              )}
              <div>
                <h3 className="font-semibold text-slate-900">{formData.storeName}</h3>
                <p className="text-sm text-slate-600">{formData.location}</p>
              </div>
            </div>
            <div className="text-sm text-green-700 bg-white/50 rounded-lg p-2">
              Store URL: /s/{formData.slug || formData.storeName.toLowerCase().replace(/\s+/g, '-')}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowPublishDialog(false)}
              className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {t("autoPublish.publishLater")}
            </button>
            <button
              onClick={handlePublishStore}
              disabled={isPublishing}
              className="px-8 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isPublishing ? "Publishing..." : t("autoPublish.publishNow")}
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
        <p className="text-slate-600">{t("subtitle")}</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-900">{t("progress")}</h3>
          <span className="text-sm text-slate-600">
            {t("progressText", { 
              completed: completedTasks.length.toString(), 
              total: totalTasks.toString() 
            })}
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              progress === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-right">
          <span className={`text-sm font-medium ${
            progress === 100 ? 'text-green-600' : 'text-slate-600'
          }`}>
            {Math.round(progress)}% complete
          </span>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-4 mb-8">
        {tasks.map((task) => {
          const Icon = task.icon;
          
          return (
            <div
              key={task.key}
              className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                task.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                task.completed 
                  ? 'bg-green-500' 
                  : 'border-2 border-slate-300'
              }`}>
                {task.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-slate-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      task.completed ? 'text-green-900' : 'text-slate-900'
                    }`}>
                      <Icon className="w-4 h-4 inline mr-2" />
                      {task.title}
                      {task.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-green-700' : 'text-slate-600'
                    }`}>
                      {task.description}
                    </p>
                  </div>
                  
                  {/* Action Button */}
                  {task.action && !task.completed && (
                    <button
                      onClick={task.action.onClick}
                      className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                    >
                      <span>{task.action.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Status */}
      {progress === 100 ? (
        <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t("completion.title")}
          </h3>
          <p className="text-slate-600 mb-6">
            {t("completion.message")}
          </p>
          
          <div className="space-y-4">
            <div className="text-sm text-slate-700">
              <strong>{t("completion.storeUrl")}</strong>
              <div className="bg-white border border-green-200 rounded-lg px-3 py-2 mt-1 font-mono text-xs">
                /s/{formData.slug || formData.storeName.toLowerCase().replace(/\s+/g, '-')}
              </div>
            </div>
            
            <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">{t("completion.nextSteps.title")}</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                {(t("completion.nextSteps.items") as unknown as string[]).map((item: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => setShowPublishDialog(true)}
              className="w-full px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t("actions.publishStore")} 🚀
            </button>
          </div>
        </div>
      ) : canPublish ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <h4 className="font-medium text-slate-900 mb-2">Almost ready!</h4>
          <p className="text-sm text-slate-600 mb-4">
            You've completed the required steps. Add a few optional items to make your store even better.
          </p>
          <button
            onClick={handlePublishStore}
            disabled={isPublishing}
            className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish Store Now"}
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <h4 className="font-medium text-slate-900 mb-2">Complete required steps</h4>
          <p className="text-sm text-slate-600">
            Finish the required steps marked with * to publish your store.
          </p>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mt-6 bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Final step progress:</span>
          <span className="font-medium text-slate-900">
            {progress === 100 ? "✓ Ready to launch!" : 
             canPublish ? "Ready to publish" : 
             `${completedRequiredTasks.length}/${requiredTasks.length} required tasks completed`}
          </span>
        </div>
      </div>
    </div>
  );
}