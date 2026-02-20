"use client";

import React from "react";

interface OnboardingWizardProps {
  initialStep?: number;
  savedData?: any;
  onComplete?: () => void;
  onExit?: () => void;
}

export function OnboardingWizard({ initialStep = 0, savedData, onComplete, onExit }: OnboardingWizardProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Store Setup</h2>
      <p className="text-slate-600 mb-6">Complete the steps below to set up your store.</p>
      <div className="text-sm text-slate-500">Onboarding wizard — coming soon</div>
    </div>
  );
}
