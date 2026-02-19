"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { 
  DollarSign, Settings, Shield, Bell, Globe, 
  Save, RotateCcw, CheckCircle, AlertTriangle 
} from "lucide-react";

const dict = {
  en: {
    title: "Platform Settings",
    subtitle: "Configure global platform settings and fees",
    fees: "Platform Fees",
    moderation: "Moderation Settings",
    notifications: "Notification Settings",
    general: "General Settings",
    feePercentage: "Fee Percentage (%)",
    feeFixed: "Fixed Fee (USD)",
    feeEnabled: "Enable Platform Fees",
    autoApproveSellers: "Auto-approve New Sellers",
    autoApproveProducts: "Auto-approve New Products",
    autoApproveReviews: "Auto-approve New Reviews",
    emailNotifications: "Email Notifications Enabled",
    smsNotifications: "SMS Notifications Enabled",
    defaultCurrency: "Default Currency",
    platformName: "Platform Name",
    supportEmail: "Support Email",
    maxFileSize: "Max File Upload Size (MB)",
    sessionTimeout: "Session Timeout (minutes)",
    save: "Save Settings",
    reset: "Reset to Defaults",
    saved: "Settings saved successfully",
    error: "Failed to save settings",
    confirm: "Are you sure you want to reset to default settings?",
    description: {
      feePercentage: "Percentage fee charged on each transaction",
      feeFixed: "Fixed fee charged per transaction in addition to percentage",
      feeEnabled: "Whether platform fees are collected from transactions",
      autoApproveSellers: "Automatically approve seller registration without manual review",
      autoApproveProducts: "Automatically approve product listings without moderation",
      autoApproveReviews: "Automatically approve customer reviews without moderation",
    }
  },
  pt: {
    title: "Configurações da Plataforma",
    subtitle: "Configurar definições globais da plataforma e taxas",
    fees: "Taxas da Plataforma",
    moderation: "Configurações de Moderação",
    notifications: "Configurações de Notificação",
    general: "Configurações Gerais",
    feePercentage: "Percentagem de Taxa (%)",
    feeFixed: "Taxa Fixa (USD)",
    feeEnabled: "Activar Taxas da Plataforma",
    autoApproveSellers: "Auto-aprovar Novos Vendedores",
    autoApproveProducts: "Auto-aprovar Novos Produtos",
    autoApproveReviews: "Auto-aprovar Novas Avaliações",
    emailNotifications: "Notificações por Email Activadas",
    smsNotifications: "Notificações por SMS Activadas",
    defaultCurrency: "Moeda Padrão",
    platformName: "Nome da Plataforma",
    supportEmail: "Email de Suporte",
    maxFileSize: "Tamanho Máximo de Upload (MB)",
    sessionTimeout: "Timeout de Sessão (minutos)",
    save: "Guardar Configurações",
    reset: "Repor Padrões",
    saved: "Configurações guardadas com sucesso",
    error: "Falha ao guardar configurações",
    confirm: "Tem certeza de que deseja repor as configurações padrão?",
    description: {
      feePercentage: "Taxa percentual cobrada em cada transação",
      feeFixed: "Taxa fixa cobrada por transação além da percentagem",
      feeEnabled: "Se as taxas da plataforma são cobradas das transações",
      autoApproveSellers: "Aprovar automaticamente o registo de vendedores sem revisão manual",
      autoApproveProducts: "Aprovar automaticamente listagens de produtos sem moderação",
      autoApproveReviews: "Aprovar automaticamente avaliações de clientes sem moderação",
    }
  },
};

interface PlatformSettings {
  platform_fee_percentage: string;
  platform_fee_fixed: string;
  platform_fee_enabled: string;
  auto_approve_sellers: string;
  auto_approve_products: string;
  auto_approve_reviews: string;
  email_notifications_enabled: string;
  sms_notifications_enabled: string;
  default_currency: string;
  platform_name: string;
  support_email: string;
  max_file_size_mb: string;
  session_timeout_minutes: string;
}

