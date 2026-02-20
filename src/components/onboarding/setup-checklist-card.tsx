"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Store, 
  Package, 
  Palette, 
  Upload,
  Eye,
  ExternalLink,
  Truck,
  CreditCard,
  ArrowRight
} from "lucide-react";

interface SetupChecklistCardProps {
  onboardingStatus: any;
  expanded?: boolean;
  showActions?: boolean;
  className?: string;
}

export function SetupChecklistCard({ 
  onboardingStatus, 
  expanded = false, 
  showActions = false,
  className = ""
}: SetupChecklistCardProps) {
  const router = useRouter();
  const t = useTranslations("setupChecklist");
  const [isExpanded, setIsExpanded] = useState(expanded);

  if (!onboardingStatus) {
    return null;
  }

  const { progress, status } = onboardingStatus;

  // Define all setup tasks with their completion status
  const tasks = [
    {
      key: "storeInfo",
      title: t("tasks.businessInfo.title"),
      description: t("tasks.businessInfo.description"),
      icon: Store,
      completed: status.storeInfo.completed,
      required: true,
      action: status.storeInfo.completed ? null : {
        label: "Complete Info",
        href: "/onboarding/business"
      }
    },
    {
      key: "templateSelected",
      title: "Store template selected",
      description: "Choose how your store looks to customers",
      icon: Palette,
      completed: status.customization.completed,
      required: true,
      action: status.customization.completed ? null : {
        label: "Choose Template",
        href: "/onboarding/templates"
      }
    },
    {
      key: "firstProduct",
      title: t("tasks.firstProduct.title"),
      description: t("tasks.firstProduct.description"),
      icon: Package,
      completed: status.products.completed,
      required: false,
      action: status.products.completed ? null : {
        label: t("actions.addProduct"),
        href: "/dashboard/catalog"
      }
    },
    {
      key: "logoUploaded",
      title: t("tasks.logoUploaded.title"),
      description: t("tasks.logoUploaded.description"),
      icon: Upload,
      completed: status.customization.details.hasLogo,
      required: false,
      action: status.customization.details.hasLogo ? null : {
        label: t("actions.uploadLogo"),
        href: "/onboarding/business"
      }
    },
    {
      key: "shipping",
      title: "Shipping methods configured",
      description: "Set up how you'll deliver products to customers",
      icon: Truck,
      completed: status.shipping.completed,
      required: false,
      action: status.shipping.completed ? null : {
        label: "Set Shipping",
        href: "/dashboard/shipping"
      }
    },
    {
      key: "payment",
      title: "Payment methods configured",
      description: "Set up how customers can pay you",
      icon: CreditCard,
      completed: status.payment.completed,
      required: false,
      action: status.payment.completed ? null : {
        label: "Set Payment",
        href: "/dashboard/settings#payment"
      }
    }
  ];

  const completedTasks = tasks.filter(task => task.completed);
  const requiredTasks = tasks.filter(task => task.required);
  const completedRequiredTasks = requiredTasks.filter(task => task.completed);
  const nextIncompleteTask = tasks.find(task => !task.completed);
  
  const canPublish = completedRequiredTasks.length === requiredTasks.length;
  const percentage = Math.round((completedTasks.length / tasks.length) * 100);

  const handleTaskAction = (action: any) => {
    if (action.href.startsWith('http')) {
      window.open(action.href, '_blank');
    } else {
      router.push(action.href);
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">
                {t("card.title")}
              </h3>
              <span className={`text-sm font-medium ${
                percentage === 100 ? 'text-green-600' : 'text-slate-600'
              }`}>
                {t("card.subtitle", { percentage: percentage.toString() })}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  percentage === 100 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          <button className="ml-4 p-1 hover:bg-slate-100 rounded">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Quick Actions - Only show when collapsed */}
        {!isExpanded && nextIncompleteTask && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Next: {nextIncompleteTask.title}
              </span>
              {nextIncompleteTask.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskAction(nextIncompleteTask.action);
                  }}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium"
                >
                  <span>{nextIncompleteTask.action.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-slate-100 pt-4">
            {/* Task List */}
            <div className="space-y-3 mb-4">
              {tasks.map((task) => {
                const Icon = task.icon;
                
                return (
                  <div
                    key={task.key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      task.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-500' 
                          : 'border-2 border-slate-300 bg-white'
                      }`}>
                        {task.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        ) : (
                          <Circle className="w-2 h-2 text-slate-300" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className={`text-sm font-medium ${
                          task.completed ? 'text-green-900' : 'text-slate-900'
                        }`}>
                          <Icon className="w-3 h-3 inline mr-2" />
                          {task.title}
                          {task.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </h4>
                        <p className={`text-xs mt-0.5 ${
                          task.completed ? 'text-green-700' : 'text-slate-600'
                        }`}>
                          {task.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    {showActions && task.action && !task.completed && (
                      <button
                        onClick={() => handleTaskAction(task.action)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                      >
                        <span>{task.action.label}</span>
                        <ExternalLink className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status Summary */}
            <div className="text-center">
              {percentage === 100 ? (
                <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-900 mb-1">
                    🎉 Store setup complete!
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    Your store is ready for customers
                  </p>
                  <div className="flex justify-center space-x-2">
                    <a
                      href={`/s/${status.store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-white border border-green-200 rounded hover:bg-green-50"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t("actions.viewStore")}</span>
                    </a>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      {t("actions.goToDashboard")}
                    </button>
                  </div>
                </div>
              ) : canPublish ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-1">Almost done!</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Required steps complete. Add optional items to improve your store.
                  </p>
                  <button
                    onClick={() => router.push("/onboarding/checklist")}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
                  >
                    Complete Setup
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-2">
                    {completedRequiredTasks.length}/{requiredTasks.length} required steps completed
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/setup-checklist")}
                    className="text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    {t("card.viewAll")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}