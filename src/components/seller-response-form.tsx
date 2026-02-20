"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { Send, MessageSquare, AlertCircle } from "lucide-react";

const dict = {
  en: {
    respondToReview: "Respond to Review",
    writeResponse: "Write your response",
    responsePlaceholder: "Thank you for your review. We appreciate your feedback...",
    posting: "Posting...",
    postResponse: "Post Response",
    cancel: "Cancel",
    responsePosted: "Response posted successfully",
    errorPosting: "Error posting response",
    responseLimit: "You can only respond once to each review",
    alreadyResponded: "You have already responded to this review",
    responseGuidelines: "Keep your response professional and helpful",
    maxLength: "Maximum 500 characters",
    charactersLeft: "characters remaining",
  },
  pt: {
    respondToReview: "Responder à Avaliação",
    writeResponse: "Escreva a sua resposta",
    responsePlaceholder: "Obrigado pela sua avaliação. Apreciamos o seu feedback...",
    posting: "A publicar...",
    postResponse: "Publicar Resposta",
    cancel: "Cancelar",
    responsePosted: "Resposta publicada com sucesso",
    errorPosting: "Erro ao publicar resposta",
    responseLimit: "Pode apenas responder uma vez a cada avaliação",
    alreadyResponded: "Já respondeu a esta avaliação",
    responseGuidelines: "Mantenha a sua resposta profissional e útil",
    maxLength: "Máximo 500 caracteres",
    charactersLeft: "caracteres restantes",
  },
};

interface SellerResponseFormProps {
  reviewId: number;
  hasExistingResponse?: boolean;
  onResponsePosted?: (response: any) => void;
  onCancel?: () => void;
}

export default function SellerResponseForm({
  reviewId,
  hasExistingResponse,
  onResponsePosted,
  onCancel,
}: SellerResponseFormProps) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    if (content.length > maxLength) return;
    if (hasExistingResponse) {
      setError(t.alreadyResponded);
      return;
    }

    try {
      setPosting(true);
      setError("");

      const response = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onResponsePosted?.(data.response);
        setContent("");
      } else {
        setError(data.error || t.errorPosting);
      }
    } catch (error) {
      console.error("Error posting response:", error);
      setError(t.errorPosting);
    } finally {
      setPosting(false);
    }
  };

  if (hasExistingResponse) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">{t.alreadyResponded}</p>
        </div>
        <p className="text-xs text-orange-600 mt-1">{t.responseLimit}</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-slate-600" />
        <h4 className="font-medium text-slate-900">{t.respondToReview}</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.responsePlaceholder}
            rows={4}
            maxLength={maxLength}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            disabled={posting}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">{t.responseGuidelines}</p>
            <p className={`text-xs ${remainingChars < 50 ? 'text-orange-600' : 'text-slate-400'}`}>
              {remainingChars} {t.charactersLeft}
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              disabled={posting}
            >
              {t.cancel}
            </button>
          )}
          
          <button
            type="submit"
            disabled={posting || !content.trim() || content.length > maxLength}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-3 w-3" />
            {posting ? t.posting : t.postResponse}
          </button>
        </div>
      </form>
    </div>
  );
}