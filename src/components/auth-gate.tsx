"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.session) {
          setOk(true);
        }
      })
      .catch(() => {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
      });
  }, [pathname, router]);

  if (!ok) return null;
  return <>{children}</>;
}
