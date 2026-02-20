"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { getDict } from "@/lib/i18n";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

const dict = {
  en: {
    title: "Invoices & Receipts",
    subtitle: "View and download your billing history",
    search: "Search invoices...",
    filter: "Filter",
    all: "All",
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    
    // Table headers
    invoice: "Invoice",
    date: "Date",
    amount: "Amount",
    status: "Status",
    actions: "Actions",
    
    // Actions
    view: "View",
    download: "Download",
    print: "Print",
    
    // Status
    statusPaid: "Paid",
    statusPending: "Pending", 
    statusFailed: "Failed",
    statusOverdue: "Overdue",
    
    // Empty state
    noInvoices: "No invoices found",
    noInvoicesDesc: "You don't have any invoices yet. Invoices will appear here when you upgrade to a paid plan.",
    
    // Generation
    generateInvoice: "Generate Invoice",
    customInvoice: "Custom Invoice",
    
    // Filters
    dateRange: "Date Range",
    from: "From",
    to: "To",
    clear: "Clear",
    apply: "Apply",
    
    loading: "Loading...",
    error: "Error loading invoices",
  },
  pt: {
    title: "Faturas & Recibos",
    subtitle: "Ver e descarregar o seu historial de faturação",
    search: "Pesquisar faturas...",
    filter: "Filtrar",
    all: "Todas",
    paid: "Pagas",
    pending: "Pendentes",
    failed: "Falhadas",
    
    // Table headers
    invoice: "Fatura",
    date: "Data",
    amount: "Valor",
    status: "Estado",
    actions: "Ações",
    
    // Actions
    view: "Ver",
    download: "Descarregar",
    print: "Imprimir",
    
    // Status
    statusPaid: "Pago",
    statusPending: "Pendente",
    statusFailed: "Falhado",
    statusOverdue: "Em Atraso",
    
    // Empty state
    noInvoices: "Nenhuma fatura encontrada",
    noInvoicesDesc: "Ainda não tem faturas. As faturas aparecerão aqui quando fizer upgrade para um plano pago.",
    
    // Generation
    generateInvoice: "Gerar Fatura",
    customInvoice: "Fatura Personalizada",
    
    // Filters
    dateRange: "Intervalo de Datas",
    from: "De",
    to: "Para",
    clear: "Limpar",
    apply: "Aplicar",
    
    loading: "A carregar...",
    error: "Erro ao carregar faturas",
  },
};

type Invoice = {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "overdue";
  description: string;
  downloadUrl: string;
  viewUrl: string;
};

export default function InvoicesPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    loadInvoices();
  }, []);
  
  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery, statusFilter, dateFrom, dateTo]);
  
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to load invoices");
      }
      
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  
  const filterInvoices = () => {
    let filtered = invoices;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(invoice => new Date(invoice.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(invoice => new Date(invoice.date) <= new Date(dateTo));
    }
    
    setFilteredInvoices(filtered);
  };
  
  const handleDownload = async (invoice: Invoice) => {
    try {
      const response = await fetch(invoice.downloadUrl, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Invoice ${invoice.number} downloaded`);
    } catch (err) {
      toast.error("Failed to download invoice");
    }
  };
  
  const getStatusIcon = (status: Invoice["status"]) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending": return <Clock className="h-4 w-4 text-amber-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "overdue": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };
  
  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "pending": return "bg-amber-100 text-amber-700";
      case "failed": return "bg-red-100 text-red-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setShowFilters(false);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">{t.error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          >
            <option value="all">{t.all}</option>
            <option value="paid">{t.paid}</option>
            <option value="pending">{t.pending}</option>
            <option value="failed">{t.failed}</option>
          </select>
          
          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition"
          >
            <Filter className="h-4 w-4" />
            {t.filter}
          </button>
        </div>
        
        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.from}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.to}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  {t.clear}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-slate-900 mb-1">{t.noInvoices}</h3>
            <p className="text-sm text-slate-600">{t.noInvoicesDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {t.invoice}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {t.date}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {t.amount}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {t.status}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{invoice.number}</p>
                        <p className="text-sm text-slate-500">{invoice.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-900">
                          {new Date(invoice.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">
                          {invoice.amount.toFixed(2)} {invoice.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {t[`status${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}` as keyof typeof t] || invoice.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={invoice.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition"
                        >
                          <Eye className="h-4 w-4" />
                          {t.view}
                        </a>
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition"
                        >
                          <Download className="h-4 w-4" />
                          {t.download}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}