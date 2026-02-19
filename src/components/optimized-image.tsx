"use client";

import { useState } from "react";
import Image from "next/image";

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
  quality = 75,
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false);

  // If no src or failed to load, show fallback
  if (!src || failed) {
    return fallback ? <>{fallback}</> : null;
  }

  // For fill images
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        quality={quality}
        onError={() => setFailed(true)}
        style={{ objectFit: "cover" }}
      />
    );
  }

  // For fixed size images
  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        priority={priority}
        quality={quality}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback to regular img if dimensions not provided
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  );
}

// Specific components for common use cases
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      fill
      sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px"
      priority={priority}
      fallback={
        <div className={`${className} bg-gray-100 flex items-center justify-center text-gray-400`}>
          No Image
        </div>
      }
    />
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
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      quality={90}
      fallback={
        <div 
          className={`${className} bg-gray-100 flex items-center justify-center text-gray-400 rounded-full`}
          style={{ width: size, height: size }}
        >
          <svg width="50%" height="50%" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      }
    />
  );
}

export function StoreBannerImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      fill
      sizes="100vw"
      priority={true}
      quality={85}
      fallback={
        <div className={`${className} bg-gradient-to-r from-green-400 to-green-600`} />
      }
    />
  );
}