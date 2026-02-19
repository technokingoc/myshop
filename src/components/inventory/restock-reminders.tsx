"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Bell, 
  Plus, 
  Search, 
  Clock, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Edit,
  Trash2,
  MoreHorizontal,
  BellOff,
  Settings,
} from "lucide-react";

type RestockReminder = {
  id: number;
  productName: string;
  variantName?: string;
  currentStock: number;
  triggerQuantity: number;
  targetQuantity: number;
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  status: 'active' | 'snoozed' | 'disabled';
  lastTriggered?: string;
  snoozeUntil?: string;
  leadTimeDays: number;
  minOrderQuantity: number;
  emailNotifications: boolean;
};

type NewReminderData = {
  productId?: number;
  variantId?: number;
  triggerQuantity: number;
  targetQuantity: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  leadTimeDays: number;
  minOrderQuantity: number;
  emailNotifications: boolean;
};

const dict = {
  en: {
    title: "Restock Reminders",
    description: "Set up automated reminders when stock runs low",
    createReminder: "Create Reminder",
    searchPlaceholder: "Search reminders...",
    allStatuses: "All Statuses",
    active: "Active",
    snoozed: "Snoozed",
    disabled: "Disabled",
    product: "Product",
    variant: "Variant",
    currentStock: "Current Stock",
    trigger: "Trigger At",
    target: "Target Qty",
    supplier: "Supplier",
    status: "Status",
    lastTriggered: "Last Triggered",
    actions: "Actions",
    noRemindersFound: "No restock reminders found",
    loadingReminders: "Loading reminders...",
    edit: "Edit",
    delete: "Delete",
    snooze: "Snooze",
    enable: "Enable",
    disable: "Disable",
    confirmDelete: "Are you sure you want to delete this reminder?",
    reminderDeleted: "Reminder deleted successfully",
    reminderSnoozed: "Reminder snoozed for 24 hours",
    reminderEnabled: "Reminder enabled",
    reminderDisabled: "Reminder disabled",
    newReminder: "New Restock Reminder",
    editReminder: "Edit Restock Reminder",
    selectProduct: "Select Product",
    triggerQuantity: "Trigger Quantity",
    targetQuantity: "Target Quantity",
    leadTime: "Lead Time (days)",
    minOrder: "Min Order Quantity",
    supplierInfo: "Supplier Information",
    supplierName: "Supplier Name",
    supplierEmail: "Supplier Email",
    supplierPhone: "Supplier Phone",
    emailNotifications: "Email Notifications",
    cancel: "Cancel",
    save: "Save Reminder",
    creating: "Creating...",
    updating: "Updating...",
    required: "Required",
    optional: "Optional",
    never: "Never",
    justNow: "Just now",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
    weeksAgo: "weeks ago",
    snoozeFor: "Snooze for",
    hours: "hours",
    reminders: "reminders",
  },
  pt: {
    title: "Lembretes de Reposição",
    description: "Configure lembretes automáticos quando o estoque estiver baixo",
    createReminder: "Criar Lembrete",
    searchPlaceholder: "Pesquisar lembretes...",
    allStatuses: "Todos os Status",
    active: "Ativo",
    snoozed: "Adiado",
    disabled: "Desabilitado",
    product: "Produto",
    variant: "Variante",
    currentStock: "Estoque Atual",
    trigger: "Acionar Em",
    target: "Qtd Alvo",
    supplier: "Fornecedor",
    status: "Status",
    lastTriggered: "Último Acionamento",
    actions: "Ações",
    noRemindersFound: "Nenhum lembrete de reposição encontrado",
    loadingReminders: "Carregando lembretes...",
    edit: "Editar",
    delete: "Excluir",
    snooze: "Adiar",
    enable: "Ativar",
    disable: "Desativar",
    confirmDelete: "Tem certeza de que deseja excluir este lembrete?",
    reminderDeleted: "Lembrete excluído com sucesso",
    reminderSnoozed: "Lembrete adiado por 24 horas",
    reminderEnabled: "Lembrete ativado",
    reminderDisabled: "Lembrete desativado",
    newReminder: "Novo Lembrete de Reposição",
    editReminder: "Editar Lembrete de Reposição",
    selectProduct: "Selecionar Produto",
    triggerQuantity: "Quantidade Gatilho",
    targetQuantity: "Quantidade Alvo",
    leadTime: "Prazo de Entrega (dias)",
    minOrder: "Quantidade Mínima de Pedido",
    supplierInfo: "Informações do Fornecedor",
    supplierName: "Nome do Fornecedor",
    supplierEmail: "Email do Fornecedor",
    supplierPhone: "Telefone do Fornecedor",
    emailNotifications: "Notificações por Email",
    cancel: "Cancelar",
    save: "Salvar Lembrete",
    creating: "Criando...",
    updating: "Atualizando...",
    required: "Obrigatório",
    optional: "Opcional",
    never: "Nunca",
    justNow: "Agora mesmo",
    hoursAgo: "horas atrás",
    daysAgo: "dias atrás",
    weeksAgo: "semanas atrás",
    snoozeFor: "Adiar por",
    hours: "horas",
    reminders: "lembretes",
  },
};

