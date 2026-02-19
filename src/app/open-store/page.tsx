"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StoreCreationWizard } from "@/components/store-creation-wizard";

export default function OpenStorePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/unified/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSession(data.user);
          // If user already has a store, redirect to dashboard
          if (data.user.hasStore) {
            router.replace("/dashboard");
            return;
          }
        } else {
          // Not authenticated, redirect to login
          router.replace("/login?redirect=" + encodeURIComponent("/open-store"));
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login?redirect=" + encodeURIComponent("/open-store"));
      });
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-14">
      <StoreCreationWizard
        onSuccess={(store) => {
          // Redirect to dashboard after successful store creation
          router.push("/dashboard");
        }}
        onCancel={() => {
          // Go back to home if they cancel
          router.push("/");
        }}
      />
    </main>
  );
}