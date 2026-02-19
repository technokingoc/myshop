"use client";

import { useState, useEffect } from "react";
import { getDict, type AppLang } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, 
  CreditCard, 
  Save, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { toast } from "@/lib/toast";

interface PaymentMethodsConfigProps {
  lang: AppLang;
  sellerId: number;
}

interface PaymentMethodConfig {
  id?: number;
  method: "mpesa" | "bank_transfer";
  enabled: boolean;
  displayName: string;
  instructions: string;
  
  // Bank transfer fields
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  bankBranch?: string;
  bankSwiftCode?: string;
  bankInstructions?: string;
  
  // M-Pesa fields
  mpesaBusinessNumber?: string;
  mpesaBusinessName?: string;
  mpesaEnvironment?: "sandbox" | "production";
  mpesaConfigured?: boolean;
}

export default function PaymentMethodsConfig({ lang, sellerId }: PaymentMethodsConfigProps) {
  const dict = getDict(lang);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [methods, setMethods] = useState<Record<string, PaymentMethodConfig>>({
    mpesa: {
      method: "mpesa",
      enabled: false,
      displayName: "M-Pesa",
      instructions: "",
      mpesaEnvironment: "sandbox"
    },
    bank_transfer: {
      method: "bank_transfer",
      enabled: false,
      displayName: "Bank Transfer",
      instructions: "",
    }
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [sellerId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments/methods");
      const data = await response.json();

      if (response.ok && data.methods) {
        const methodsMap: Record<string, PaymentMethodConfig> = {
          mpesa: { ...methods.mpesa },
          bank_transfer: { ...methods.bank_transfer }
        };

        data.methods.forEach((method: PaymentMethodConfig) => {
          if (methodsMap[method.method]) {
            methodsMap[method.method] = { ...methodsMap[method.method], ...method };
          }
        });

        setMethods(methodsMap);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethod = async (method: "mpesa" | "bank_transfer") => {
    try {
      setSaving(true);
      const methodConfig = methods[method];

      const response = await fetch("/api/payments/methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(methodConfig),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment method saved successfully");
        await fetchPaymentMethods();
      } else {
        toast.error(data.error || "Failed to save payment method");
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  const updateMethod = (method: "mpesa" | "bank_transfer", updates: Partial<PaymentMethodConfig>) => {
    setMethods(prev => ({
      ...prev,
      [method]: { ...prev[method], ...updates }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods Configuration
          </CardTitle>
          <CardDescription>
            Configure your payment methods to start accepting payments from customers
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value="mpesa" onValueChange={() => {}} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mpesa" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            M-Pesa
          </TabsTrigger>
          <TabsTrigger value="bank_transfer" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Bank Transfer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mpesa" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <CardTitle>M-Pesa Configuration</CardTitle>
                </div>
                <Switch
                  checked={methods.mpesa.enabled}
                  onCheckedChange={(enabled) => updateMethod("mpesa", { enabled })}
                />
              </div>
              <CardDescription>
                Configure M-Pesa mobile money payments for Mozambique (Vodacom & Movitel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-display-name">Display Name</Label>
                  <Input
                    id="mpesa-display-name"
                    value={methods.mpesa.displayName}
                    onChange={(e) => updateMethod("mpesa", { displayName: e.target.value })}
                    placeholder="M-Pesa Mobile Money"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mpesa-business-name">Business Name</Label>
                  <Input
                    id="mpesa-business-name"
                    value={methods.mpesa.mpesaBusinessName || ""}
                    onChange={(e) => updateMethod("mpesa", { mpesaBusinessName: e.target.value })}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mpesa-business-number">Business Number</Label>
                  <Input
                    id="mpesa-business-number"
                    value={methods.mpesa.mpesaBusinessNumber || ""}
                    onChange={(e) => updateMethod("mpesa", { mpesaBusinessNumber: e.target.value })}
                    placeholder="171717"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mpesa-environment">Environment</Label>
                  <select
                    id="mpesa-environment"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={methods.mpesa.mpesaEnvironment}
                    onChange={(e) => updateMethod("mpesa", { mpesaEnvironment: e.target.value as "sandbox" | "production" })}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mpesa-instructions">Instructions for Customers</Label>
                <Textarea
                  id="mpesa-instructions"
                  value={methods.mpesa.instructions}
                  onChange={(e) => updateMethod("mpesa", { instructions: e.target.value })}
                  placeholder="Instructions on how customers should pay via M-Pesa..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">M-Pesa Integration Info:</p>
                  <p>Currently using sandbox mode for testing. To enable production payments, you'll need to:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Get API credentials from Vodacom or Movitel</li>
                    <li>Configure your business shortcode</li>
                    <li>Set up webhook endpoints for payment confirmation</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => savePaymentMethod("mpesa")}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save M-Pesa Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank_transfer" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <CardTitle>Bank Transfer Configuration</CardTitle>
                </div>
                <Switch
                  checked={methods.bank_transfer.enabled}
                  onCheckedChange={(enabled) => updateMethod("bank_transfer", { enabled })}
                />
              </div>
              <CardDescription>
                Configure bank transfer details for direct payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-display-name">Display Name</Label>
                  <Input
                    id="bank-display-name"
                    value={methods.bank_transfer.displayName}
                    onChange={(e) => updateMethod("bank_transfer", { displayName: e.target.value })}
                    placeholder="Bank Transfer"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={methods.bank_transfer.bankName || ""}
                    onChange={(e) => updateMethod("bank_transfer", { bankName: e.target.value })}
                    placeholder="Standard Bank Mozambique"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Account Number</Label>
                  <Input
                    id="bank-account"
                    value={methods.bank_transfer.bankAccount || ""}
                    onChange={(e) => updateMethod("bank_transfer", { bankAccount: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-account-name">Account Name</Label>
                  <Input
                    id="bank-account-name"
                    value={methods.bank_transfer.bankAccountName || ""}
                    onChange={(e) => updateMethod("bank_transfer", { bankAccountName: e.target.value })}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-branch">Branch</Label>
                  <Input
                    id="bank-branch"
                    value={methods.bank_transfer.bankBranch || ""}
                    onChange={(e) => updateMethod("bank_transfer", { bankBranch: e.target.value })}
                    placeholder="Maputo Central"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank-swift">SWIFT Code (Optional)</Label>
                  <Input
                    id="bank-swift"
                    value={methods.bank_transfer.bankSwiftCode || ""}
                    onChange={(e) => updateMethod("bank_transfer", { bankSwiftCode: e.target.value })}
                    placeholder="SBICMZMX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-instructions">Transfer Instructions</Label>
                <Textarea
                  id="bank-instructions"
                  value={methods.bank_transfer.bankInstructions || ""}
                  onChange={(e) => updateMethod("bank_transfer", { bankInstructions: e.target.value })}
                  placeholder="Please include your order reference number in the transfer description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-instructions">Instructions for Customers</Label>
                <Textarea
                  id="customer-instructions"
                  value={methods.bank_transfer.instructions}
                  onChange={(e) => updateMethod("bank_transfer", { instructions: e.target.value })}
                  placeholder="Instructions on how customers should make the bank transfer..."
                  rows={3}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Manual Confirmation Required:</p>
                  <p>Bank transfer payments require manual confirmation. You'll need to check your bank account and confirm payments in your dashboard.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => savePaymentMethod("bank_transfer")}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Bank Transfer Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Payment Methods Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">M-Pesa</p>
                  <p className="text-sm text-gray-500">Mobile Money</p>
                </div>
              </div>
              <div className="text-right">
                {methods.mpesa.enabled ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-sm text-gray-500">Direct Transfer</p>
                </div>
              </div>
              <div className="text-right">
                {methods.bank_transfer.enabled ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}