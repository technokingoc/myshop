"use client";

import { useLanguage } from "@/lib/language";
import { Store, Clock, Shield } from "lucide-react";

const dict = {
  en: {
    sellerResponse: "Seller Response",
    respondedOn: "Responded on",
    verified: "Verified Seller",
    moderationPending: "Response pending moderation",
    responseFrom: "Response from",
  },
  pt: {
    sellerResponse: "Resposta do Vendedor",
    respondedOn: "Respondeu em",
    verified: "Vendedor Verificado",
    moderationPending: "Resposta pendente de moderação",
    responseFrom: "Resposta de",
  },
};

interface SellerResponseProps {
  response: {
    id: number;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  storeName?: string;
  storeVerified?: boolean;
}

export default function SellerResponse({
  response,
  storeName = "Store Owner",
  storeVerified = false,
}: SellerResponseProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  // Don't render if response is hidden or pending (for customers)
  if (response.status === 'hidden' || response.status === 'pending') {
    return null;
  }

  return (
    <div className="ml-6 mt-4 border-l-2 border-green-100 pl-4 bg-green-50 rounded-r-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Store className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {storeName}
              </span>
              {storeVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Shield className="h-3 w-3" />
                  {t.verified}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {t.respondedOn} {new Date(response.createdAt).toLocaleDateString(
                lang === 'pt' ? 'pt-PT' : 'en-US'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-700 leading-relaxed">
        <p className="font-medium text-green-800 mb-1 text-xs uppercase tracking-wide">
          {t.sellerResponse}
        </p>
        <p>{response.content}</p>
      </div>

      {response.status === 'pending' && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1">
          {t.moderationPending}
        </div>
      )}
    </div>
  );
}