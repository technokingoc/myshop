"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSellerArea = pathname?.startsWith("/dashboard");

  if (isSellerArea) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
