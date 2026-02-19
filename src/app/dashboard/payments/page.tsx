'use client';

import { useState, useEffect } from 'react';
import { getDict } from '@/lib/i18n';
import { useLanguage } from '@/lib/language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentTracker from '@/components/payments/payment-tracker';
import RevenueSettlement from '@/components/payments/revenue-settlement';
import PaymentMethodsConfig from '@/components/payments/payment-methods-config';
import { 
  CreditCard,
  Settings,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface Seller {
  id: number;
  name: string;
  email: string;
  city: string;
}

interface PaymentSummary {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  settledRevenue: number;
  currency: string;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
}

export default function PaymentsPage() {
  const { lang } = useLanguage();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'settlements' | 'configuration'>('payments');
  const dict = getDict(lang);

  useEffect(() => {
    fetchSellerInfo();
    fetchPaymentSummary();
  }, []);

  const fetchSellerInfo = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch seller info');
      }
      
      const data = await response.json();
      setSeller(data.seller);
    } catch (error) {
      console.error('Failed to fetch seller info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      if (!seller?.id) return;
      
      const response = await fetch(`/api/payments?sellerId=${seller.id}&summary=true`);
      if (response.ok) {
        const data = await response.json();
        
        // Calculate summary from payments data
        const payments = data.payments || [];
        const completedPayments = payments.filter((p: any) => p.status === 'completed');
        const pendingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'processing');
        
        const summary: PaymentSummary = {
          totalRevenue: payments.reduce((sum: number, p: any) => sum + parseFloat(p.netAmount), 0),
          confirmedRevenue: completedPayments.reduce((sum: number, p: any) => sum + parseFloat(p.netAmount), 0),
          pendingRevenue: pendingPayments.reduce((sum: number, p: any) => sum + parseFloat(p.netAmount), 0),
          settledRevenue: completedPayments.filter((p: any) => p.settled).reduce((sum: number, p: any) => sum + parseFloat(p.netAmount), 0),
          currency: 'MZN',
          totalPayments: payments.length,
          pendingPayments: pendingPayments.length,
          completedPayments: completedPayments.length,
        };
        
        setPaymentSummary(summary);
      }
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">Authentication Required</p>
              <p className="text-gray-500">Please log in to access payment management</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lang === 'en' ? 'Payments & Revenue' : 'Pagamentos e Receitas'}
              </h1>
              <p className="text-gray-600 mt-1">
                {lang === 'en' 
                  ? 'Manage payments, track revenue, and configure payment methods'
                  : 'Gerir pagamentos, acompanhar receitas e configurar métodos de pagamento'
                }
              </p>
            </div>
            <Button onClick={() => {
              fetchSellerInfo();
              fetchPaymentSummary();
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      {paymentSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentSummary.totalRevenue.toFixed(2)} {paymentSummary.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary.totalPayments} total payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Revenue</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentSummary.confirmedRevenue.toFixed(2)} {paymentSummary.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary.completedPayments} completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentSummary.pendingRevenue.toFixed(2)} {paymentSummary.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentSummary.pendingPayments} pending payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settled Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentSummary.settledRevenue.toFixed(2)} {paymentSummary.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for payout
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {lang === 'en' ? 'Payments' : 'Pagamentos'}
          </TabsTrigger>
          <TabsTrigger value="settlements" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {lang === 'en' ? 'Revenue & Settlements' : 'Receitas e Liquidações'}
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {lang === 'en' ? 'Configuration' : 'Configuração'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <PaymentTracker lang={lang} sellerId={seller.id} />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <RevenueSettlement lang={lang} sellerId={seller.id} />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <PaymentMethodsConfig lang={lang} sellerId={seller.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}