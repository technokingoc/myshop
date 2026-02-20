"use client";

import { useEffect } from "react";
import Script from "next/script";

// Preload critical resources
export function CriticalResourcePreloader() {
  useEffect(() => {
    // Preload critical fonts
    const fontPreloads = [
      '/fonts/geist-sans-bold.woff2',
      '/fonts/geist-sans-regular.woff2',
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Prefetch likely next pages
    const prefetchUrls = [
      '/stores',
      '/register',
      '/open-store'
    ];

    prefetchUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);

  return null;
}

// Viewport meta tag optimization
export function ViewportOptimizer() {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        'content', 
        'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover'
      );
    }
  }, []);

  return null;
}

// Cumulative Layout Shift (CLS) improvements
export function CLSOptimizations() {
  return (
    <style jsx global>{`
      /* Reserve space for images to prevent CLS */
      .product-image-container {
        aspect-ratio: 1;
        background-color: #f1f5f9;
      }
      
      .store-banner-container {
        aspect-ratio: 16/9;
        background-color: #22c55e;
      }
      
      .store-logo-container {
        aspect-ratio: 1;
        background-color: #f1f5f9;
      }
      
      /* Prevent layout shift from loading states */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Optimize font loading */
      @font-face {
        font-family: 'Geist Sans';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('/fonts/geist-sans-regular.woff2') format('woff2');
      }
      
      @font-face {
        font-family: 'Geist Sans';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('/fonts/geist-sans-bold.woff2') format('woff2');
      }
      
      /* Prevent invisible text during font load */
      body {
        font-display: swap;
      }
      
      /* Optimize animations for performance */
      .hover-lift {
        transform: translateZ(0);
        will-change: transform;
      }
      
      /* Optimize scrolling performance */
      .scroll-container {
        transform: translateZ(0);
        -webkit-overflow-scrolling: touch;
      }
      
      /* Reduce paint and layout thrashing */
      .gpu-optimized {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    `}</style>
  );
}

// Web Vitals monitoring (stub - install web-vitals package to enable)
export function WebVitalsMonitor() {
  useEffect(() => {
    // Web vitals monitoring available when web-vitals package is installed
  }, []);

  return (
    <Script
      id="web-vitals"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('load', function() {
            // Simple performance monitoring
            if ('PerformanceObserver' in window) {
              const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                  }
                  if (entry.entryType === 'first-input') {
                    console.log('FID:', entry.processingStart - entry.startTime);
                  }
                  if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                    console.log('CLS:', entry.value);
                  }
                }
              });
              
              observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            }
          });
        `
      }}
    />
  );
}

// Intersection Observer for lazy loading
export function LazyLoadObserver({ children, className = "", threshold = 0.1 }: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('.lazy-load');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold]);

  return <div className={`lazy-load ${className}`}>{children}</div>;
}

// Service Worker registration for caching
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return null;
}