export default function PlatformSettingsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_fee_percentage: "5.0",
    platform_fee_fixed: "0.30",
    platform_fee_enabled: "true",
    auto_approve_sellers: "false",
    auto_approve_products: "true",
    auto_approve_reviews: "true",
    email_notifications_enabled: "true",
    sms_notifications_enabled: "false",
    default_currency: "USD",
    platform_name: "MyShop",
    support_email: "support@myshop.co.mz",
    max_file_size_mb: "10",
    session_timeout_minutes: "60",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/platform-settings", { credentials: "include" });
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t.saved });
      } else {
        setMessage({ type: 'error', text: t.error });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: 'error', text: t.error });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!confirm(t.confirm)) return;
    
    setSettings({
      platform_fee_percentage: "5.0",
      platform_fee_fixed: "0.30",
      platform_fee_enabled: "true",
      auto_approve_sellers: "false",
      auto_approve_products: "true",
      auto_approve_reviews: "true",
      email_notifications_enabled: "true",
      sms_notifications_enabled: "false",
      default_currency: "USD",
      platform_name: "MyShop",
      support_email: "support@myshop.co.mz",
      max_file_size_mb: "10",
      session_timeout_minutes: "60",
    });
  };

  const updateSetting = (key: keyof PlatformSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    children 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
      <div className="p-2 bg-gray-100 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="ml-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t.reset}
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : t.save}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Platform Fees */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            {t.fees}
          </h2>
          <div className="space-y-4">
            <SettingItem
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
              title={t.feePercentage}
              description={t.description.feePercentage}
            >
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.platform_fee_percentage}
                onChange={(e) => updateSetting('platform_fee_percentage', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </SettingItem>

            <SettingItem
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
              title={t.feeFixed}
              description={t.description.feeFixed}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.platform_fee_fixed}
                onChange={(e) => updateSetting('platform_fee_fixed', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </SettingItem>

            <SettingItem
              icon={<Settings className="h-4 w-4 text-green-600" />}
              title={t.feeEnabled}
              description={t.description.feeEnabled}
            >
              <select
                value={settings.platform_fee_enabled}
                onChange={(e) => updateSetting('platform_fee_enabled', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </SettingItem>
          </div>
        </div>

        {/* Moderation Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            {t.moderation}
          </h2>
          <div className="space-y-4">
            <SettingItem
              icon={<Shield className="h-4 w-4 text-blue-600" />}
              title={t.autoApproveSellers}
              description={t.description.autoApproveSellers}
            >
              <select
                value={settings.auto_approve_sellers}
                onChange={(e) => updateSetting('auto_approve_sellers', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </SettingItem>

            <SettingItem
              icon={<Shield className="h-4 w-4 text-blue-600" />}
              title={t.autoApproveProducts}
              description={t.description.autoApproveProducts}
            >
              <select
                value={settings.auto_approve_products}
                onChange={(e) => updateSetting('auto_approve_products', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </SettingItem>

            <SettingItem
              icon={<Shield className="h-4 w-4 text-blue-600" />}
              title={t.autoApproveReviews}
              description={t.description.autoApproveReviews}
            >
              <select
                value={settings.auto_approve_reviews}
                onChange={(e) => updateSetting('auto_approve_reviews', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </SettingItem>
          </div>
        </div>

        {/* General Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-purple-600" />
            {t.general}
          </h2>
          <div className="space-y-4">
            <SettingItem
              icon={<Globe className="h-4 w-4 text-purple-600" />}
              title={t.platformName}
            >
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </SettingItem>

            <SettingItem
              icon={<Bell className="h-4 w-4 text-purple-600" />}
              title={t.supportEmail}
            >
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => updateSetting('support_email', e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </SettingItem>

            <SettingItem
              icon={<Settings className="h-4 w-4 text-purple-600" />}
              title={t.defaultCurrency}
            >
              <select
                value={settings.default_currency}
                onChange={(e) => updateSetting('default_currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MZN">MZN</option>
                <option value="ZAR">ZAR</option>
              </select>
            </SettingItem>

            <SettingItem
              icon={<Settings className="h-4 w-4 text-purple-600" />}
              title={t.maxFileSize}
            >
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_file_size_mb}
                onChange={(e) => updateSetting('max_file_size_mb', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </SettingItem>
          </div>
        </div>
      </div>
    </div>
  );
}