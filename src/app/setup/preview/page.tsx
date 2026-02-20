"use client";

import { useSearchParams } from "next/navigation";
import { getTemplate } from "@/lib/store-templates";
import { Suspense } from "react";

function PreviewContent() {
  const searchParams = useSearchParams();
  
  const templateId = searchParams.get("template") || "classic";
  const storeName = searchParams.get("storeName") || "Your Store Name";
  const logoUrl = searchParams.get("logo") || "";
  const isPreview = searchParams.get("preview") === "true";
  
  const template = getTemplate(templateId);

  // Mock product data
  const mockProducts = [
    {
      id: 1,
      name: "Premium T-Shirt",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format",
      category: "Fashion"
    },
    {
      id: 2,
      name: "Wireless Headphones",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format",
      category: "Electronics"
    },
    {
      id: 3,
      name: "Coffee Mug",
      price: 15.50,
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&auto=format",
      category: "Home"
    },
    {
      id: 4,
      name: "Running Shoes",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format",
      category: "Sports"
    },
    {
      id: 5,
      name: "Smartphone Case",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop&auto=format",
      category: "Electronics"
    },
    {
      id: 6,
      name: "Sunglasses",
      price: 45.00,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&auto=format",
      category: "Fashion"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-blue-600 text-white text-center py-2 text-sm">
          ⚡ Store Preview - This is how your store will look to customers
        </div>
      )}

      {/* Store Header */}
      <div className={`bg-green-500 text-white ${template.bannerHeight} flex items-center justify-between px-4 md:px-8`}>
        <div className="flex items-center space-x-4">
          {logoUrl && (
            <div className={`bg-white rounded-full p-2 ${template.avatarSize}`}>
              <img 
                src={logoUrl} 
                alt="Store logo" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{storeName}</h1>
            <p className="text-green-100 text-sm">Quality products, great service</p>
          </div>
        </div>
        
        <div className="hidden md:flex space-x-6 text-sm">
          <a href="#" className="hover:text-green-100">Products</a>
          <a href="#" className="hover:text-green-100">About</a>
          <a href="#" className="hover:text-green-100">Contact</a>
        </div>
      </div>

      {/* Store Content */}
      <div className={`container mx-auto px-4 py-8 ${template.padding}`}>
        {/* Store Description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to {storeName}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Discover our curated collection of high-quality products. 
            We're committed to providing excellent service and the best shopping experience.
          </p>
        </div>

        {/* Products Grid */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Featured Products</h3>
          
          {template.layout === "list" ? (
            // List Layout
            <div className="space-y-4">
              {mockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex space-x-4 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{product.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{product.category}</p>
                    <p className="text-lg font-semibold text-green-600 mt-2">${product.price}</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">
                    Order
                  </button>
                </div>
              ))}
            </div>
          ) : template.layout === "single" ? (
            // Single Column Layout
            <div className="space-y-8">
              {mockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full aspect-[16/10] object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-semibold text-slate-900">{product.name}</h4>
                      <span className="text-sm text-slate-500">{product.category}</span>
                    </div>
                    <p className="text-slate-600 mb-4">
                      High-quality {product.name.toLowerCase()} with excellent craftsmanship and attention to detail.
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-600">${product.price}</p>
                      <button className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Grid Layout (Classic/Boutique)
            <div className={`grid ${
              template.gridCols.mobile === 1 ? 'grid-cols-1' :
              template.gridCols.mobile === 2 ? 'grid-cols-2' : 'grid-cols-2'
            } sm:grid-cols-${template.gridCols.sm} lg:grid-cols-${template.gridCols.lg} ${template.gap}`}>
              {mockProducts.map((product) => (
                <div key={product.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full object-cover ${template.aspectRatio}`}
                  />
                  <div className={template.padding}>
                    <h4 className={`font-semibold text-slate-900 ${template.titleSize}`}>
                      {product.name}
                    </h4>
                    <p className="text-slate-600 text-xs mt-1">{product.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`font-bold text-green-600 ${template.priceSize}`}>
                        ${product.price}
                      </p>
                      <button className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100">
                        Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
            <span>📱 WhatsApp</span>
            <span>📧 Email</span>
            <span>📍 Location</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            © 2024 {storeName}. Powered by MyShop.
          </p>
        </div>
      </div>

      {/* Preview Controls */}
      {isPreview && (
        <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-full bg-${template.id === 'classic' ? 'blue' : template.id === 'boutique' ? 'purple' : template.id === 'catalog' ? 'orange' : 'green'}-500`}></div>
            <span className="font-medium">{template.nameEn} Template</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}