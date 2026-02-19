'use client';

import { useState, useEffect } from 'react';
import { getDict, type AppLang } from '@/lib/i18n';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Smartphone, 
  CreditCard, 
  Truck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface PaymentTrackerProps {
  lang: AppLang;
  sellerId: number;
}

interface Payment {
  id: number;
  orderId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: 'mpesa' | 'bank_transfer' | 'cash_on_delivery';
  provider?: string;
  amount: number;
  currency: string;
  fees: number;
  netAmount: number;
  externalId?: string;
  confirmationCode?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  completedAt?: string;
  settled: boolean;
  settledAt?: string;
}

export default function PaymentTracker({ lang, sellerId }: PaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const dict = getDict(lang);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments?sellerId=${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: number, status: string, reason?: string) => {
    try {
      const response = await fetch('/api/payments/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status, reason })
      });
      
      if (!response.ok) throw new Error('Failed to update payment status');
      
      // Refresh payments
      await fetchPayments();
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [sellerId]);

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch = !searchTerm || 
      payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toString().includes(searchTerm) ||
      payment.externalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return <Smartphone className="w-4 h-4" />;
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'cash_on_delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTotalStats = () => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const completed = filteredPayments.filter(p => p.status === 'completed').length;
    const pending = filteredPayments.filter(p => p.status === 'pending').length;
    const settled = filteredPayments.reduce((sum, p) => sum + (p.settled ? p.netAmount : 0), 0);
    
    return { total, completed, pending, settled };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchPayments}
          className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          {lang === 'en' ? 'Try again' : 'Tentar novamente'}
        </button>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Total Payments' : 'Pagamentos Totais'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Completed' : 'Concluídos'}
              </p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Pending' : 'Pendentes'}
              </p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {lang === 'en' ? 'Revenue' : 'Receita'}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total.toFixed(2)} MZN
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search payments...' : 'Pesquisar pagamentos...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{lang === 'en' ? 'All Status' : 'Todos'}</option>
              <option value="pending">{lang === 'en' ? 'Pending' : 'Pendente'}</option>
              <option value="completed">{lang === 'en' ? 'Completed' : 'Concluído'}</option>
              <option value="failed">{lang === 'en' ? 'Failed' : 'Falhado'}</option>
            </select>
            
            <button
              onClick={fetchPayments}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {lang === 'en' ? 'No payments found' : 'Nenhum pagamento encontrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Order' : 'Pedido'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Customer' : 'Cliente'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Method' : 'Método'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Amount' : 'Quantia'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Status' : 'Estado'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Date' : 'Data'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Actions' : 'Ações'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{payment.orderId}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {payment.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.customerName || 'N/A'}</div>
                      {payment.customerPhone && (
                        <div className="text-xs text-gray-500">{payment.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(payment.method)}
                        <span className="text-sm text-gray-900 capitalize">
                          {payment.method.replace('_', ' ')}
                        </span>
                      </div>
                      {payment.provider && (
                        <div className="text-xs text-gray-500 capitalize">{payment.provider}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.amount.toFixed(2)} {payment.currency}
                      </div>
                      {payment.fees > 0 && (
                        <div className="text-xs text-gray-500">
                          {lang === 'en' ? 'Fees' : 'Taxas'}: {payment.fees.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(payment.status)}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.settled && (
                        <div className="text-xs text-green-600 mt-1">
                          {lang === 'en' ? 'Settled' : 'Liquidado'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => updatePaymentStatus(payment.id, 'completed', 'Manually marked as completed')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {lang === 'en' ? 'Payment Details' : 'Detalhes do Pagamento'}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'Payment ID' : 'ID do Pagamento'}
                    </label>
                    <p className="text-gray-900">#{selectedPayment.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'Order ID' : 'ID do Pedido'}
                    </label>
                    <p className="text-gray-900">#{selectedPayment.orderId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'Amount' : 'Quantia'}
                    </label>
                    <p className="text-gray-900 text-lg font-semibold">
                      {selectedPayment.amount.toFixed(2)} {selectedPayment.currency}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'Net Amount' : 'Quantia Líquida'}
                    </label>
                    <p className="text-gray-900 text-lg font-semibold">
                      {selectedPayment.netAmount.toFixed(2)} {selectedPayment.currency}
                    </p>
                  </div>
                </div>

                {selectedPayment.externalId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'External Transaction ID' : 'ID da Transação Externa'}
                    </label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-100 p-2 rounded">
                      {selectedPayment.externalId}
                    </p>
                  </div>
                )}

                {selectedPayment.confirmationCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {lang === 'en' ? 'Confirmation Code' : 'Código de Confirmação'}
                    </label>
                    <p className="text-green-600 font-mono text-sm bg-green-50 p-2 rounded">
                      {selectedPayment.confirmationCode}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {lang === 'en' ? 'Close' : 'Fechar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}