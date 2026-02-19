"use client";

import { useLanguage } from "@/lib/language";
import { CheckCircle, AlertCircle, XCircle, Package } from "lucide-react";

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'no-tracking';

interface StockStatusBadgeProps {
  currentStock: number;
  threshold?: number;
  trackInventory?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const dict = {
  en: {
    inStock: "In Stock",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    noTracking: "No Tracking",
  },
  pt: {
    inStock: "Em Estoque",
    lowStock: "Estoque Baixo", 
    outOfStock: "Esgotado",
    noTracking: "Sem Rastreamento",
  },
};

export function StockStatusBadge({ 
  currentStock, 
  threshold = 5,
  trackInventory = true,
  size = 'md',
  showIcon = true,
  className = ""
}: StockStatusBadgeProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  // Determine stock status
  let status: StockStatus;
  if (!trackInventory) {
    status = 'no-tracking';
  } else if (currentStock === 0) {
    status = 'out-of-stock';
  } else if (currentStock <= threshold) {
    status = 'low-stock';
  } else {
    status = 'in-stock';
  }

  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3', 
    lg: 'h-4 w-4',
  };

  // Status-specific styling
  const statusConfig = {
    'in-stock': {
      label: t.inStock,
      classes: 'bg-green-50 text-green-700 ring-1 ring-green-200',
      icon: CheckCircle,
    },
    'low-stock': {
      label: t.lowStock,
      classes: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
      icon: AlertCircle,
    },
    'out-of-stock': {
      label: t.outOfStock,
      classes: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      icon: XCircle,
    },
    'no-tracking': {
      label: t.noTracking,
      classes: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
      icon: Package,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${config.classes} ${className}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
      {trackInventory && status !== 'no-tracking' && (
        <span className="font-mono">({currentStock})</span>
      )}
    </span>
  );
}

// Utility function to get stock status without rendering
export function getStockStatus(currentStock: number, threshold = 5, trackInventory = true): {
  status: StockStatus;
  label: string;
  isLow: boolean;
  isOut: boolean;
} {
  let status: StockStatus;
  let isLow = false;
  let isOut = false;

  if (!trackInventory) {
    status = 'no-tracking';
  } else if (currentStock === 0) {
    status = 'out-of-stock';
    isOut = true;
  } else if (currentStock <= threshold) {
    status = 'low-stock';
    isLow = true;
  } else {
    status = 'in-stock';
  }

  const labels = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock', 
    'no-tracking': 'No Tracking',
  };

  return {
    status,
    label: labels[status],
    isLow,
    isOut,
  };
}