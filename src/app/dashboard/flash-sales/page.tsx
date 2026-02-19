"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Clock,
  Percent,
  DollarSign,
  Users,
  Target
} from "lucide-react";

type FlashSale = {
  id: number;
  sellerId: number;
  name: string;
  description: string;
  discountType: string;
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  maxUses: number;
  usedCount: number;
  startTime: string;
  endTime: string;
  products: string;
  bannerText: string;
  bannerColor: string;
  showCountdown: boolean;
  active: boolean;
  createdAt: string;
};

const dict = {
  en: {
    title: "Flash Sales",
    subtitle: "Create time-limited sales with countdown timers",
    add: "Create Flash Sale",
    noItems: "No flash sales yet",
    noItemsHint: "Create flash sales to drive urgency and boost sales.",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    active: "Active",
    inactive: "Inactive",
    toggle: "Toggle status",
    name: "Sale Name",
    description: "Description",
    discountType: "Discount Type",
    percentage: "Percentage",
    fixed: "Fixed Amount",
    discountValue: "Discount Value",
    maxDiscount: "Max Discount (for %)",
    minOrderAmount: "Minimum Order",
    maxUses: "Usage Limit",
    startTime: "Start Time",
    endTime: "End Time",
    products: "Products (optional)",
    bannerText: "Banner Text",
    bannerColor: "Banner Color",
    showCountdown: "Show Countdown",
    unlimited: "Unlimited",
    expired: "Expired",
    upcoming: "Upcoming",
    running: "Running",
    uses: "uses",
    allProducts: "All products",
    specificProducts: "Specific products",
    productsHint: "Leave empty for all products, or enter product IDs separated by commas",
    bannerTextHint: "Text shown on storefront banner (auto-generated if empty)",
    flashSaleCreated: "Flash sale created!",
    flashSaleUpdated: "Flash sale updated!",
    flashSaleDeleted: "Flash sale deleted!",
    confirmDelete: "Are you sure you want to delete this flash sale?",
    endsIn: "Ends in",
    startsIn: "Starts in",
    ended: "Ended",
  },
  pt: {
    title: "Vendas Relâmpago",
    subtitle: "Crie vendas com tempo limitado e contadores regressivos",
    add: "Criar Venda Relâmpago",
    noItems: "Nenhuma venda relâmpago ainda",
    noItemsHint: "Crie vendas relâmpago para criar urgência e aumentar vendas.",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    active: "Ativo",
    inactive: "Inativo",
    toggle: "Alternar status",
    name: "Nome da Venda",
    description: "Descrição",
    discountType: "Tipo de Desconto",
    percentage: "Percentagem",
    fixed: "Valor Fixo",
    discountValue: "Valor do Desconto",
    maxDiscount: "Desconto Máximo (para %)",
    minOrderAmount: "Pedido Mínimo",
    maxUses: "Limite de Uso",
    startTime: "Hora de Início",
    endTime: "Hora de Fim",
    products: "Produtos (opcional)",
    bannerText: "Texto do Banner",
    bannerColor: "Cor do Banner",
    showCountdown: "Mostrar Contagem Regressiva",
    unlimited: "Ilimitado",
    expired: "Expirado",
    upcoming: "Em Breve",
    running: "Em Execução",
    uses: "usos",
    allProducts: "Todos os produtos",
    specificProducts: "Produtos específicos",
    productsHint: "Deixe vazio para todos os produtos, ou digite IDs dos produtos separados por vírgulas",
    bannerTextHint: "Texto mostrado no banner da loja (gerado automaticamente se vazio)",
    flashSaleCreated: "Venda relâmpago criada!",
    flashSaleUpdated: "Venda relâmpago atualizada!",
    flashSaleDeleted: "Venda relâmpago eliminada!",
    confirmDelete: "Tem certeza que quer eliminar esta venda relâmpago?",
    endsIn: "Termina em",
    startsIn: "Começa em",
    ended: "Terminado",
  },
};

