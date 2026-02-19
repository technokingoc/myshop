import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import { ToastProvider } from "@/components/toast-provider";
import { AppChrome } from "@/components/app-chrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MyShop — Create Your Online Store in Minutes",
    template: "%s | MyShop",
  },
  description:
    "Build a professional storefront in minutes. Designed for small businesses and informal sellers in Mozambique and beyond.",
  keywords: ["online store", "storefront", "small business", "e-commerce", "Mozambique", "loja online"],
  openGraph: {
    title: "MyShop — Create Your Online Store in Minutes",
    description: "Build a professional storefront in minutes. Designed for small businesses and informal sellers.",
    type: "website",
    locale: "en_US",
    siteName: "MyShop",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShop — Create Your Online Store in Minutes",
    description: "Build a professional storefront in minutes.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <LanguageProvider>
          <ToastProvider>
            <AppChrome>{children}</AppChrome>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
