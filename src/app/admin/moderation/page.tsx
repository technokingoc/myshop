"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Search, Flag, Eye, CheckCircle, XCircle, AlertTriangle,
  Package, MessageSquare, Filter, Calendar, User 
} from "lucide-react";

const dict = {
  en: {
    title: "Content Moderation",
    subtitle: "Review flagged content and moderate reviews and products",
    search: "Search content...",
    all: "All",
    flagged: "Flagged",
    approved: "Approved",
    rejected: "Rejected",
    products: "Products",
    reviews: "Reviews",
    type: "Type",
    content: "Content",
    author: "Author",
    flaggedBy: "Flagged By",
    flaggedAt: "Flagged At",
    reason: "Reason",
    status: "Status",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    viewDetails: "View Details",
    moderationNotes: "Moderation Notes",
    addNotes: "Add moderation notes...",
    submit: "Submit",
    cancel: "Cancel",
    noContent: "No content found",
    product: "Product",
    review: "Review",
    spam: "Spam",
    inappropriate: "Inappropriate Content",
    fakeReview: "Fake Review",
    lowQuality: "Low Quality",
    other: "Other",
    confirmAction: "Are you sure you want to {action} this {type}?",
  },
  pt: {
    title: "Moderação de Conteúdo",
    subtitle: "Revisar conteúdo sinalizado e moderar avaliações e produtos",
    search: "Pesquisar conteúdo...",
    all: "Todos",
    flagged: "Sinalizado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    products: "Produtos",
    reviews: "Avaliações",
    type: "Tipo",
    content: "Conteúdo",
    author: "Autor",
    flaggedBy: "Sinalizado Por",
    flaggedAt: "Sinalizado Em",
    reason: "Motivo",
    status: "Estado",
    actions: "Ações",
    approve: "Aprovar",
    reject: "Rejeitar",
    viewDetails: "Ver Detalhes",
    moderationNotes: "Notas de Moderação",
    addNotes: "Adicionar notas de moderação...",
    submit: "Submeter",
    cancel: "Cancelar",
    noContent: "Nenhum conteúdo encontrado",
    product: "Produto",
    review: "Avaliação",
    spam: "Spam",
    inappropriate: "Conteúdo Impróprio",
    fakeReview: "Avaliação Falsa",
    lowQuality: "Baixa Qualidade",
    other: "Outro",
    confirmAction: "Tem certeza de que deseja {action} este {type}?",
  },
};

interface ModerationItem {
  id: number;
  type: 'product' | 'review';
  title: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  moderationStatus: 'flagged' | 'approved' | 'rejected';
  flaggedReason: string;
  flaggedBy?: number;
  flaggedAt?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  productName?: string;
  storeName?: string;
  rating?: number;
}

interface ModerationModalProps {
  item: ModerationItem;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', notes: string) => void;
}

function ModerationModal({ item, onClose, onSubmit }: ModerationModalProps) {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (action) {
      onSubmit(action, notes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t.viewDetails}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Item Information */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              {item.type === 'product' ? (
                <Package className="h-5 w-5 text-blue-600" />
              ) : (
                <MessageSquare className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium text-gray-900 capitalize">
                {t[item.type]} - {item.title}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t.content}</h4>
              <p className="text-gray-700">{item.content}</p>
              
              {item.type === 'review' && item.rating && (
                <div className="flex items-center mt-2">
                  <span className="text-sm font-medium text-gray-700 mr-2">Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= item.rating! ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Author Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t.author}</h4>
            <p className="text-sm text-gray-600">{item.authorName}</p>
            {item.authorEmail && (
              <p className="text-sm text-gray-500">{item.authorEmail}</p>
            )}
            {item.storeName && (
              <p className="text-sm text-gray-600">Store: {item.storeName}</p>
            )}
          </div>

          {/* Flag Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Flag Details</h4>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <span className="font-medium">{t.reason}:</span> {item.flaggedReason}
              </p>
              {item.flaggedAt && (
                <p className="text-sm text-red-700 mt-1">
                  <span className="font-medium">{t.flaggedAt}:</span> {' '}
                  {new Date(item.flaggedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Action Section */}
          {item.moderationStatus === 'flagged' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Moderation Action
              </h3>
              
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setAction('approve')}
                  className={`flex items-center px-4 py-2 rounded-lg border ${
                    action === 'approve' 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t.approve}
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className={`flex items-center px-4 py-2 rounded-lg border ${
                    action === 'reject' 
                      ? 'bg-red-50 border-red-300 text-red-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t.reject}
                </button>
              </div>

              {action && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t.moderationNotes}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.addNotes}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setAction(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleSubmit}
                      className={`px-4 py-2 text-white rounded-lg ${
                        action === 'approve' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {t.submit}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ModerationPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/moderation", { credentials: "include" });
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to load moderation data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((item) => 
        item.title.toLowerCase().includes(q) || 
        item.content.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter !== "all") {
      list = list.filter((item) => item.moderationStatus === statusFilter);
    }
    
    if (typeFilter !== "all") {
      list = list.filter((item) => item.type === typeFilter);
    }
    
    return list;
  }, [items, search, statusFilter, typeFilter]);

  const handleModerationAction = async (action: 'approve' | 'reject', notes: string) => {
    if (!selectedItem) return;

    try {
      await fetch(`/api/admin/moderation/${selectedItem.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes, type: selectedItem.type }),
      });
      load(); // Reload data
    } catch (error) {
      console.error("Failed to update moderation:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Flag className="h-3 w-3 mr-1" />
            {t.flagged}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.approved}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t.rejected}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'product' ? (
      <Package className="h-4 w-4 text-blue-600" />
    ) : (
      <MessageSquare className="h-4 w-4 text-green-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>
        
        <div className="flex gap-1">
          {["all", "flagged", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                statusFilter === status 
                  ? "bg-green-100 text-green-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t[status as keyof typeof t]}
            </button>
          ))}
        </div>
        
        <div className="flex gap-1">
          {["all", "products", "reviews"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type === "all" ? "all" : type.slice(0, -1))}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                (type === "all" && typeFilter === "all") || 
                (type !== "all" && typeFilter === type.slice(0, -1))
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t[type as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">{t.type}</th>
              <th className="px-4 py-3">{t.content}</th>
              <th className="px-4 py-3">{t.author}</th>
              <th className="px-4 py-3">{t.reason}</th>
              <th className="px-4 py-3">{t.flaggedAt}</th>
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {t.noContent}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <span className="font-medium capitalize">{t[item.type]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800 truncate max-w-[200px]">
                        {item.title}
                      </p>
                      <p className="text-slate-600 text-xs truncate max-w-[200px]">
                        {item.content}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.authorName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                      {item.flaggedReason}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.flaggedAt ? new Date(item.flaggedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(item.moderationStatus)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Moderation Modal */}
      {selectedItem && (
        <ModerationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleModerationAction}
        />
      )}
    </div>
  );
}