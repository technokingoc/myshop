"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          // Otherwise redirect to first step
          router.replace("/onboarding/business");
        } else {
          // Not authenticated, redirect to login
          router.replace("/login?redirect=" + encodeURIComponent("/onboarding"));
        }
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace("/login?redirect=" + encodeURIComponent("/onboarding"));
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  return null; // Will redirect
}