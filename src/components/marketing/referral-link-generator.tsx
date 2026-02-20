"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language";
import { Copy, Check, Share2, QrCode, Gift } from "lucide-react";
import SocialShare from "@/components/social-share";

interface ReferralLinkGeneratorProps {
  storeSlug: string;
  defaultCode?: string;
  onCodeGenerated?: (code: string, link: string) => void;
}

const dict = {
  en: {
    title: "Generate Referral Link",
    subtitle: "Create a personalized referral link to share with friends",
    referralCode: "Referral Code",
    placeholder: "Enter your custom code",
    generate: "Generate Link",
    generatedLink: "Your Referral Link",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",
    shareLink: "Share Link",
    reward: "Reward",
    description: "Share this link to earn rewards when friends make their first purchase",
    customizeCode: "Customize your code",
    linkPreview: "Link Preview",
    howItWorks: "How It Works",
    step1: "Share your link with friends",
    step2: "They click and make a purchase", 
    step3: "You both earn rewards!",
    earnReward: "You earn 10% commission",
    friendReward: "Friends get 5% discount",
    qrCode: "QR Code",
    downloadQR: "Download QR",
  },
  pt: {
    title: "Gerar Link de Referência",
    subtitle: "Crie um link de referência personalizado para partilhar com amigos",
    referralCode: "Código de Referência",
    placeholder: "Digite seu código personalizado",
    generate: "Gerar Link",
    generatedLink: "Seu Link de Referência",
    copyLink: "Copiar Link",
    linkCopied: "Link copiado!",
    shareLink: "Partilhar Link",
    reward: "Recompensa",
    description: "Partilhe este link para ganhar recompensas quando amigos fizerem sua primeira compra",
    customizeCode: "Personalize seu código",
    linkPreview: "Pré-visualização do Link",
    howItWorks: "Como Funciona",
    step1: "Partilhe seu link com amigos",
    step2: "Eles clicam e fazem uma compra",
    step3: "Vocês dois ganham recompensas!",
    earnReward: "Você ganha 10% de comissão",
    friendReward: "Amigos ganham 5% de desconto",
    qrCode: "Código QR",
    downloadQR: "Baixar QR",
  },
};

export default function ReferralLinkGenerator({ 
  storeSlug, 
  defaultCode = "",
  onCodeGenerated 
}: ReferralLinkGeneratorProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const { toast } = useToast();
  
  const [code, setCode] = useState(defaultCode);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLink = () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/ref/${code}?store=${storeSlug}`;
      setGeneratedLink(link);
      setIsGenerating(false);
      
      if (onCodeGenerated) {
        onCodeGenerated(code, link);
      }

      toast({
        title: "Link Generated!",
        description: "Your referral link is ready to share",
      });
    }, 800);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: t.linkCopied,
        description: "The referral link has been copied to your clipboard",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const formatCode = (input: string) => {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  };

  return (
    <div className="space-y-6">
      {/* Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            {t.title}
          </CardTitle>
          <p className="text-sm text-slate-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="referral-code">{t.referralCode}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-code"
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                placeholder={t.placeholder}
                className="font-mono"
              />
              <Button 
                onClick={generateLink}
                disabled={!code.trim() || isGenerating}
                className="whitespace-nowrap"
              >
                {isGenerating ? "Generating..." : t.generate}
              </Button>
            </div>
          </div>

          {generatedLink && (
            <div className="space-y-3">
              <Label>{t.generatedLink}</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={copyLink}
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {t.copyLink}
                </Button>
              </div>

              {/* Share Options */}
              <div className="pt-3 border-t border-slate-100">
                <Label className="text-sm font-medium text-slate-700">{t.shareLink}</Label>
                <div className="mt-2">
                  <SocialShare
                    url={generatedLink}
                    title={`Check out this store: ${storeSlug}`}
                    description={t.description}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.howItWorks}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-1">1. Share</p>
                <p className="text-sm text-blue-700">{t.step1}</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="font-medium text-purple-900 mb-1">2. Purchase</p>
                <p className="text-sm text-purple-700">{t.step2}</p>
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="font-medium text-green-900 mb-1">3. Earn</p>
                <p className="text-sm text-green-700">{t.step3}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Badge className="bg-green-100 text-green-800">{t.reward}</Badge>
              <span className="text-sm text-green-700">{t.earnReward}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Badge className="bg-blue-100 text-blue-800">{t.reward}</Badge>
              <span className="text-sm text-blue-700">{t.friendReward}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}