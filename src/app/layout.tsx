import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import { ToastProvider } from "@/components/toast-provider";
import { AppChrome } from "@/components/app-chrome";
import { CriticalResourcePreloader, ViewportOptimizer, CLSOptimizations, WebVitalsMonitor, ServiceWorkerRegistration } from "@/components/performance-optimizations";
import { WebsiteJsonLd } from "@/components/json-ld";

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
    "Build a professional storefront in minutes. Designed for small businesses and informal sellers in Mozambique and beyond. Start selling online today with our easy-to-use platform.",
  keywords: [
    "online store", 
    "storefront", 
    "small business", 
    "e-commerce", 
    "Mozambique", 
    "loja online",
    "create store",
    "sell online",
    "business platform",
    "marketplace",
    "retail",
    "digital commerce",
    "African e-commerce",
    "Portuguese",
    "local businesses"
  ],
  authors: [{ name: "MyShop" }],
  creator: "MyShop",
  publisher: "MyShop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MyShop — Create Your Online Store in Minutes",
    description: "Build a professional storefront in minutes. Designed for small businesses and informal sellers in Mozambique and beyond.",
    type: "website",
    locale: "en_US",
    alternateLocale: "pt_MZ",
    siteName: "MyShop",
    images: [
      {
        url: "/og-image.png", // We'll create this
        width: 1200,
        height: 630,
        alt: "MyShop - Create Your Online Store",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@MyShopMZ",
    creator: "@MyShopMZ",
    title: "MyShop — Create Your Online Store in Minutes",
    description: "Build a professional storefront in minutes. Start selling online today.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";
  
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <CriticalResourcePreloader />
        <ViewportOptimizer />
        <CLSOptimizations />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}>
        <WebsiteJsonLd
          name="MyShop"
          url={baseUrl}
          description="Create your online store in minutes. Designed for small businesses and informal sellers in Mozambique and beyond."
          searchAction={`${baseUrl}/stores?q={search_term_string}`}
        />
        <LanguageProvider>
          <ToastProvider>
            <AppChrome>{children}</AppChrome>
          </ToastProvider>
        </LanguageProvider>
        <ServiceWorkerRegistration />
        <WebVitalsMonitor />
      </body>
    </html>
  );
}
