"use client";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { useMemo, Suspense } from "react";

const dict = {
  en: {
    storePreview: "Store Preview",
    sampleProducts: "Sample Products",
    categories: "Categories",
    about: "About",
    contact: "Contact",
    searchPlaceholder: "Search products...",
    addToCart: "Add to Cart",
    viewProduct: "View Product",
    sampleCategories: ["Electronics", "Fashion", "Home & Garden", "Books", "Sports"],
    sampleProductNames: [
      "Premium Wireless Headphones",
      "Cotton Summer T-Shirt",
      "Ceramic Coffee Mug",
      "Bluetooth Speaker",
      "Leather Wallet"
    ],
  },
  pt: {
    storePreview: "Pré-visualização da Loja",
    sampleProducts: "Produtos de Exemplo",
    categories: "Categorias",
    about: "Sobre",
    contact: "Contacto",
    searchPlaceholder: "Procurar produtos...",
    addToCart: "Adicionar ao Carrinho",
    viewProduct: "Ver Produto",
    sampleCategories: ["Eletrónicos", "Moda", "Casa e Jardim", "Livros", "Desporto"],
    sampleProductNames: [
      "Auriculares Sem Fios Premium",
      "T-Shirt de Algodão de Verão",
      "Caneca de Café de Cerâmica",
      "Altifalante Bluetooth",
      "Carteira de Cabedal"
    ],
  },
};

function StorePreviewContent() {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const searchParams = useSearchParams();
  
  // Get preview parameters from URL
  const storeName = searchParams?.get("name") || "Your Store Name";
  const themeColor = searchParams?.get("color") || "indigo";
  const storeTemplate = searchParams?.get("template") || "classic";
  const headerStyle = searchParams?.get("header") || "compact";
  const logoUrl = searchParams?.get("logo") || "";
  
  const getThemeClasses = (color: string) => {
    const colors: Record<string, string> = {
      indigo: "bg-indigo-600 border-indigo-600 text-indigo-600",
      blue: "bg-blue-600 border-blue-600 text-blue-600", 
      green: "bg-green-600 border-green-600 text-green-600",
      purple: "bg-purple-600 border-purple-600 text-purple-600",
      pink: "bg-pink-600 border-pink-600 text-pink-600",
      red: "bg-red-600 border-red-600 text-red-600",
    };
    return colors[color] || colors.indigo;
  };
  
  const themeClasses = getThemeClasses(themeColor);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Preview Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-sm text-yellow-800">
          🔍 {t.storePreview} - This is how your store will look
        </p>
      </div>
      
      {/* Header */}
      <header className={`
        ${headerStyle === "full" ? "py-6 px-4" : 
          headerStyle === "minimal" ? "py-4 px-4" : "py-3 px-4"}
        border-b border-slate-200
      `}>
        <div className="max-w-6xl mx-auto">
          {/* Compact Header */}
          {headerStyle === "compact" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
                )}
                <h1 className="text-xl font-bold text-slate-900">{storeName}</h1>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.categories}</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.about}</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.contact}</a>
              </div>
            </div>
          )}
          
          {/* Full Header */}
          {headerStyle === "full" && (
            <div>
              <div className="flex items-center justify-center mb-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded object-cover mr-4" />
                )}
                <h1 className="text-3xl font-bold text-slate-900">{storeName}</h1>
              </div>
              <nav className="flex justify-center space-x-8 text-sm">
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.categories}</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.about}</a>
                <a href="#" className="text-slate-600 hover:text-slate-900">{t.contact}</a>
              </nav>
            </div>
          )}
          
          {/* Minimal Header */}
          {headerStyle === "minimal" && (
            <div className="flex items-center justify-center">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded object-cover mr-3" />
              )}
              <h1 className="text-2xl font-bold text-slate-900">{storeName}</h1>
            </div>
          )}
        </div>
      </header>
      
      {/* Search Bar */}
      <div className="bg-slate-50 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t.categories}</h2>
          <div className="flex flex-wrap gap-2">
            {t.sampleCategories.map((category, index) => (
              <button
                key={index}
                className={`px-3 py-1 text-sm rounded-full border hover:opacity-80 ${
                  index === 0 ? 
                    themeClasses.split(' ').map(c => c.includes('bg-') ? c + ' text-white' : '').join(' ') :
                    'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>
        
        {/* Sample Products */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-6">{t.sampleProducts}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {t.sampleProductNames.map((productName, index) => (
              <div key={index} className="group">
                <div className="bg-slate-100 aspect-square rounded-lg mb-3 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-medium text-slate-900 mb-1 group-hover:text-blue-600">
                  {productName}
                </h3>
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  ${(Math.random() * 50 + 10).toFixed(2)}
                </p>
                <button className={`
                  w-full py-2 text-sm font-medium rounded-lg transition-colors
                  ${themeClasses.includes('bg-indigo') ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                    themeClasses.includes('bg-blue') ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    themeClasses.includes('bg-green') ? 'bg-green-600 hover:bg-green-700 text-white' :
                    themeClasses.includes('bg-purple') ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                    themeClasses.includes('bg-pink') ? 'bg-pink-600 hover:bg-pink-700 text-white' :
                    'bg-red-600 hover:bg-red-700 text-white'}
                `}>
                  {t.addToCart}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center text-slate-600">
          <p>&copy; 2024 {storeName}. Powered by MyShop</p>
        </div>
      </footer>
    </div>
  );
}

export default function StorePreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading preview...</div>
      </div>
    }>
      <StorePreviewContent />
    </Suspense>
  );
}