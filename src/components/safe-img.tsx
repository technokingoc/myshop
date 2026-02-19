"use client";
import { useState } from "react";

interface SafeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export function SafeImg({ fallback, alt, ...props }: SafeImgProps) {
  const [error, setError] = useState(false);
  if (error && fallback) return <>{fallback}</>;
  return <img alt={alt || ""} {...props} onError={() => setError(true)} />;
}
