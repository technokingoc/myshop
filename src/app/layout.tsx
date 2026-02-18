import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageSwitch } from "@/components/language-switch";
import { LanguageProvider } from "@/lib/language";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyShop E-commerce Self-Service",
  description:
    "MVP foundation for small businesses and informal sellers to build a professional storefront.",
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
          <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <span className="text-sm font-semibold text-slate-700">MyShop</span>
              <LanguageSwitch />
            </div>
          </div>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