export function RestockReminders() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [reminders, setReminders] = useState<RestockReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RestockReminder | null>(null);
  const [formData, setFormData] = useState<NewReminderData>({
    triggerQuantity: 5,
    targetQuantity: 50,
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    leadTimeDays: 7,
    minOrderQuantity: 1,
    emailNotifications: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/restock-reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Failed to load restock reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffHours < 1) return t.justNow;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;
    return `${diffWeeks} ${t.weeksAgo}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'snoozed':
        return Clock;
      case 'disabled':
        return XCircle;
      default:
        return Bell;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'snoozed':
        return 'text-orange-600 bg-orange-50';
      case 'disabled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const handleSnooze = async (id: number, hours = 24) => {
    try {
      const response = await fetch('/api/inventory/restock-reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snooze', reminderId: id, hours }),
      });

      if (response.ok) {
        await loadReminders();
        // Show success message
      }
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      // Delete API call would go here
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/inventory/restock-reminders', {
        method: editingReminder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReminder ? { ...formData, id: editingReminder.id } : formData),
      });

      if (response.ok) {
        await loadReminders();
        setShowForm(false);
        setEditingReminder(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save reminder:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      triggerQuantity: 5,
      targetQuantity: 50,
      supplierName: "",
      supplierEmail: "",
      supplierPhone: "",
      leadTimeDays: 7,
      minOrderQuantity: 1,
      emailNotifications: true,
    });
  };

  const openEditForm = (reminder: RestockReminder) => {
    setFormData({
      productId: undefined, // Would need to be set based on reminder
      variantId: undefined,
      triggerQuantity: reminder.triggerQuantity,
      targetQuantity: reminder.targetQuantity,
      supplierName: reminder.supplierName || "",
      supplierEmail: reminder.supplierEmail || "",
      supplierPhone: reminder.supplierPhone || "",
      leadTimeDays: reminder.leadTimeDays,
      minOrderQuantity: reminder.minOrderQuantity,
      emailNotifications: reminder.emailNotifications,
    });
    setEditingReminder(reminder);
    setShowForm(true);
  };

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = !searchTerm || 
      reminder.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reminder.variantName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reminder.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || reminder.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const ReminderForm = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingReminder ? t.editReminder : t.newReminder}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Selection - TODO: Add product picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.selectProduct} *
            </label>
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm text-slate-600">Product selection will be implemented here</p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.triggerQuantity} *
              </label>
              <input
                type="number"
                min="0"
                value={formData.triggerQuantity}
                onChange={(e) => setFormData({ ...formData, triggerQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.targetQuantity} *
              </label>
              <input
                type="number"
                min="1"
                value={formData.targetQuantity}
                onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Lead Time & Min Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.leadTime}
              </label>
              <input
                type="number"
                min="0"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.minOrder}
              </label>
              <input
                type="number"
                min="1"
                value={formData.minOrderQuantity}
                onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-700">{t.supplierInfo}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.supplierName}
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Supplier name..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.supplierEmail}
                </label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.supplierPhone}
                </label>
                <input
                  type="tel"
                  value={formData.supplierPhone}
                  onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="emailNotifications" className="text-sm font-medium text-slate-700">
              {t.emailNotifications}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingReminder(null);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (editingReminder ? t.updating : t.creating) : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
              <p className="text-slate-600 text-sm">{t.description}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t.createReminder}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="active">{t.active}</option>
              <option value="snoozed">{t.snoozed}</option>
              <option value="disabled">{t.disabled}</option>
            </select>
          </div>
        </div>

        {/* Reminders Table */}
        {loading ? (
          <div className="p-12 text-center">
            <Bell className="h-8 w-8 text-slate-300 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-500">{t.loadingReminders}</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{t.noRemindersFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.currentStock}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.trigger} / {t.target}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.supplier}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.lastTriggered}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReminders.map((reminder) => {
                  const StatusIcon = getStatusIcon(reminder.status);
                  
                  return (
                    <tr key={reminder.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{reminder.productName}</p>
                          {reminder.variantName && (
                            <p className="text-sm text-slate-500">{reminder.variantName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm font-medium ${
                          reminder.currentStock <= reminder.triggerQuantity 
                            ? 'text-red-600' 
                            : 'text-slate-900'
                        }`}>
                          {reminder.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            <span className="font-mono text-sm">{reminder.triggerQuantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-green-500" />
                            <span className="font-mono text-sm">{reminder.targetQuantity}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {reminder.supplierName ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900">{reminder.supplierName}</p>
                            {reminder.supplierEmail && (
                              <p className="text-xs text-slate-500">{reminder.supplierEmail}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(reminder.status)}`}>
                          <StatusIcon className="h-3 w-3" />
                          {reminder.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {reminder.lastTriggered ? formatRelativeTime(reminder.lastTriggered) : t.never}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(reminder)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {reminder.status === 'active' && (
                            <button
                              onClick={() => handleSnooze(reminder.id)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title={t.snooze}
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(reminder.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <ReminderForm />}
    </div>
  );
}