type FormState = {
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  maxUses: string;
  startTime: string;
  endTime: string;
  products: string;
  bannerText: string;
  bannerColor: string;
  showCountdown: boolean;
};

const initialForm: FormState = {
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: "",
  maxUses: "",
  startTime: "",
  endTime: "",
  products: "",
  bannerText: "",
  bannerColor: "#ef4444",
  showCountdown: true,
};

function getTimeRemaining(targetTime: string) {
  const now = new Date().getTime();
  const target = new Date(targetTime).getTime();
  const difference = target - now;
  
  if (difference <= 0) return null;
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getSaleStatus(sale: FlashSale) {
  const now = new Date();
  const start = new Date(sale.startTime);
  const end = new Date(sale.endTime);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'running';
}

export default function FlashSalesPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const loadFlashSales = async () => {
    try {
      const res = await fetch("/api/flash-sales", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFlashSales(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadFlashSales(); }, []);

  // Update countdown timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashSales(prev => [...prev]); // trigger re-render
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const startEdit = (sale: FlashSale) => {
    setEditingId(sale.id);
    setForm({
      name: sale.name,
      description: sale.description,
      discountType: sale.discountType as "percentage" | "fixed",
      discountValue: sale.discountValue,
      maxDiscount: sale.maxDiscount,
      minOrderAmount: sale.minOrderAmount,
      maxUses: sale.maxUses === -1 ? "" : String(sale.maxUses),
      startTime: new Date(sale.startTime).toISOString().slice(0, 16),
      endTime: new Date(sale.endTime).toISOString().slice(0, 16),
      products: sale.products,
      bannerText: sale.bannerText,
      bannerColor: sale.bannerColor,
      showCountdown: sale.showCountdown,
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.discountValue || !form.startTime || !form.endTime) return;

    const payload = {
      name: form.name,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: Number(form.maxDiscount) || 0,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxUses: form.maxUses ? Number(form.maxUses) : -1,
      startTime: form.startTime,
      endTime: form.endTime,
      products: form.products,
      bannerText: form.bannerText,
      bannerColor: form.bannerColor,
      showCountdown: form.showCountdown,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/flash-sales/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setFlashSales((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        }
      } else {
        const res = await fetch("/api/flash-sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setFlashSales((prev) => [created, ...prev]);
        }
      }
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
    } catch {}
  };

  const toggleActive = async (sale: FlashSale) => {
    const res = await fetch(`/api/flash-sales/${sale.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !sale.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlashSales((prev) => prev.map((s) => (s.id === sale.id ? updated : s)));
    }
  };

  const deleteFlashSale = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/flash-sales/${id}`, { method: "DELETE", credentials: "include" });
    setFlashSales((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return null;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <button onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> {t.add}
        </button>
      </div>

      {/* Flash sales list */}
      {flashSales.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Zap className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noItems}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noItemsHint}</p>
          <button onClick={startCreate} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flashSales.map((sale) => {
            const status = getSaleStatus(sale);
            const timeRemaining = status === 'running' ? getTimeRemaining(sale.endTime) : 
                                status === 'upcoming' ? getTimeRemaining(sale.startTime) : null;
            
            return (
              <div key={sale.id} className={`rounded-xl border bg-white p-4 transition ${!sale.active || status === 'expired' ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed ${
                      status === 'running' ? 'border-red-300 bg-red-50' : 
                      status === 'upcoming' ? 'border-orange-300 bg-orange-50' : 
                      'border-slate-300 bg-slate-50'
                    }`}>
                      <Zap className={`h-4 w-4 ${
                        status === 'running' ? 'text-red-600' : 
                        status === 'upcoming' ? 'text-orange-600' : 
                        'text-slate-400'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{sale.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          status === 'running' ? 'bg-red-100 text-red-600' : 
                          status === 'upcoming' ? 'bg-orange-100 text-orange-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {status === 'running' ? t.running : status === 'upcoming' ? t.upcoming : t.expired}
                        </span>
                        {!sale.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{t.inactive}</span>}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          {sale.discountType === 'percentage' ? (
                            <><Percent className="h-3 w-3" />{sale.discountValue}% off</>
                          ) : (
                            <><DollarSign className="h-3 w-3" />${sale.discountValue} off</>
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {sale.usedCount}/{sale.maxUses === -1 ? "∞" : sale.maxUses} {t.uses}
                        </span>
                        {timeRemaining && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="h-3 w-3" />
                              {status === 'running' ? t.endsIn : t.startsIn} {timeRemaining}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {sale.description}
                        {sale.products && <> • {sale.products.split(',').length} specific products</>}
                        {Number(sale.minOrderAmount) > 0 && <> • Min order: ${sale.minOrderAmount}</>}
                      </p>
                      
                      {/* Banner Preview */}
                      <div className="mt-2 inline-flex max-w-xs">
                        <div 
                          className="rounded-lg px-3 py-1.5 text-xs font-bold"
                          style={{ backgroundColor: sale.bannerColor, color: '#ffffff' }}
                        >
                          ⚡ {sale.bannerText || `${sale.discountType === 'percentage' ? sale.discountValue + '% OFF' : '$' + sale.discountValue + ' OFF'}!`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(sale)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.toggle}>
                      {sale.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                    </button>
                    <button onClick={() => startEdit(sale)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.edit}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteFlashSale(sale.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={t.delete}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/35 p-4" onClick={() => setShowForm(false)}>
          <div className="mx-auto mt-4 mb-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:mt-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{editingId ? t.edit : t.add}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.name}</label>
                <input 
                  value={form.name} 
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
                  placeholder="Weekend Flash Sale" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Limited time offer on selected items"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.discountType}</label>
                <select 
                  value={form.discountType} 
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "percentage" | "fixed" }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                >
                  <option value="percentage">{t.percentage}</option>
                  <option value="fixed">{t.fixed}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.discountValue}</label>
                <input 
                  type="number" 
                  min={0} 
                  step="0.01" 
                  value={form.discountValue} 
                  onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} 
                  placeholder={form.discountType === "percentage" ? "20" : "10.00"} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              {form.discountType === "percentage" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">{t.maxDiscount}</label>
                  <input 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    value={form.maxDiscount} 
                    onChange={(e) => setForm((p) => ({ ...p, maxDiscount: e.target.value }))} 
                    placeholder="50.00" 
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">{t.minOrderAmount}</label>
                <input 
                  type="number" 
                  min={0} 
                  step="0.01" 
                  value={form.minOrderAmount} 
                  onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} 
                  placeholder="0" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.maxUses}</label>
                <input 
                  type="number" 
                  min={0} 
                  value={form.maxUses} 
                  onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} 
                  placeholder={t.unlimited} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.startTime}</label>
                <input 
                  type="datetime-local" 
                  value={form.startTime} 
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.endTime}</label>
                <input 
                  type="datetime-local" 
                  value={form.endTime} 
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.products}</label>
                <input 
                  value={form.products} 
                  onChange={(e) => setForm((p) => ({ ...p, products: e.target.value }))} 
                  placeholder="1,5,12 (leave empty for all products)" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
                <p className="text-xs text-slate-500 mt-1">{t.productsHint}</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.bannerText}</label>
                <input 
                  value={form.bannerText} 
                  onChange={(e) => setForm((p) => ({ ...p, bannerText: e.target.value }))} 
                  placeholder="⚡ Flash Sale: 20% OFF Everything!" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
                <p className="text-xs text-slate-500 mt-1">{t.bannerTextHint}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.bannerColor}</label>
                <input 
                  type="color" 
                  value={form.bannerColor} 
                  onChange={(e) => setForm((p) => ({ ...p, bannerColor: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-2" 
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showCountdown"
                  checked={form.showCountdown} 
                  onChange={(e) => setForm((p) => ({ ...p, showCountdown: e.target.checked }))} 
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500" 
                />
                <label htmlFor="showCountdown" className="text-sm font-medium text-slate-700">{t.showCountdown}</label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700">{t.cancel}</button>
              <button onClick={submitForm} className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}