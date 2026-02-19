"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Search, Eye, CheckCircle, XCircle, Clock, FileText, 
  User, Calendar, AlertTriangle, MessageSquare 
} from "lucide-react";

const dict = {
  en: {
    title: "Seller Verification",
    subtitle: "Review and approve seller applications",
    search: "Search by name or email...",
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    name: "Name",
    email: "Email",
    businessType: "Business Type",
    requestedAt: "Requested",
    status: "Status",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    viewDetails: "View Details",
    approvalNotes: "Approval Notes",
    rejectionNotes: "Rejection Notes",
    addNotes: "Add Notes",
    submit: "Submit",
    cancel: "Cancel",
    confirmApprove: "Approve this seller?",
    confirmReject: "Reject this seller?",
    noSellers: "No sellers found",
    businessDocuments: "Business Documents",
    storeInfo: "Store Information",
    contactInfo: "Contact Information",
    verificationHistory: "Verification History",
    reviewedBy: "Reviewed By",
    reviewedAt: "Reviewed At",
  },
  pt: {
    title: "Verificação de Vendedores",
    subtitle: "Revisar e aprovar candidaturas de vendedores",
    search: "Pesquisar por nome ou email...",
    all: "Todos",
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    name: "Nome",
    email: "Email",
    businessType: "Tipo de Negócio",
    requestedAt: "Solicitado",
    status: "Estado",
    actions: "Ações",
    approve: "Aprovar",
    reject: "Rejeitar",
    viewDetails: "Ver Detalhes",
    approvalNotes: "Notas de Aprovação",
    rejectionNotes: "Notas de Rejeição",
    addNotes: "Adicionar Notas",
    submit: "Submeter",
    cancel: "Cancelar",
    confirmApprove: "Aprovar este vendedor?",
    confirmReject: "Rejeitar este vendedor?",
    noSellers: "Nenhum vendedor encontrado",
    businessDocuments: "Documentos do Negócio",
    storeInfo: "Informações da Loja",
    contactInfo: "Informações de Contacto",
    verificationHistory: "Histórico de Verificação",
    reviewedBy: "Revisto Por",
    reviewedAt: "Revisto Em",
  },
};

interface VerificationSeller {
  id: number;
  name: string;
  email: string;
  slug: string;
  businessType: string;
  city: string;
  country: string;
  phone?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationRequestedAt: string;
  verificationReviewedAt?: string;
  verificationReviewedBy?: number;
  verificationNotes: string;
  businessDocuments: any[];
  socialLinks: any;
  createdAt: string;
}

interface VerificationModalProps {
  seller: VerificationSeller;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', notes: string) => void;
}

function VerificationModal({ seller, onClose, onSubmit }: VerificationModalProps) {
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
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
          {/* Store Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              {t.storeInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.name}
                </label>
                <p className="mt-1 text-sm text-gray-900">{seller.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.businessType}
                </label>
                <p className="mt-1 text-sm text-gray-900">{seller.businessType || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900">{seller.description || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              {t.contactInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.email}
                </label>
                <p className="mt-1 text-sm text-gray-900">{seller.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <p className="mt-1 text-sm text-gray-900">{seller.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {[seller.address, seller.city, seller.country].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Business Documents */}
          {seller.businessDocuments && seller.businessDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                {t.businessDocuments}
              </h3>
              <div className="space-y-2">
                {seller.businessDocuments.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">{doc.type || 'Unknown type'}</p>
                    </div>
                    <button
                      onClick={() => window.open(doc.url, '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-orange-600" />
              {t.verificationHistory}
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Requested:</span> {' '}
                  {new Date(seller.verificationRequestedAt).toLocaleString()}
                </p>
              </div>
              {seller.verificationReviewedAt && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{t.reviewedAt}:</span> {' '}
                    {new Date(seller.verificationReviewedAt).toLocaleString()}
                  </p>
                  {seller.verificationNotes && (
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Notes:</span> {seller.verificationNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          {seller.verificationStatus === 'pending' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Review Action
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
                      {action === 'approve' ? t.approvalNotes : t.rejectionNotes}
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

export default function VerificationPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [sellers, setSellers] = useState<VerificationSeller[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState<VerificationSeller | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch("/api/admin/verification", { credentials: "include" });
      const data = await response.json();
      setSellers(data.sellers || []);
    } catch (error) {
      console.error("Failed to load verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = sellers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => 
        s.name.toLowerCase().includes(q) || 
        (s.email || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.verificationStatus === statusFilter);
    }
    return list;
  }, [sellers, search, statusFilter]);

  const handleVerificationAction = async (action: 'approve' | 'reject', notes: string) => {
    if (!selectedSeller) return;

    try {
      await fetch(`/api/admin/verification/${selectedSeller.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      load(); // Reload data
    } catch (error) {
      console.error("Failed to update verification:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {t.pending}
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t.rejected}
          </span>
        );
      default:
        return null;
    }
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
          {["all", "pending", "approved", "rejected"].map((status) => (
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-3">{t.name}</th>
              <th className="px-4 py-3">{t.email}</th>
              <th className="px-4 py-3">{t.businessType}</th>
              <th className="px-4 py-3">{t.requestedAt}</th>
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {t.noSellers}
                </td>
              </tr>
            ) : (
              filtered.map((seller) => (
                <tr key={seller.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{seller.name}</td>
                  <td className="px-4 py-3 text-slate-600">{seller.email}</td>
                  <td className="px-4 py-3 text-slate-600">{seller.businessType || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(seller.verificationRequestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(seller.verificationStatus)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedSeller(seller)}
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

      {/* Verification Modal */}
      {selectedSeller && (
        <VerificationModal
          seller={selectedSeller}
          onClose={() => setSelectedSeller(null)}
          onSubmit={handleVerificationAction}
        />
      )}
    </div>
  );
}