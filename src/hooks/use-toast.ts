"use client";

import { useCallback } from "react";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Simple console-based toast fallback
    if (options.variant === "destructive") {
      console.error(options.title, options.description);
    } else {
      console.log(options.title, options.description);
    }
  }, []);

  return { toast };
}
