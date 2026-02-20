"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Star,
  BarChart3,
  Download
} from "lucide-react";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { getDict } from "@/lib/i18n";

interface DeliveryAnalytics {
  // Overview metrics
  totalOrders: number;
  ordersShipped: number;
  ordersDelivered: number;
  ordersInTransit: number;
  deliveryIssues: number;
  
  // Timing metrics (in hours)
  avgProcessingTime: number;
  avgShippingTime: number;
  avgTotalDeliveryTime: number;
  
  // On-time delivery
  onTimeDeliveries: number;
  lateDeliveries: number;
  onTimeDeliveryRate: number;
  
  // Customer satisfaction
  deliveryRatingsCount: number;
  avgDeliveryRating: number;
  confirmationRate: number;
  
  // Geographic data
  topDeliveryZones: Array<{
    zoneName: string;
    orderCount: number;
    avgDeliveryTime: number;
  }>;
  
  // Trend data (last 30 days)
  dailyMetrics: Array<{
    date: string;
    ordersShipped: number;
    ordersDelivered: number;
    avgDeliveryTime: number;
    onTimeRate: number;
  }>;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  format = 'number'
}: {
  title: string;
  value: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  format?: 'number' | 'percentage' | 'hours' | 'decimal';
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'hours':
        return val < 24 ? `${val.toFixed(1)}h` : `${(val / 24).toFixed(1)}d`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{formatValue(value)}</p>
          </div>
        </div>
        
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 
            'text-slate-600'
          }`}>
            {changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
            {changeType === 'negative' && <TrendingDown className="h-4 w-4" />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default function DeliveryAnalyticsPage() {
  const { lang } = useLanguage();
  const t = getDict(lang).orders as unknown as Record<string, string>;
  const common = getDict(lang).common;
  const toast = useToast();

  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [sellerId, setSellerId] = useState<number | null>(null);

  // Load seller ID from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("myshop_seller_id");
    setSellerId(raw ? Number(raw) : null);
  }, []);

  // Fetch analytics data
  useEffect(() => {
    if (!sellerId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithRetry<DeliveryAnalytics>(
          `/api/analytics/delivery?sellerId=${sellerId}&range=${dateRange}`,
          undefined,
          3,
          "analytics:delivery"
        );
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch delivery analytics:', error);
        toast.error('Failed to load delivery analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sellerId, dateRange, toast]);

  const exportData = () => {
    if (!sellerId) return;
    const params = new URLSearchParams({ sellerId: String(sellerId), range: dateRange });
    try {
      window.open(`/api/analytics/delivery/export.csv?${params.toString()}`, "_blank");
    } catch {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No delivery analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t.deliveryAnalytics || 'Delivery Analytics'}
          </h1>
          <p className="text-slate-600 mt-1">
            {t.deliveryAnalyticsDesc || 'Track delivery performance and customer satisfaction metrics'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">{t.last7Days || 'Last 7 Days'}</option>
            <option value="30d">{t.last30Days || 'Last 30 Days'}</option>
            <option value="90d">{t.last90Days || 'Last 90 Days'}</option>
          </select>
          
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            {t.export || 'Export'}
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t.totalOrders || 'Total Orders'}
          value={analytics.totalOrders}
          icon={Package}
        />
        
        <MetricCard
          title={t.ordersShipped || 'Orders Shipped'}
          value={analytics.ordersShipped}
          icon={Truck}
        />
        
        <MetricCard
          title={t.ordersDelivered || 'Orders Delivered'}
          value={analytics.ordersDelivered}
          icon={CheckCircle}
        />
        
        <MetricCard
          title={t.onTimeDeliveryRate || 'On-Time Delivery Rate'}
          value={analytics.onTimeDeliveryRate}
          icon={Clock}
          format="percentage"
          changeType={analytics.onTimeDeliveryRate > 85 ? 'positive' : analytics.onTimeDeliveryRate < 70 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t.avgProcessingTime || 'Avg Processing Time'}
          value={analytics.avgProcessingTime}
          icon={Clock}
          format="hours"
        />
        
        <MetricCard
          title={t.avgShippingTime || 'Avg Shipping Time'}
          value={analytics.avgShippingTime}
          icon={Truck}
          format="hours"
        />
        
        <MetricCard
          title={t.avgTotalDeliveryTime || 'Avg Total Delivery Time'}
          value={analytics.avgTotalDeliveryTime}
          icon={Package}
          format="hours"
        />
        
        <MetricCard
          title={t.deliveryConfirmationRate || 'Confirmation Rate'}
          value={analytics.confirmationRate}
          icon={CheckCircle}
          format="percentage"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Satisfaction */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t.customerSatisfaction || 'Customer Satisfaction'}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{t.avgDeliveryRating || 'Average Delivery Rating'}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics.avgDeliveryRating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= analytics.avgDeliveryRating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">{t.totalRatings || 'Total Ratings'}</span>
              <span className="text-sm font-medium text-slate-900">
                {analytics.deliveryRatingsCount}
              </span>
            </div>
            
            {analytics.deliveryIssues > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t.deliveryIssues || 'Delivery Issues'}</span>
                <span className="text-sm font-medium text-red-600">
                  {analytics.deliveryIssues}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Delivery Zones */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.topDeliveryZones || 'Top Delivery Zones'}
          </h3>
          
          <div className="space-y-3">
            {analytics.topDeliveryZones.slice(0, 5).map((zone, index) => (
              <div key={zone.zoneName} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{zone.zoneName}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{zone.orderCount}</p>
                  <p className="text-xs text-slate-500">
                    {zone.avgDeliveryTime < 24 
                      ? `${zone.avgDeliveryTime.toFixed(1)}h avg` 
                      : `${(zone.avgDeliveryTime / 24).toFixed(1)}d avg`
                    }
                  </p>
                </div>
              </div>
            ))}
            
            {analytics.topDeliveryZones.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                {t.noDataAvailable || 'No data available'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Trend Chart (placeholder for now) */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t.deliveryTrends || 'Delivery Trends'}
        </h3>
        
        <div className="h-64 flex items-center justify-center border border-dashed border-slate-300 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">
              {t.chartComingSoon || 'Interactive charts coming soon'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t.chartDesc || 'Daily delivery performance visualization will be available here'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}