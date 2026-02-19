"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import {
  ArrowLeft, Clock, Plus, Bell, BellOff, Pause, Play, 
  Edit, Trash2, Package, AlertTriangle, CheckCircle,
  RefreshCw, Search, Filter, Calendar, Mail, Phone,
  Building, TrendingDown
} from "lucide-react";

type RestockReminder = {
  id: number;
  sellerId: number;
  productId?: number;
  variantId?: number;
  warehouseId?: number;
  triggerQuantity: number;
  targetQuantity: number;
  leadTimeDays: number;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  lastOrderDate?: Date;
  averageLeadTime: number;
  status: 'active' | 'snoozed' | 'disabled';
  lastTriggered?: Date;
  snoozeUntil?: Date;
  emailNotifications: boolean;
  autoReorderEnabled: boolean;
  minOrderQuantity: number;
  productName?: string;
  variantName?: string;
  currentStock?: number;
};

type ReminderFormData = {
  productId?: number;
  variantId?: number;
  triggerQuantity: number;
  targetQuantity: number;
  leadTimeDays: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  minOrderQuantity: number;
  emailNotifications: boolean;
};

const dict = {
  en: {
    title: "Restock Reminders",
    subtitle: "Manage automatic restock alerts and supplier information",
    backToInventory: "Back to Inventory",
    createReminder: "Create Reminder",
    activeReminders: "Active",
    snoozedReminders: "Snoozed",
    disabledReminders: "Disabled",
    allReminders: "All",
    searchPlaceholder: "Search by product name or supplier...",
    noReminders: "No restock reminders set up",
    noRemindersDesc: "Create reminders to get notified when products need restocking",
    loading: "Loading reminders...",
    error: "Error loading reminders",
    productName: "Product",
    currentStock: "Current Stock",
    triggerPoint: "Trigger Point",
    targetQuantity: "Target Quantity",
    leadTime: "Lead Time",
    supplier: "Supplier",
    lastTriggered: "Last Triggered",
    status: "Status",
    actions: "Actions",
    days: "days",
    items: "items",
    edit: "Edit",
    delete: "Delete",
    snooze: "Snooze",
    activate: "Activate",
    disable: "Disable",
    active: "Active",
    snoozed: "Snoozed",
    disabled: "Disabled",
    emailEnabled: "Email alerts enabled",
    emailDisabled: "Email alerts disabled",
    urgentStock: "Urgent - very low stock",
    lowStock: "Low stock",
    needsRestock: "Needs restock",
    goodStock: "Good stock level",
    // Form fields
    selectProduct: "Select Product",
    triggerQuantityLabel: "Trigger Quantity",
    triggerQuantityHelp: "Stock level that triggers the reminder",
    targetQuantityLabel: "Target Quantity",
    targetQuantityHelp: "Suggested reorder quantity",
    leadTimeLabel: "Lead Time (days)",
    leadTimeHelp: "Days between order and delivery",
    supplierNameLabel: "Supplier Name",
    supplierEmailLabel: "Supplier Email",
    supplierPhoneLabel: "Supplier Phone",
    minOrderLabel: "Minimum Order Quantity",
    emailNotificationsLabel: "Email Notifications",
    emailNotificationsHelp: "Receive email alerts when stock is low",
    save: "Save Reminder",
    cancel: "Cancel",
    saving: "Saving...",
    confirmDelete: "Are you sure you want to delete this reminder?",
    reminderSaved: "Reminder saved successfully",
    reminderDeleted: "Reminder deleted successfully",
    reminderSnoozed: "Reminder snoozed for 24 hours",
  },
  pt: {
    title: "Lembretes de Reposição",
    subtitle: "Gerir alertas automáticos de reposição e informações de fornecedores",
    backToInventory: "Voltar ao Inventário",
    createReminder: "Criar Lembrete",
    activeReminders: "Ativos",
    snoozedReminders: "Adiados",
    disabledReminders: "Desativados",
    allReminders: "Todos",
    searchPlaceholder: "Pesquisar por nome do produto ou fornecedor...",
    noReminders: "Nenhum lembrete de reposição configurado",
    noRemindersDesc: "Crie lembretes para ser notificado quando os produtos precisarem de reposição",
    loading: "A carregar lembretes...",
    error: "Erro ao carregar lembretes",
    productName: "Produto",
    currentStock: "Stock Atual",
    triggerPoint: "Ponto de Ativação",
    targetQuantity: "Quantidade Alvo",
    leadTime: "Tempo de Entrega",
    supplier: "Fornecedor",
    lastTriggered: "Último Ativado",
    status: "Estado",
    actions: "Ações",
    days: "dias",
    items: "itens",
    edit: "Editar",
    delete: "Eliminar",
    snooze: "Adiar",
    activate: "Ativar",
    disable: "Desativar",
    active: "Ativo",
    snoozed: "Adiado",
    disabled: "Desativado",
    emailEnabled: "Alertas por email ativados",
    emailDisabled: "Alertas por email desativados",
    urgentStock: "Urgente - stock muito baixo",
    lowStock: "Stock baixo",
    needsRestock: "Precisa de reposição",
    goodStock: "Nível de stock bom",
    // Form fields
    selectProduct: "Selecionar Produto",
    triggerQuantityLabel: "Quantidade de Ativação",
    triggerQuantityHelp: "Nível de stock que ativa o lembrete",
    targetQuantityLabel: "Quantidade Alvo",
    targetQuantityHelp: "Quantidade sugerida para reposição",
    leadTimeLabel: "Tempo de Entrega (dias)",
    leadTimeHelp: "Dias entre o pedido e a entrega",
    supplierNameLabel: "Nome do Fornecedor",
    supplierEmailLabel: "Email do Fornecedor",
    supplierPhoneLabel: "Telefone do Fornecedor",
    minOrderLabel: "Quantidade Mínima de Pedido",
    emailNotificationsLabel: "Notificações por Email",
    emailNotificationsHelp: "Receber alertas por email quando o stock estiver baixo",
    save: "Guardar Lembrete",
    cancel: "Cancelar",
    saving: "A guardar...",
    confirmDelete: "Tem a certeza que quer eliminar este lembrete?",
    reminderSaved: "Lembrete guardado com sucesso",
    reminderDeleted: "Lembrete eliminado com sucesso",
    reminderSnoozed: "Lembrete adiado por 24 horas",
  },
};

