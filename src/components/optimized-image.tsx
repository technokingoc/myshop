"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Utility to generate blur data URL
function shimmer(w: number, h: number) {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f1f5f9" offset="20%" />
          <stop stop-color="#e2e8f0" offset="50%" />
          <stop stop-color="#f1f5f9" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f1f5f9" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" opacity="0.8" />
      <animateTransform attributeName="transform" attributeType="XML" values="0 0; ${w} 0" dur="2s" repeatCount="indefinite"/>
    </svg>`;
}

function toBase64(str: string) {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

interface OptimizedImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt = "",
  className,
  fallback,
  width,
  height,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  quality = 85,
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // If no src or failed to load, show fallback
  if (!src || failed) {
    return fallback ? <>{fallback}</> : null;
  }

  // Generate blur placeholder
  const blurDataURL = width && height 
    ? `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`
    : `data:image/svg+xml;base64,${toBase64(shimmer(600, 400))}`;

  const commonProps = {
    alt,
    className: `${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`,
    sizes,
    priority,
    quality,
    placeholder: "blur" as const,
    blurDataURL,
    onError: () => setFailed(true),
    onLoad: () => setLoaded(true),
  };

  // For fill images
  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image
          src={src}
          fill
          style={{ objectFit: "cover" }}
          {...commonProps}
        />
      </div>
    );
  }

  // For fixed size images
  if (width && height) {
    return (
      <Image
        src={src}
        width={width}
        height={height}
        {...commonProps}
      />
    );
  }

  // Fallback to regular img if dimensions not provided
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
    />
  );
}

// Specific components for common use cases
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  aspectRatio = "aspect-square",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
}) {
  return (
    <div className={`${aspectRatio} relative overflow-hidden bg-slate-50`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          className={className}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px"
          priority={priority}
          quality={80}
        />
      ) : (
        <div className={`${className} absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-400`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function StoreLogoImage({
  src,
  alt,
  className,
  size = 48,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  size?: number;
}) {
  return (
    <div 
      className={`${className} relative overflow-hidden rounded-full bg-slate-100`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full"
          quality={90}
          priority={size >= 80} // Prioritize larger logos
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <svg width="50%" height="50%" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-3V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 5h4v2h-4V5zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v11z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export function StoreBannerImage({
  src,
  alt,
  className,
  height = "h-32 sm:h-40 lg:h-48",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  height?: string;
}) {
  return (
    <div className={`${height} relative overflow-hidden bg-gradient-to-br from-green-400 to-green-600 ${className}`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
          priority={true}
          quality={85}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/80 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7h-3V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}