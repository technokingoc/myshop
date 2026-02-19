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
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface PaymentConfirmationProps {
  lang: AppLang;
  orderId: number;
  paymentId?: number;
  onStatusChange?: (status: string) => void;
}

interface PaymentStatus {
  id: number;
  orderId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  method: 'mpesa' | 'bank_transfer' | 'cash_on_delivery';
  provider?: string;
  amount: number;
  currency: string;
  externalId?: string;
  confirmationCode?: string;
  instructions?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: any;
}

export default function PaymentConfirmation({ 
  lang, 
  orderId, 
  paymentId,
  onStatusChange 
}: PaymentConfirmationProps) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const dict = getDict(lang);
  
  const fetchPaymentStatus = async () => {
    try {
      const params = new URLSearchParams();
      if (paymentId) params.set('paymentId', paymentId.toString());
      else params.set('orderId', orderId.toString());
      
      const response = await fetch(`/api/payments/status?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payment status');
      
      const data = await response.json();
      
      if (data.status === 'pending' && !data.id) {
        // No payment created yet
        setPayment(null);
      } else {
        setPayment(data);
        onStatusChange?.(data.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (polling || !payment || ['completed', 'failed', 'cancelled'].includes(payment.status)) {
      return;
    }
    
    setPolling(true);
    const interval = setInterval(async () => {
      await fetchPaymentStatus();
      
      // Stop polling if payment is complete or failed
      if (payment && ['completed', 'failed', 'cancelled'].includes(payment.status)) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds
    
    // Stop polling after 10 minutes
    setTimeout(() => {
      setPolling(false);
      clearInterval(interval);
    }, 600000);
  };

  useEffect(() => {
    fetchPaymentStatus();
  }, [orderId, paymentId]);

  useEffect(() => {
    if (payment && ['processing', 'pending'].includes(payment.status)) {
      startPolling();
    }
  }, [payment]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show toast here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = () => {
    if (!payment) return <Clock className="w-6 h-6 text-gray-400" />;
    
    switch (payment.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getMethodIcon = () => {
    if (!payment) return null;
    
    switch (payment.method) {
      case 'mpesa':
        return <Smartphone className="w-5 h-5" />;
      case 'bank_transfer':
        return <CreditCard className="w-5 h-5" />;
      case 'cash_on_delivery':
        return <Truck className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!payment) return 'No payment initiated';
    
    switch (payment.status) {
      case 'completed':
        return lang === 'en' ? 'Payment completed successfully' : 'Pagamento concluído com sucesso';
      case 'processing':
        return lang === 'en' ? 'Processing payment...' : 'A processar pagamento...';
      case 'pending':
        return lang === 'en' ? 'Waiting for payment' : 'À espera de pagamento';
      case 'failed':
        return lang === 'en' ? 'Payment failed' : 'Pagamento falhado';
      case 'cancelled':
        return lang === 'en' ? 'Payment cancelled' : 'Pagamento cancelado';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{lang === 'en' ? 'Loading payment status...' : 'A carregar estado do pagamento...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchPaymentStatus}
          className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          {lang === 'en' ? 'Try again' : 'Tentar novamente'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Status Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {payment && getMethodIcon()}
              <h3 className="text-lg font-medium text-gray-900">
                {getStatusMessage()}
              </h3>
            </div>
            
            {payment && (
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">
                    {lang === 'en' ? 'Payment ID:' : 'ID do Pagamento:'}
                  </span>{' '}
                  #{payment.id}
                </p>
                <p>
                  <span className="font-medium">
                    {lang === 'en' ? 'Amount:' : 'Quantia:'}
                  </span>{' '}
                  {payment.amount} {payment.currency}
                </p>
                {payment.method === 'mpesa' && payment.provider && (
                  <p>
                    <span className="font-medium">
                      {lang === 'en' ? 'Provider:' : 'Operador:'}
                    </span>{' '}
                    {payment.provider.charAt(0).toUpperCase() + payment.provider.slice(1)}
                  </p>
                )}
                {payment.externalId && (
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">
                      {lang === 'en' ? 'Transaction ID:' : 'ID da Transação:'}
                    </span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {payment.externalId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(payment.externalId!)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </p>
                )}
                {payment.confirmationCode && (
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">
                      {lang === 'en' ? 'Confirmation Code:' : 'Código de Confirmação:'}
                    </span>
                    <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                      {payment.confirmationCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(payment.confirmationCode!)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={fetchPaymentStatus}
              disabled={polling}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {payment && payment.status === 'pending' && payment.method === 'mpesa' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                {lang === 'en' ? 'Complete your M-Pesa payment' : 'Complete o seu pagamento M-Pesa'}
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  {lang === 'en' 
                    ? '1. Dial *150*00# from your mobile phone'
                    : '1. Marque *150*00# do seu telemóvel'
                  }
                </p>
                <p>
                  {lang === 'en'
                    ? '2. Follow the prompts to complete the payment'
                    : '2. Siga as instruções para completar o pagamento'
                  }
                </p>
                <p>
                  {lang === 'en'
                    ? '3. This page will update automatically when payment is confirmed'
                    : '3. Esta página será atualizada automaticamente quando o pagamento for confirmado'
                  }
                </p>
                {payment.externalId && (
                  <p className="font-medium">
                    {lang === 'en'
                      ? `Reference: ${payment.externalId}`
                      : `Referência: ${payment.externalId}`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Instructions */}
      {payment && payment.method === 'bank_transfer' && payment.metadata?.instructions && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">
                {lang === 'en' ? 'Bank Transfer Instructions' : 'Instruções de Transferência Bancária'}
              </h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {payment.metadata.instructions}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Cash on Delivery */}
      {payment && payment.method === 'cash_on_delivery' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Truck className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">
                {lang === 'en' ? 'Cash on Delivery' : 'Pagamento na Entrega'}
              </h4>
              <p className="text-sm text-green-800">
                {lang === 'en'
                  ? 'You will pay when your order is delivered. Please have the exact amount ready.'
                  : 'Pagará quando a sua encomenda for entregue. Por favor, tenha o valor exato pronto.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}