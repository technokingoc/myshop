"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

interface Props {
  params: { step: string };
}

export default function OnboardingStepPage({ params }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedData, setSavedData] = useState<any>(null);

  const validSteps = ["business", "templates", "products", "checklist"];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/unified/me", { 
          credentials: "include" 
        });
        const data = await response.json();

        if (data.success) {
          setSession(data.user);
          // If user already has a store, redirect to dashboard
          if (data.user.hasStore) {
            router.replace("/dashboard");
            return;
          }

          // Check if step is valid
          if (!validSteps.includes(params.step)) {
            router.replace("/onboarding/business");
            return;
          }

          // Try to load saved onboarding data
          try {
            const savedResponse = await fetch("/api/onboarding/progress", {
              credentials: "include"
            });
            if (savedResponse.ok) {
              const savedData = await savedResponse.json();
              setSavedData(savedData.data);
            }
          } catch (error) {
            console.log("No saved progress found");
          }

        } else {
          // Not authenticated, redirect to login
          router.replace("/login?redirect=" + encodeURIComponent(`/onboarding/${params.step}`));
        }
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace("/login?redirect=" + encodeURIComponent(`/onboarding/${params.step}`));
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router, params.step]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const stepIndex = validSteps.indexOf(params.step);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <OnboardingWizard
        initialStep={stepIndex}
        savedData={savedData}
        onComplete={() => {
          router.push("/dashboard");
        }}
        onExit={() => {
          router.push("/dashboard");
        }}
      />
    </main>
  );
}