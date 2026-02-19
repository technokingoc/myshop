'use client';

import { useState, useEffect } from 'react';
import { getDict, type AppLang } from '@/lib/i18n';
import { 
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Building,
  Info
} from 'lucide-react';

interface RevenueSettlementProps {
  lang: AppLang;
  sellerId: number;
}

interface Settlement {
  id: number;
  sellerId: number;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  platformFees: number;
  paymentFees: number;
  netAmount: number;
  paymentMethod: string;
  paymentReference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentIds: string;
  processedAt?: string;
  paidAt?: string;
  createdAt: string;
  metadata?: any;
}

interface SettlementSummary {
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  pendingSettlements: number;
  completedSettlements: number;
  lastSettlement?: string;
}

export default function RevenueSettlement({ lang, sellerId }: RevenueSettlementProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '7d' | 'all'>('30d');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dict = getDict(lang);

  const fetchSettlements = async () => {
    try {
      const response = await fetch(`/api/settlements?sellerId=${sellerId}&period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch settlements');
      
      const data = await response.json();
      setSettlements(data.settlements || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const createSettlement = async () => {
    try {
      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          action: 'create',
          period: selectedPeriod
        })
      });
      
      if (!response.ok) throw new Error('Failed to create settlement');
      
      await fetchSettlements();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create settlement:', err);
    }
  };

  const exportSettlements = async () => {
    try {
      const response = await fetch('/api/settlements/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          period: selectedPeriod
        })
      });
      
      if (!response.ok) throw new Error('Failed to export settlements');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlements-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export settlements:', err);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [sellerId, selectedPeriod]);

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
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
          onClick={fetchSettlements}
          className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          {lang === 'en' ? 'Try again' : 'Tentar novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'en' ? 'Revenue Settlement' : 'Liquidação de Receitas'}
          </h2>
          <p className="text-gray-600">
            {lang === 'en' 
              ? 'Track your payment settlements and revenue distribution' 
              : 'Acompanhe as suas liquidações de pagamento e distribuição de receitas'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">{lang === 'en' ? 'Last 7 days' : 'Últimos 7 dias'}</option>
            <option value="30d">{lang === 'en' ? 'Last 30 days' : 'Últimos 30 dias'}</option>
            <option value="all">{lang === 'en' ? 'All time' : 'Tudo'}</option>
          </select>
          
          <button
            onClick={exportSettlements}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'en' ? 'Export' : 'Exportar'}</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {lang === 'en' ? 'Request Settlement' : 'Solicitar Liquidação'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {lang === 'en' ? 'Total Revenue' : 'Receita Total'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalRevenue.toFixed(2)} MZN
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {lang === 'en' ? 'Total Fees' : 'Taxas Totais'}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.totalFees.toFixed(2)} MZN
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {lang === 'en' ? 'Net Revenue' : 'Receita Líquida'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.netRevenue.toFixed(2)} MZN
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {lang === 'en' ? 'Pending' : 'Pendentes'}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summary.pendingSettlements}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Settlement History */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {lang === 'en' ? 'Settlement History' : 'Histórico de Liquidações'}
            </h3>
            <button
              onClick={fetchSettlements}
              className="text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {settlements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {lang === 'en' ? 'No settlements found' : 'Nenhuma liquidação encontrada'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Period' : 'Período'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Gross Amount' : 'Quantia Bruta'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Fees' : 'Taxas'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Net Amount' : 'Quantia Líquida'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Status' : 'Estado'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {lang === 'en' ? 'Date' : 'Data'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(settlement.periodStart).toLocaleDateString()} - {' '}
                        {new Date(settlement.periodEnd).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{settlement.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {settlement.grossAmount.toFixed(2)} MZN
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(settlement.platformFees + settlement.paymentFees).toFixed(2)} MZN
                      </div>
                      <div className="text-xs text-gray-500">
                        Platform: {settlement.platformFees.toFixed(2)} | Payment: {settlement.paymentFees.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {settlement.netAmount.toFixed(2)} MZN
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(settlement.status)}
                        <span className={getStatusBadge(settlement.status)}>
                          {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(settlement.createdAt).toLocaleDateString()}</div>
                      {settlement.paidAt && (
                        <div className="text-xs text-green-600">
                          Paid: {new Date(settlement.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlement Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {lang === 'en' ? 'Request Settlement' : 'Solicitar Liquidação'}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      {lang === 'en' ? 'Settlement Information' : 'Informações de Liquidação'}
                    </p>
                    <p>
                      {lang === 'en' 
                        ? 'This will create a settlement request for all completed payments in the selected period. Platform fees and payment processing fees will be deducted.'
                        : 'Isto criará uma solicitação de liquidação para todos os pagamentos concluídos no período selecionado. Taxas da plataforma e taxas de processamento de pagamento serão deduzidas.'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {lang === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  onClick={createSettlement}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {lang === 'en' ? 'Create Settlement' : 'Criar Liquidação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}