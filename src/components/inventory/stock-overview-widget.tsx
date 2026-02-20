"use client";

import { useEffect, useState } from "react";
import { fetchJsonWithRetry } from "@/lib/api-client";
import Link from "next/link";
import {
  Package, PackageCheck, AlertTriangle, PackageX, 
  TrendingUp, TrendingDown, ArrowRight, RefreshCw
} from "lucide-react";

type StockOverview = {
  total: number;
  healthy: number;
  atRisk: number;
  outOfStock: number;
  trends: {
    healthyTrend: number;
    atRiskTrend: number;
    outOfStockTrend: number;
  };
};

interface StockOverviewWidgetProps {
  className?: string;
}

export default function StockOverviewWidget({ className = "" }: StockOverviewWidgetProps) {
  const [overview, setOverview] = useState<StockOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchJsonWithRetry('/api/inventory/stock-overview');
      if (response.success) {
        setOverview(response.data);
      } else {
        setError('Failed to load stock overview');
      }
    } catch (err) {
      setError('Error loading stock overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const formatTrend = (trend: number) => {
    if (trend > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        text: `+${trend}%`,
        bgColor: 'bg-green-50',
      };
    } else if (trend < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        text: `${trend}%`,
        bgColor: 'bg-red-50',
      };
    }
    return {
      icon: null,
      color: 'text-gray-500',
      text: '0%',
      bgColor: 'bg-gray-50',
    };
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading stock overview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48 text-red-600">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
            <button
              onClick={loadOverview}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Stock Overview</h3>
          <Link
            href="/dashboard/inventory/alerts"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Products */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {overview?.total || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Healthy Stock */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <PackageCheck className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Healthy</p>
                <p className="text-xl font-bold text-green-700">
                  {overview?.healthy || 0}
                </p>
                {overview?.trends.healthyTrend !== undefined && (
                  <div className="flex items-center mt-1">
                    {(() => {
                      const trend = formatTrend(overview.trends.healthyTrend);
                      return (
                        <div className="flex items-center">
                          {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                          <span className={`text-xs ${trend.color}`}>
                            {trend.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* At Risk */}
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">At Risk</p>
                <p className="text-xl font-bold text-amber-700">
                  {overview?.atRisk || 0}
                </p>
                {overview?.trends.atRiskTrend !== undefined && (
                  <div className="flex items-center mt-1">
                    {(() => {
                      const trend = formatTrend(overview.trends.atRiskTrend);
                      return (
                        <div className="flex items-center">
                          {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                          <span className={`text-xs ${trend.color}`}>
                            {trend.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <PackageX className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-xl font-bold text-red-700">
                  {overview?.outOfStock || 0}
                </p>
                {overview?.trends.outOfStockTrend !== undefined && (
                  <div className="flex items-center mt-1">
                    {(() => {
                      const trend = formatTrend(overview.trends.outOfStockTrend);
                      return (
                        <div className="flex items-center">
                          {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
                          <span className={`text-xs ${trend.color}`}>
                            {trend.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status */}
        {overview && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Stock Health</p>
                <p className="text-xs text-gray-600 mt-1">
                  {overview.healthy > overview.atRisk + overview.outOfStock
                    ? "Most products have healthy stock levels"
                    : overview.outOfStock > overview.healthy
                    ? "Multiple products need immediate attention"
                    : "Some products need restocking soon"}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {Math.round((overview.healthy / Math.max(overview.total, 1)) * 100)}% Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {overview && (overview.atRisk > 0 || overview.outOfStock > 0) && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {overview.outOfStock > 0 && (
              <Link
                href="/dashboard/inventory/alerts?filter=out_of_stock"
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 text-center"
              >
                Fix Out of Stock ({overview.outOfStock})
              </Link>
            )}
            {overview.atRisk > 0 && (
              <Link
                href="/dashboard/inventory/alerts?filter=low_stock"
                className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 text-center"
              >
                Review At Risk ({overview.atRisk})
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}