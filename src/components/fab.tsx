"use client";

import React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface FABProps {
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function FAB({ href, onClick, icon: Icon, children, className = "" }: FABProps) {
  const baseClassName = `fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700 hover:scale-105 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 md:hidden ${className}`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={baseClassName}
      >
        <Icon className="h-5 w-5" />
        <span className="whitespace-nowrap">{children}</span>
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={baseClassName}
      >
        <Icon className="h-5 w-5" />
        <span className="whitespace-nowrap">{children}</span>
      </Link>
    );
  }

  return null;
}