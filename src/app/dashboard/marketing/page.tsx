"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { getSessionFromCookie } from "@/lib/session";
import ReferralProgram from "@/components/referral-program";
import EmailMarketing from "@/components/email-marketing";
import {
  Mail,
  Share2,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Eye,
  ArrowUpRight,
} from "lucide-react";

const dict = {
  en: {
    title: "Marketing Tools",
    subtitle: "Grow your business with powerful marketing features",
    overview: "Marketing Overview",
    totalShares: "Total Shares",
    referralClicks: "Referral Clicks", 
    emailCampaigns: "Email Campaigns",
    conversionRate: "Conversion Rate",
    thisMonth: "this month",
    active: "active",
    loading: "Loading...",
    emailMarketing: "Email Marketing",
    referralProgram: "Referral Program",
  },
  pt: {
    title: "Ferramentas de Marketing",
    subtitle: "Faça crescer o seu negócio com funcionalidades de marketing poderosas",
    overview: "Visão Geral do Marketing",
    totalShares: "Total de Partilhas",
    referralClicks: "Cliques de Indicação",
    emailCampaigns: "Campanhas de Email",
    conversionRate: "Taxa de Conversão",
    thisMonth: "este mês",
    active: "ativo",
    loading: "Carregando...",
    emailMarketing: "Marketing por Email",
    referralProgram: "Programa de Indicação",
  },
};

interface SellerInfo {
  slug: string;
  name: string;
}

export default function MarketingPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [activeTab, setActiveTab] = useState<"overview" | "email" | "referrals">("overview");
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [marketingStats, setMarketingStats] = useState({
    totalShares: 0,
    referralClicks: 0,
    emailCampaigns: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      // Get seller info from session/API
      const response = await fetch("/api/sellers/me");
      if (response.ok) {
        const data = await response.json();
        setSellerInfo(data.seller);
      }

      // Mock stats for now
      setMarketingStats({
        totalShares: 245,
        referralClicks: 89,
        emailCampaigns: 3,
        conversionRate: 12.5,
      });
    } catch (error) {
      console.error("Error loading marketing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ 
    id, 
    children, 
    icon: Icon 
  }: { 
    id: "overview" | "email" | "referrals"; 
    children: React.ReactNode;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.title}</h1>
          <p className="text-slate-600">{t.subtitle}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <TabButton id="overview" icon={TrendingUp}>{t.overview}</TabButton>
          <TabButton id="email" icon={Mail}>{t.emailMarketing}</TabButton>
          <TabButton id="referrals" icon={Share2}>{t.referralProgram}</TabButton>
        </div>

        {/* Tab Content */}
        <div className="min-h-screen">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{t.totalShares}</p>
                      <p className="text-2xl font-bold text-slate-900">{marketingStats.totalShares}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.thisMonth}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Share2 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{t.referralClicks}</p>
                      <p className="text-2xl font-bold text-slate-900">{marketingStats.referralClicks}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.thisMonth}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{t.emailCampaigns}</p>
                      <p className="text-2xl font-bold text-slate-900">{marketingStats.emailCampaigns}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.active}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{t.conversionRate}</p>
                      <p className="text-2xl font-bold text-slate-900">{marketingStats.conversionRate}%</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +2.3%
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Target className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab("email")}
                    className="flex items-center gap-3 p-4 text-left rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <Mail className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">Create Email Campaign</h4>
                      <p className="text-sm text-slate-600">Send newsletters and promotions</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab("referrals")}
                    className="flex items-center gap-3 p-4 text-left rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <Share2 className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">Generate Referral Link</h4>
                      <p className="text-sm text-slate-600">Earn from customer referrals</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 p-4 text-left rounded-lg border border-slate-200 bg-slate-50">
                    <DollarSign className="h-8 w-8 text-slate-400" />
                    <div>
                      <h4 className="font-medium text-slate-500">Analytics Dashboard</h4>
                      <p className="text-sm text-slate-500">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <EmailMarketing 
              storeSlug={sellerInfo?.slug || ""} 
              storeName={sellerInfo?.name || ""} 
            />
          )}

          {activeTab === "referrals" && (
            <ReferralProgram 
              storeSlug={sellerInfo?.slug || ""} 
              storeName={sellerInfo?.name || ""} 
            />
          )}
        </div>
      </div>
    </div>
  );
}