"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  actionLabel?: string;
  onAction?: () => void;
  prefix?: string;
  suffix?: string;
  description?: string;
}

export default function AnalyticsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  trend,
  actionLabel,
  onAction,
  prefix = '',
  suffix = '',
  description,
}: AnalyticsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && changeLabel && (
            <Badge variant="secondary" className={`text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">
                {change > 0 ? '+' : ''}{change}% {changeLabel}
              </span>
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>

        {actionLabel && onAction && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={onAction} className="w-full">
              {actionLabel}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}