// Reminder form modal
function ReminderFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReminderFormData) => Promise<void>;
  initialData?: Partial<ReminderFormData>;
  loading: boolean;
}) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const [formData, setFormData] = useState<ReminderFormData>({
    triggerQuantity: 5,
    targetQuantity: 50,
    leadTimeDays: 7,
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    minOrderQuantity: 1,
    emailNotifications: true,
    ...initialData,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">{t.createReminder}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.triggerQuantityLabel}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.triggerQuantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    triggerQuantity: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">{t.triggerQuantityHelp}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.targetQuantityLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    targetQuantity: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">{t.targetQuantityHelp}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.leadTimeLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    leadTimeDays: parseInt(e.target.value) || 7 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">{t.leadTimeHelp}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.minOrderLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minOrderQuantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    minOrderQuantity: parseInt(e.target.value) || 1 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t.supplierNameLabel}
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  supplierName: e.target.value 
                }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Enter supplier name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.supplierEmailLabel}
                </label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    supplierEmail: e.target.value 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="supplier@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.supplierPhoneLabel}
                </label>
                <input
                  type="tel"
                  value={formData.supplierPhone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    supplierPhone: e.target.value 
                  }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="+258 XX XXX XXXX"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emailNotifications: e.target.checked 
                  }))}
                  className="rounded border-slate-300"
                />
                <span className="text-sm font-medium">{t.emailNotificationsLabel}</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 ml-6">{t.emailNotificationsHelp}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                disabled={loading}
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? t.saving : t.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RestockRemindersPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();
  const searchParams = useSearchParams();

  const [reminders, setReminders] = useState<RestockReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RestockReminder | null>(null);

  // Check if we should auto-open the create form
  useEffect(() => {
    if (searchParams?.get("create") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJsonWithRetry<RestockReminder[]>(
        "/api/inventory/restock-reminders",
        undefined,
        2,
        "inventory:restock-reminders"
      );
      setReminders(data);
    } catch (error) {
      console.error("Error loading restock reminders:", error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error, toast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Filter reminders
  const filteredReminders = reminders.filter((reminder) => {
    // Status filter
    if (statusFilter !== "all" && reminder.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      return (
        (reminder.productName && reminder.productName.toLowerCase().includes(searchLower)) ||
        (reminder.variantName && reminder.variantName.toLowerCase().includes(searchLower)) ||
        (reminder.supplierName && reminder.supplierName.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Status counts
  const statusCounts = {
    all: reminders.length,
    active: reminders.filter(r => r.status === 'active').length,
    snoozed: reminders.filter(r => r.status === 'snoozed').length,
    disabled: reminders.filter(r => r.status === 'disabled').length,
  };

  const handleSaveReminder = async (formData: ReminderFormData) => {
    setFormLoading(true);
    try {
      const method = editingReminder ? "PUT" : "POST";
      const body = editingReminder 
        ? { ...formData, id: editingReminder.id }
        : formData;

      await fetchJsonWithRetry(
        "/api/inventory/restock-reminders",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        2,
        "inventory:save-reminder"
      );

      toast.success(t.reminderSaved);
      setShowForm(false);
      setEditingReminder(null);
      await loadReminders();
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast.error("Failed to save reminder");
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleSnoozeReminder = async (reminderId: number) => {
    try {
      await fetchJsonWithRetry(
        "/api/inventory/restock-reminders",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "snooze", reminderId }),
        },
        2,
        "inventory:snooze-reminder"
      );

      toast.success(t.reminderSnoozed);
      await loadReminders();
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast.error("Failed to snooze reminder");
    }
  };

  const getStockStatus = (reminder: RestockReminder) => {
    const stock = reminder.currentStock || 0;
    if (stock === 0) return { label: t.urgentStock, color: 'text-red-600', bgColor: 'bg-red-100' };
    if (stock <= Math.floor(reminder.triggerQuantity * 0.5)) return { label: t.urgentStock, color: 'text-red-600', bgColor: 'bg-red-100' };
    if (stock <= reminder.triggerQuantity) return { label: t.needsRestock, color: 'text-amber-600', bgColor: 'bg-amber-100' };
    return { label: t.goodStock, color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToInventory}
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadReminders}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setEditingReminder(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {t.createReminder}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              ['all', t.allReminders, statusCounts.all],
              ['active', t.activeReminders, statusCounts.active],
              ['snoozed', t.snoozedReminders, statusCounts.snoozed],
              ['disabled', t.disabledReminders, statusCounts.disabled],
            ].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === key
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  statusFilter === key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reminders List */}
        <div className="bg-white rounded-xl border border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
              </div>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.noReminders}</h3>
              <p className="mt-2 text-sm text-slate-500">{t.noRemindersDesc}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                {t.createReminder}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReminders.map((reminder) => {
                const stockStatus = getStockStatus(reminder);
                
                return (
                  <div key={reminder.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {reminder.productName}
                            {reminder.variantName && (
                              <span className="text-sm font-normal text-slate-500 ml-2">
                                • {reminder.variantName}
                              </span>
                            )}
                          </h3>
                          
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            reminder.status === 'active' ? 'bg-green-100 text-green-700' :
                            reminder.status === 'snoozed' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {reminder.status === 'active' ? <CheckCircle className="h-3 w-3" /> :
                             reminder.status === 'snoozed' ? <Pause className="h-3 w-3" /> :
                             <BellOff className="h-3 w-3" />}
                            {reminder.status === 'active' ? t.active :
                             reminder.status === 'snoozed' ? t.snoozed :
                             t.disabled}
                          </span>

                          {/* Stock status */}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} ${stockStatus.bgColor}`}>
                            <TrendingDown className="h-3 w-3" />
                            {stockStatus.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">{t.currentStock}</p>
                            <p className="font-medium">{reminder.currentStock || 0} {t.items}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t.triggerPoint}</p>
                            <p className="font-medium">{reminder.triggerQuantity} {t.items}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t.targetQuantity}</p>
                            <p className="font-medium">{reminder.targetQuantity} {t.items}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t.leadTime}</p>
                            <p className="font-medium">{reminder.leadTimeDays} {t.days}</p>
                          </div>
                        </div>

                        {reminder.supplierName && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm font-medium text-slate-900 mb-1">
                              <Building className="h-4 w-4 inline mr-1" />
                              {reminder.supplierName}
                            </p>
                            <div className="flex gap-4 text-xs text-slate-500">
                              {reminder.supplierEmail && (
                                <span>
                                  <Mail className="h-3 w-3 inline mr-1" />
                                  {reminder.supplierEmail}
                                </span>
                              )}
                              {reminder.supplierPhone && (
                                <span>
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {reminder.supplierPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {reminder.status === 'active' && (
                          <button
                            onClick={() => handleSnoozeReminder(reminder.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title={t.snooze}
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setEditingReminder(reminder);
                            setShowForm(true);
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                          title={t.edit}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (confirm(t.confirmDelete)) {
                              // Delete reminder logic would go here
                              toast.success(t.reminderDeleted);
                              await loadReminders();
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title={t.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reminder Form Modal */}
      <ReminderFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        initialData={editingReminder ? {
          productId: editingReminder.productId,
          variantId: editingReminder.variantId,
          triggerQuantity: editingReminder.triggerQuantity,
          targetQuantity: editingReminder.targetQuantity,
          leadTimeDays: editingReminder.leadTimeDays,
          supplierName: editingReminder.supplierName || '',
          supplierEmail: editingReminder.supplierEmail || '',
          supplierPhone: editingReminder.supplierPhone || '',
          minOrderQuantity: editingReminder.minOrderQuantity,
          emailNotifications: editingReminder.emailNotifications,
        } : undefined}
        loading={formLoading}
      />
    </>
  );
}