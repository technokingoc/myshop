"use client";

import { useState } from "react";
import { Share2, MessageCircle, Facebook, Twitter, Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  compact?: boolean;
}

const dict = {
  en: {
    share: "Share",
    shareVia: "Share via",
    whatsapp: "WhatsApp",
    facebook: "Facebook", 
    twitter: "Twitter",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    shareText: "Check out this amazing product:",
    storeShareText: "Discover great products at:",
  },
  pt: {
    share: "Partilhar",
    shareVia: "Partilhar via",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "Twitter", 
    copyLink: "Copiar link",
    linkCopied: "Link copiado!",
    shareText: "Confira este produto incrível:",
    storeShareText: "Descubra ótimos produtos em:",
  },
};

export default function SocialShare({ 
  url, 
  title, 
  description, 
  imageUrl,
  compact = false 
}: SocialShareProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [showDropdown, setShowDropdown] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`;
  
  const shareText = description || (url.includes('/product/') ? t.shareText : t.storeShareText);

  // Track share analytics
  const trackShare = async (platform: string) => {
    try {
      // Send share analytics to backend
      await fetch('/api/analytics/social-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          url: fullUrl,
          title,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      // Fail silently for analytics
      console.debug('Share tracking failed:', error);
    }
  };

  const shareOptions = [
    {
      name: t.whatsapp,
      icon: MessageCircle,
      color: "hover:bg-green-50 hover:text-green-600",
      action: () => {
        trackShare('whatsapp');
        const text = encodeURIComponent(`${shareText} ${title}\n${fullUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      },
    },
    {
      name: t.facebook,
      icon: Facebook,
      color: "hover:bg-blue-50 hover:text-blue-600",
      action: () => {
        trackShare('facebook');
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(`${shareText} ${title}`)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
      },
    },
    {
      name: t.twitter,
      icon: Twitter,
      color: "hover:bg-sky-50 hover:text-sky-600",
      action: () => {
        trackShare('twitter');
        const tweetText = encodeURIComponent(`${shareText} ${title} ${fullUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank', 'width=600,height=400');
      },
    },
    {
      name: t.copyLink,
      icon: linkCopied ? Check : Copy,
      color: linkCopied ? "text-green-600 bg-green-50" : "hover:bg-slate-50 hover:text-slate-700",
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

  // Native share API fallback
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: fullUrl,
        });
        return true;
      } catch (err) {
        // User cancelled or error occurred
        return false;
      }
    }
    return false;
  };

  const handleShare = async () => {
    const nativeShared = await handleNativeShare();
    if (!nativeShared) {
      setShowDropdown(!showDropdown);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={t.share}
        >
          <Share2 className="h-4 w-4" />
        </button>
        
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20">
              <div className="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100">
                {t.shareVia}
              </div>
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    option.action();
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 transition-colors ${option.color}`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-slate-900">{t.share}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {shareOptions.map((option) => (
          <button
            key={option.name}
            onClick={option.action}
            className={`flex items-center gap-2 p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition-all ${option.color} hover:shadow-sm hover:border-slate-300`}
          >
            <option.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.name}</span>
          </button>
        ))}
      </div>
      
      {linkCopied && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          {t.linkCopied}
        </div>
      )}
    </div>
  );
}