"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";
import { PublicHeader } from "@/components/public-header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSellerArea = pathname?.startsWith("/dashboard");
  const isStorefront = pathname?.startsWith("/s/");

  if (isSellerArea || isStorefront) {
    return <>{children}</>;
  }

  return (
    <>
      <PublicHeader />
      {children}
      <Footer />
    </>
  );
}
