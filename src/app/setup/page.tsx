"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /setup now redirects to /register
export default function SetupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/register");
  }, [router]);
  return (
    <main className="mx-auto w-full max-w-md px-4 py-14 text-center">
      <p className="text-sm text-slate-600">Redirecting to registration...</p>
    </main>
  );
}
