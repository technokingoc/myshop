import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";
import { SiteHeader } from "@/components/site-header";

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
    default: "MyShop — Create Your Online Store",
    template: "%s | MyShop",
  },
  description:
    "Build a professional storefront in minutes. Designed for small businesses and informal sellers in Mozambique and beyond.",
  keywords: ["online store", "storefront", "small business", "e-commerce", "Mozambique"],
  openGraph: {
    title: "MyShop — Create Your Online Store",
    description: "Build a professional storefront in minutes. Designed for small businesses and informal sellers.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          <ToastProvider>
            <SiteHeader />
            {children}
            <Footer />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
