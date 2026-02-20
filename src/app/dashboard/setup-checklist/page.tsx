"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SetupChecklistCard } from "@/components/onboarding/setup-checklist-card";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function SetupChecklistPage() {
  const router = useRouter();
  const t = useTranslations("setupChecklist");
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/stores/onboarding-status", {
          credentials: "include"
        });
        
        if (response.ok) {
          const data = await response.json();
          setOnboardingStatus(data);
        } else {
          // Redirect to onboarding if no store found
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Failed to fetch onboarding status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  if (!onboardingStatus) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
              <p className="text-slate-600 mt-1">{t("subtitle")}</p>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Overall Progress
              </span>
              <span className="text-sm text-slate-600">
                {onboardingStatus.progress.completed} of {onboardingStatus.progress.total} completed
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${onboardingStatus.progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SetupChecklistCard 
          onboardingStatus={onboardingStatus}
          expanded={true}
          showActions={true}
        />

        {/* Store Preview */}
        {onboardingStatus.progress.percentage === 100 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              🎉 Your store is ready!
            </h3>
            <p className="text-slate-600 mb-6">
              All setup tasks completed. Your store is now live and ready for customers.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href={`/s/${onboardingStatus.status.store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Your Store
              </a>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}