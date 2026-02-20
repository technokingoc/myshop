"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import {
  Star, TrendingUp, TrendingDown, Minus, MessageSquare, 
  Clock, ThumbsUp, BarChart3, Calendar, Target, AlertCircle
} from "lucide-react";

const dict = {
  en: {
    reviewAnalytics: "Review Analytics",
    overviewTitle: "Review Performance Overview",
    totalReviews: "Total Reviews",
    averageRating: "Average Rating",
    responseRate: "Response Rate",
    avgResponseTime: "Avg Response Time",
    ratingTrend: "Rating Trend",
    improving: "Improving",
    declining: "Declining", 
    stable: "Stable",
    last30Days: "Last 30 Days",
    last7Days: "Last 7 Days",
    hours: "hours",
    sentimentAnalysis: "Sentiment Analysis",
    positiveReviews: "Positive",
    neutralReviews: "Neutral",
    negativeReviews: "Negative",
    ratingDistribution: "Rating Distribution",
    responseMetrics: "Response Metrics",
    respondedReviews: "Responded",
    unrespondedReviews: "Not Responded",
    improvementTips: "Improvement Tips",
    respondFaster: "Try to respond to reviews within 24 hours",
    addressConcerns: "Address negative feedback constructively",
    thankCustomers: "Thank customers for positive reviews",
    noData: "No review data available",
    loading: "Loading analytics...",
  },
  pt: {
    reviewAnalytics: "Análise de Avaliações",
    overviewTitle: "Visão Geral do Desempenho das Avaliações",
    totalReviews: "Total de Avaliações",
    averageRating: "Classificação Média",
    responseRate: "Taxa de Resposta",
    avgResponseTime: "Tempo Médio de Resposta",
    ratingTrend: "Tendência de Classificação",
    improving: "A melhorar",
    declining: "A declinar",
    stable: "Estável",
    last30Days: "Últimos 30 Dias",
    last7Days: "Últimos 7 Dias", 
    hours: "horas",
    sentimentAnalysis: "Análise de Sentimento",
    positiveReviews: "Positivas",
    neutralReviews: "Neutras", 
    negativeReviews: "Negativas",
    ratingDistribution: "Distribuição de Classificações",
    responseMetrics: "Métricas de Resposta",
    respondedReviews: "Respondidas",
    unrespondedReviews: "Não Respondidas",
    improvementTips: "Dicas de Melhoria",
    respondFaster: "Tente responder a avaliações dentro de 24 horas",
    addressConcerns: "Aborde feedback negativo de forma construtiva",
    thankCustomers: "Agradeça aos clientes pelas avaliações positivas",
    noData: "Sem dados de avaliações disponíveis",
    loading: "A carregar análises...",
  },
};

interface ReviewAnalyticsData {
  overview: {
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    avgResponseTimeHours: number;
    ratingTrend: 'improving' | 'declining' | 'stable';
    trendPercentage: number;
  };
  ratingDistribution: {
    [key: number]: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  responseMetrics: {
    respondedCount: number;
    unrespondedCount: number;
  };
}

export default function ReviewAnalyticsDashboard() {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [data, setData] = useState<ReviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard/reviews/analytics?timeRange=${selectedTimeRange}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        console.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return t.improving;
      case 'declining':
        return t.declining;
      default:
        return t.stable;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t.reviewAnalytics}</h2>
          <p className="text-sm text-slate-500">{t.overviewTitle}</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedTimeRange('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedTimeRange === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.last7Days}
          </button>
          <button
            onClick={() => setSelectedTimeRange('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedTimeRange === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.last30Days}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.totalReviews}</p>
              <p className="text-2xl font-bold text-slate-900">{data.overview.totalReviews}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.averageRating}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-900">
                  {data.overview.averageRating.toFixed(1)}
                </p>
                {renderStars(data.overview.averageRating)}
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-400" />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon(data.overview.ratingTrend)}
            <span className="text-xs text-slate-500">
              {getTrendText(data.overview.ratingTrend)}
              {data.overview.trendPercentage > 0 && ` (+${data.overview.trendPercentage.toFixed(1)}%)`}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.responseRate}</p>
              <p className="text-2xl font-bold text-slate-900">{data.overview.responseRate.toFixed(1)}%</p>
            </div>
            <Target className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.avgResponseTime}</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(data.overview.avgResponseTimeHours)}
                <span className="text-sm font-normal text-slate-500 ml-1">{t.hours}</span>
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.ratingDistribution}</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.ratingDistribution[rating] || 0;
              const percentage = data.overview.totalReviews > 0 
                ? (count / data.overview.totalReviews) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 text-xs text-slate-600">{rating} ★</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.sentimentAnalysis}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-700">{t.positiveReviews}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.sentiment.positive}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                <span className="text-sm text-slate-700">{t.neutralReviews}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.sentiment.neutral}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-slate-700">{t.negativeReviews}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">{data.sentiment.negative}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.responseMetrics}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {data.responseMetrics.respondedCount}
            </div>
            <p className="text-sm text-slate-600">{t.respondedReviews}</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {data.responseMetrics.unrespondedCount}
            </div>
            <p className="text-sm text-slate-600">{t.unrespondedReviews}</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">{t.improvementTips}</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• {t.respondFaster}</li>
              <li>• {t.addressConcerns}</li>
              <li>• {t.thankCustomers}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}