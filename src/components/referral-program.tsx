"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, Users, DollarSign, TrendingUp, Eye, MousePointer, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface ReferralStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  activeLinks: number;
}

interface ReferralLink {
  id: number;
  code: string;
  targetUrl?: string;
  clicks: number;
  conversions: number;
  totalRevenue: number;
  isActive: boolean;
  createdAt: string;
}

interface ReferralProgramProps {
  storeSlug: string;
  storeName: string;
}

const dict = {
  en: {
    title: "Referral Program",
    subtitle: "Earn rewards by referring new customers",
    generateLink: "Generate New Link",
    shareLink: "Share Link",
    linkGenerated: "Link generated successfully!",
    linkCopied: "Link copied to clipboard!",
    copyLink: "Copy Link",
    stats: "Statistics",
    totalClicks: "Total Clicks",
    totalConversions: "Conversions", 
    totalRevenue: "Revenue Generated",
    activeLinks: "Active Links",
    recentLinks: "Recent Referral Links",
    noLinks: "No referral links yet",
    createFirst: "Create your first referral link to start earning!",
    linkCode: "Link Code",
    performance: "Performance",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    created: "Created",
    howItWorks: "How It Works",
    step1: "Generate a unique referral link",
    step2: "Share it with potential customers",
    step3: "Earn rewards when they make purchases",
    rewardInfo: "You earn 10% commission on referred sales",
    targetProduct: "Target Product (optional)",
    wholeStore: "Whole Store",
    loading: "Loading...",
  },
  pt: {
    title: "Programa de Indicação",
    subtitle: "Ganhe recompensas indicando novos clientes",
    generateLink: "Gerar Novo Link",
    shareLink: "Partilhar Link",
    linkGenerated: "Link gerado com sucesso!",
    linkCopied: "Link copiado para a área de transferência!",
    copyLink: "Copiar Link",
    stats: "Estatísticas",
    totalClicks: "Total de Cliques",
    totalConversions: "Conversões",
    totalRevenue: "Receita Gerada",
    activeLinks: "Links Ativos",
    recentLinks: "Links de Indicação Recentes",
    noLinks: "Ainda não tem links de indicação",
    createFirst: "Crie seu primeiro link de indicação para começar a ganhar!",
    linkCode: "Código do Link",
    performance: "Desempenho",
    status: "Estado",
    active: "Ativo",
    inactive: "Inativo",
    created: "Criado",
    howItWorks: "Como Funciona",
    step1: "Gere um link único de indicação",
    step2: "Partilhe com potenciais clientes",
    step3: "Ganhe recompensas quando fizerem compras",
    rewardInfo: "Ganha 10% de comissão nas vendas indicadas",
    targetProduct: "Produto Alvo (opcional)",
    wholeStore: "Loja Inteira",
    loading: "Carregando...",
  },
};

export default function ReferralProgram({ storeSlug, storeName }: ReferralProgramProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [stats, setStats] = useState<ReferralStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    activeLinks: 0,
  });
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string>("");

  useEffect(() => {
    loadReferralData();
  }, [storeSlug]);

  const loadReferralData = async () => {
    try {
      // Mock data for now since tables don't exist yet
      const mockStats: ReferralStats = {
        totalClicks: 125,
        totalConversions: 8,
        totalRevenue: 450.50,
        activeLinks: 3,
      };

      const mockLinks: ReferralLink[] = [
        {
          id: 1,
          code: "REF-2024-001",
          clicks: 45,
          conversions: 3,
          totalRevenue: 150.25,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          code: "REF-2024-002",
          targetUrl: "/product/123",
          clicks: 32,
          conversions: 2,
          totalRevenue: 89.99,
          isActive: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setStats(mockStats);
      setLinks(mockLinks);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewLink = async () => {
    setGenerating(true);
    try {
      // Mock generation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newLink: ReferralLink = {
        id: Date.now(),
        code: `REF-${Date.now().toString().slice(-6)}`,
        clicks: 0,
        conversions: 0,
        totalRevenue: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setLinks(prev => [newLink, ...prev]);
      setStats(prev => ({ ...prev, activeLinks: prev.activeLinks + 1 }));
      setNotification(t.linkGenerated);
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      console.error("Error generating link:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (linkId: number, code: string) => {
    const fullUrl = `${window.location.origin}/s/${storeSlug}?ref=${code}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.title}</h2>
            <p className="text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={generateNewLink}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            {generating ? t.loading : t.generateLink}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">{t.rewardInfo}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.stats}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <MousePointer className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalClicks}</p>
            <p className="text-sm text-slate-600">{t.totalClicks}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <ShoppingCart className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.totalConversions}</p>
            <p className="text-sm text-slate-600">{t.totalConversions}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-slate-600">{t.totalRevenue}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{stats.activeLinks}</p>
            <p className="text-sm text-slate-600">{t.activeLinks}</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.howItWorks}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", text: t.step1, icon: Share2 },
            { step: "2", text: t.step2, icon: Users },
            { step: "3", text: t.step3, icon: DollarSign },
          ].map(({ step, text, icon: Icon }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div className="flex-1">
                <Icon className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Links */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.recentLinks}</h3>
        
        {links.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-slate-900 font-semibold mb-2">{t.noLinks}</h4>
            <p className="text-slate-600 text-sm">{t.createFirst}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                      {link.code}
                    </code>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      link.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {link.isActive ? t.active : t.inactive}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(link.id, link.code)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
                  >
                    {copiedLinkId === link.id ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{t.linkCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t.copyLink}
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">{t.totalClicks}</p>
                    <p className="font-semibold text-slate-900">{link.clicks}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t.totalConversions}</p>
                    <p className="font-semibold text-slate-900">{link.conversions}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{t.totalRevenue}</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(link.totalRevenue)}</p>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {t.created}: {formatDate(link.createdAt)}
                    {link.targetUrl && (
                      <span> • {t.targetProduct}: {link.targetUrl}</span>
                    )}
                    {!link.targetUrl && <span> • {t.wholeStore}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}