import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageSwitch } from "@/components/language-switch";
import { LanguageProvider } from "@/lib/language";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-provider";

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
    description:
      "Build a professional storefront in minutes. Designed for small businesses and informal sellers.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased`}>
        <LanguageProvider>
          <ToastProvider>
            <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" className="text-sm font-semibold text-slate-700">MyShop</Link>
              <div className="flex items-center gap-3">
                <LanguageSwitch />
              </div>
            </div>
          </div>
            {children}
            <Footer />
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
