"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { Settings, Bell, Shield, Globe, Save, Loader2, CheckCircle, Trash2, AlertTriangle } from "lucide-react";

const dict = {
  en: {
    title: "Account Settings", subtitle: "Manage your account preferences",
    loading: "Loading...", save: "Save Changes", saving: "Saving...", saved: "Saved!",
    
    // Sections
    notifications: "Notifications", privacy: "Privacy & Security", language: "Language", 
    dangerZone: "Danger Zone",
    
    // Notification settings
    emailNotifications: "Email Notifications",
    orderUpdates: "Order status updates", orderUpdatesDesc: "Get notified when your order status changes",
    promotions: "Promotions & offers", promotionsDesc: "Receive promotional emails and special offers",
    newsletter: "Newsletter", newsletterDesc: "Weekly newsletter with new products and tips",
    
    // Privacy settings
    profileVisibility: "Profile Visibility",
    showProfile: "Show my profile to other users", showProfileDesc: "Allow other users to see your public profile",
    dataCollection: "Data Collection", dataCollectionDesc: "Allow us to collect usage data to improve your experience",
    
    // Language settings
    preferredLanguage: "Preferred Language", languageDesc: "Choose your preferred language for the interface",
    
    // Danger zone
    deleteAccount: "Delete Account", deleteAccountDesc: "Permanently delete your account and all associated data",
    deleteConfirm: "Are you sure you want to delete your account? This action cannot be undone.",
    deleteButton: "Delete My Account",
  },
  pt: {
    title: "Configurações da Conta", subtitle: "Gerencie suas preferências de conta",
    loading: "A carregar...", save: "Guardar Alterações", saving: "A guardar...", saved: "Guardado!",
    
    // Sections
    notifications: "Notificações", privacy: "Privacidade e Segurança", language: "Idioma", 
    dangerZone: "Zona de Perigo",
    
    // Notification settings
    emailNotifications: "Notificações por Email",
    orderUpdates: "Atualizações de pedidos", orderUpdatesDesc: "Receber notificações quando o estado do pedido mudar",
    promotions: "Promoções e ofertas", promotionsDesc: "Receber emails promocionais e ofertas especiais",
    newsletter: "Newsletter", newsletterDesc: "Newsletter semanal com novos produtos e dicas",
    
    // Privacy settings
    profileVisibility: "Visibilidade do Perfil",
    showProfile: "Mostrar meu perfil para outros usuários", showProfileDesc: "Permitir que outros usuários vejam seu perfil público",
    dataCollection: "Coleta de Dados", dataCollectionDesc: "Permitir que coletemos dados de uso para melhorar sua experiência",
    
    // Language settings
    preferredLanguage: "Idioma Preferido", languageDesc: "Escolha seu idioma preferido para a interface",
    
    // Danger zone
    deleteAccount: "Apagar Conta", deleteAccountDesc: "Apagar permanentemente sua conta e todos os dados associados",
    deleteConfirm: "Tem certeza de que quer apagar sua conta? Esta ação não pode ser desfeita.",
    deleteButton: "Apagar Minha Conta",
  },
};

type Settings = {
  emailNotifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  privacy: {
    showProfile: boolean;
    dataCollection: boolean;
  };
  language: string;
};

export default function CustomerSettingsPage() {
  const { lang, setLang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: {
      orderUpdates: true,
      promotions: false,
      newsletter: false,
    },
    privacy: {
      showProfile: false,
      dataCollection: true,
    },
    language: lang,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/auth/customer/settings", { credentials: "include" });
      if (response.status === 401) {
        router.push("/customer/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...settings, ...data.settings });
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      const response = await fetch("/api/auth/customer/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaved(true);
        // Update language if changed
        if (settings.language !== lang) {
          setLang(settings.language as 'en' | 'pt');
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch("/api/auth/customer/delete", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to homepage after account deletion
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
          <p className="text-xs text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* Notifications Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">{t.notifications}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.orderUpdates}</p>
                <p className="text-xs text-slate-500">{t.orderUpdatesDesc}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.orderUpdates}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailNotifications: {
                      ...settings.emailNotifications,
                      orderUpdates: e.target.checked
                    }
                  })}
                  className="rounded border-slate-300"
                />
              </label>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.promotions}</p>
                <p className="text-xs text-slate-500">{t.promotionsDesc}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.promotions}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailNotifications: {
                      ...settings.emailNotifications,
                      promotions: e.target.checked
                    }
                  })}
                  className="rounded border-slate-300"
                />
              </label>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.newsletter}</p>
                <p className="text-xs text-slate-500">{t.newsletterDesc}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.newsletter}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailNotifications: {
                      ...settings.emailNotifications,
                      newsletter: e.target.checked
                    }
                  })}
                  className="rounded border-slate-300"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">{t.privacy}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.showProfile}</p>
                <p className="text-xs text-slate-500">{t.showProfileDesc}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.privacy.showProfile}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      showProfile: e.target.checked
                    }
                  })}
                  className="rounded border-slate-300"
                />
              </label>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{t.dataCollection}</p>
                <p className="text-xs text-slate-500">{t.dataCollectionDesc}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.privacy.dataCollection}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      dataCollection: e.target.checked
                    }
                  })}
                  className="rounded border-slate-300"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">{t.language}</h2>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">{t.preferredLanguage}</p>
            <p className="text-xs text-slate-500 mb-4">{t.languageDesc}</p>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? t.saving : saved ? t.saved : t.save}
        </button>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-red-900">{t.dangerZone}</h2>
          </div>

          <div>
            <p className="text-sm font-medium text-red-900 mb-1">{t.deleteAccount}</p>
            <p className="text-xs text-red-700 mb-4">{t.deleteAccountDesc}</p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              <Trash2 className="h-4 w-4" />
              {t.deleteButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}