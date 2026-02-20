"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language";
import { Share2, MessageCircle, Facebook, Twitter, Copy, Check, TrendingUp, BarChart3 } from "lucide-react";

interface EnhancedSocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  storeSlug?: string;
  productId?: string;
  showAnalytics?: boolean;
}

const dict = {
  en: {
    socialSharing: "Social Sharing",
    shareProduct: "Share this product",
    shareStore: "Share store",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "Twitter",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",
    shareStats: "Share Statistics",
    totalShares: "Total Shares",
    thisWeek: "this week",
    mostPopular: "Most Popular",
    recentShares: "Recent Shares",
    shareCount: "shares",
    platformStats: "Platform Breakdown",
    shareText: "Check out this amazing product:",
    storeShareText: "Discover great products at:",
    priceText: "Starting at",
  },
  pt: {
    socialSharing: "Partilha Social",
    shareProduct: "Partilhar este produto",
    shareStore: "Partilhar loja",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "Twitter",
    copyLink: "Copiar Link",
    linkCopied: "Link copiado!",
    shareStats: "Estatísticas de Partilha",
    totalShares: "Total de Partilhas",
    thisWeek: "esta semana",
    mostPopular: "Mais Popular",
    recentShares: "Partilhas Recentes",
    shareCount: "partilhas",
    platformStats: "Divisão por Plataforma",
    shareText: "Confira este produto incrível:",
    storeShareText: "Descubra ótimos produtos em:",
    priceText: "A partir de",
  },
};

export default function EnhancedSocialShare({
  url,
  title,
  description,
  imageUrl,
  price,
  currency = "USD",
  storeSlug,
  productId,
  showAnalytics = false,
}: EnhancedSocialShareProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareStats, setShareStats] = useState({
    total: 0,
    platforms: {
      whatsapp: 0,
      facebook: 0,
      twitter: 0,
      copy_link: 0,
    },
  });

  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;
  const shareText = description || (productId ? t.shareText : t.storeShareText);
  
  // Enhanced share message with price
  const enhancedShareText = price 
    ? `${shareText} ${title} - ${t.priceText} ${currency} ${price.toFixed(2)}`
    : `${shareText} ${title}`;

  useEffect(() => {
    if (showAnalytics) {
      // Mock analytics data - in real implementation, fetch from API
      setShareStats({
        total: 47,
        platforms: {
          whatsapp: 23,
          facebook: 15,
          twitter: 6,
          copy_link: 3,
        },
      });
    }
  }, [showAnalytics]);

  // Track share analytics
  const trackShare = async (platform: string) => {
    try {
      await fetch('/api/analytics/social-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          url: fullUrl,
          title,
          productId,
          storeSlug,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });

      // Update local stats
      setShareStats(prev => ({
        total: prev.total + 1,
        platforms: {
          ...prev.platforms,
          [platform]: prev.platforms[platform as keyof typeof prev.platforms] + 1,
        },
      }));
    } catch (error) {
      console.debug('Share tracking failed:', error);
    }
  };

  const shareOptions = [
    {
      name: t.whatsapp,
      icon: MessageCircle,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
      count: shareStats.platforms.whatsapp,
      action: () => {
        trackShare('whatsapp');
        const text = encodeURIComponent(`${enhancedShareText}\n${fullUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      },
    },
    {
      name: t.facebook,
      icon: Facebook,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
      count: shareStats.platforms.facebook,
      action: () => {
        trackShare('facebook');
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(enhancedShareText)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
      },
    },
    {
      name: t.twitter,
      icon: Twitter,
      color: "bg-sky-100 text-sky-700 hover:bg-sky-200",
      count: shareStats.platforms.twitter,
      action: () => {
        trackShare('twitter');
        const tweetText = encodeURIComponent(`${enhancedShareText} ${fullUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank', 'width=600,height=400');
      },
    },
    {
      name: t.copyLink,
      icon: linkCopied ? Check : Copy,
      color: linkCopied ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      count: shareStats.platforms.copy_link,
      action: async () => {
        trackShare('copy_link');
        try {
          await navigator.clipboard.writeText(fullUrl);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        } catch {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = fullUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        }
      },
    },
  ];

  // Native share API support
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: enhancedShareText,
          url: fullUrl,
        });
        trackShare('native');
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Main Share Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" />
            {productId ? t.shareProduct : t.shareStore}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                onClick={option.action}
                variant="outline"
                className={`flex flex-col gap-1 h-auto p-4 ${option.color} border-2 transition-all hover:scale-105`}
              >
                <option.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{option.name}</span>
                {showAnalytics && option.count > 0 && (
                  <Badge variant="secondary" className="text-xs px-1">
                    {option.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Native Share Button */}
          {'share' in navigator && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button
                onClick={handleNativeShare}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share via device
              </Button>
            </div>
          )}

          {linkCopied && (
            <div className="mt-3 text-center">
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                <Check className="h-3 w-3 mr-1" />
                {t.linkCopied}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Section */}
      {showAnalytics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t.shareStats}
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {shareStats.total} {t.shareCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.totalShares}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{shareStats.total}</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12 {t.thisWeek}
                  </Badge>
                </div>
              </div>

              {/* Platform Breakdown */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">{t.platformStats}</p>
                <div className="space-y-2">
                  {shareOptions.map((option) => {
                    const percentage = shareStats.total > 0 
                      ? (option.count / shareStats.total) * 100 
                      : 0;
                    
                    return (
                      <div key={option.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <option.icon className="h-3 w-3" />
                          <span className="text-xs text-slate-600">{option.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                option.name === t.whatsapp ? 'bg-green-500' :
                                option.name === t.facebook ? 'bg-blue-500' :
                                option.name === t.twitter ? 'bg-sky-500' : 'bg-slate-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-900 w-6 text-right">
                            {option.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}