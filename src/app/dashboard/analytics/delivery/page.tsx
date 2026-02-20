"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Star, 
  TrendingUp,
  TrendingDown, 
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Filter
} from "lucide-react";

type DeliveryAnalytics = {
  overview: {
    totalOrders: number;
    deliveredOrders: number;
    avgDeliveryTime: number;
    deliveryRate: number;
    confirmationRate: number;
    avgDeliveryRating: number;
    avgSellerRating: number;
  };
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  deliveryTimes: {
    date: string;
    avgHours: number;
    orderCount: number;
  }[];
  ratings: {
    deliveryRating: number;
    sellerRating: number;
    count: number;
  }[];
  recentActivity: {
    orderId: number;
    status: string;
    customerName: string;
    updatedAt: string;
    deliveryTime?: number;
  }[];
};

const statusColorMap: Record<string, string> = {
  placed: "bg-slate-100 text-slate-800",
  confirmed: "bg-green-100 text-green-800", 
  preparing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  "in-transit": "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function DeliveryAnalyticsPage() {
  const { lang } = useLanguage();
  const t = (getDict(lang) as any).analytics as Record<string, string> ?? {};
  const toast = useToast();

  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    const rawSellerId = localStorage.getItem("myshop_seller_id");
    const id = rawSellerId ? Number(rawSellerId) : null;
    setSellerId(id);
  }, []);

  const fetchAnalytics = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      const data = await fetchJsonWithRetry<DeliveryAnalytics>(
        `/api/analytics/delivery?sellerId=${sellerId}&days=${dateRange}`,
        undefined,
        3,
        "delivery-analytics"
      );
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch delivery analytics:", error);
      toast.error("Failed to load delivery analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId, dateRange]);

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const ratingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-slate-300"
        }`}
      />
    ));
  };

  if (!sellerId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Please log in to view analytics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.deliveryAnalytics || "Delivery Analytics"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t.deliveryAnalyticsSubtitle || "Track delivery performance and customer satisfaction"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Package className="h-10 w-10 text-blue-600 bg-blue-100 rounded-lg p-2" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.overview.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-10 w-10 text-emerald-600 bg-emerald-100 rounded-lg p-2" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Delivered</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.overview.deliveredOrders}</p>
                  <p className="text-xs text-emerald-600">{analytics.overview.deliveryRate}% delivery rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-10 w-10 text-purple-600 bg-purple-100 rounded-lg p-2" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Delivery Time</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatHours(analytics.overview.avgDeliveryTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Star className="h-10 w-10 text-yellow-600 bg-yellow-100 rounded-lg p-2" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Delivery Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {analytics.overview.avgDeliveryRating.toFixed(1)}
                    </p>
                    <div className="flex">
                      {ratingStars(analytics.overview.avgDeliveryRating)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    {analytics.overview.confirmationRate}% confirmation rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Order Status Breakdown
              </h3>
              <div className="space-y-3">
                {analytics.statusBreakdown.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        statusColorMap[status.status] || "bg-slate-100 text-slate-800"
                      }`}>
                        {status.status.replace('-', ' ')}
                      </span>
                      <span className="text-sm text-slate-600">{status.count} orders</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {status.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {analytics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.orderId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Order #{activity.orderId}
                      </p>
                      <p className="text-xs text-slate-600">{activity.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        statusColorMap[activity.status] || "bg-slate-100 text-slate-800"
                      }`}>
                        {activity.status.replace('-', ' ')}
                      </span>
                      {activity.deliveryTime && (
                        <p className="text-xs text-slate-500 mt-1">
                          {formatHours(activity.deliveryTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Times Chart */}
          {analytics.deliveryTimes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Delivery Times Over Time
              </h3>
              <div className="space-y-2">
                {analytics.deliveryTimes.slice(-10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {formatHours(item.avgHours)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({item.orderCount} orders)
                      </span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (item.avgHours / 72) * 100)}%` // 72h = 3 days as max
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings Distribution */}
          {analytics.ratings.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Customer Ratings Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Delivery Experience</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = analytics.ratings.filter(r => r.deliveryRating === rating).reduce((sum, r) => sum + r.count, 0);
                      const total = analytics.ratings.reduce((sum, r) => sum + r.count, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm w-3">{rating}</span>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Seller Rating</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = analytics.ratings.filter(r => r.sellerRating === rating).reduce((sum, r) => sum + r.count, 0);
                      const total = analytics.ratings.reduce((sum, r) => sum + r.count, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm w-3">{rating}</span>
                            <Star className="h-4 w-4 fill-blue-400 text-blue-400" />
                          </div>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}