"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Image,
  Link as LinkIcon,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";

type Promotion = {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  type: string;
  bannerImageUrl: string;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  priority: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
};

const dict = {
  en: {
    title: "Promotions",
    subtitle: "Create and manage promotion banners for your storefront",
    add: "Create Promotion",
    noItems: "No promotions yet",
    noItemsHint: "Create promotional banners to attract customers to your store.",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    active: "Active",
    inactive: "Inactive",
    toggle: "Toggle status",
    preview: "Preview",
    bannerTitle: "Banner Title",
    description: "Description",
    type: "Type",
    banner: "Banner",
    discount: "Discount",
    bannerImage: "Banner Image URL",
    backgroundColor: "Background Color",
    textColor: "Text Color",
    linkUrl: "Link URL (optional)",
    priority: "Priority",
    validFrom: "Valid From",
    validUntil: "Valid Until",
    validFromHint: "When this promotion becomes active",
    validUntilHint: "When this promotion expires (leave empty for no expiry)",
    priorityHint: "Higher numbers appear first (0-100)",
    linkHint: "Where to redirect when banner is clicked",
    promotionCreated: "Promotion created!",
    promotionUpdated: "Promotion updated!",
    promotionDeleted: "Promotion deleted!",
    confirmDelete: "Are you sure you want to delete this promotion?",
  },
  pt: {
    title: "Promoções",
    subtitle: "Crie e gerencie banners promocionais para sua loja",
    add: "Criar Promoção",
    noItems: "Nenhuma promoção ainda",
    noItemsHint: "Crie banners promocionais para atrair clientes à sua loja.",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    active: "Ativo",
    inactive: "Inativo",
    toggle: "Alternar status",
    preview: "Pré-visualizar",
    bannerTitle: "Título do Banner",
    description: "Descrição",
    type: "Tipo",
    banner: "Banner",
    discount: "Desconto",
    bannerImage: "URL da Imagem do Banner",
    backgroundColor: "Cor de Fundo",
    textColor: "Cor do Texto",
    linkUrl: "URL do Link (opcional)",
    priority: "Prioridade",
    validFrom: "Válido A Partir De",
    validUntil: "Válido Até",
    validFromHint: "Quando esta promoção fica ativa",
    validUntilHint: "Quando esta promoção expira (deixe vazio para sem expiração)",
    priorityHint: "Números mais altos aparecem primeiro (0-100)",
    linkHint: "Para onde redirecionar quando o banner for clicado",
    promotionCreated: "Promoção criada!",
    promotionUpdated: "Promoção atualizada!",
    promotionDeleted: "Promoção eliminada!",
    confirmDelete: "Tem certeza que quer eliminar esta promoção?",
  },
};

type FormState = {
  title: string;
  description: string;
  type: "banner" | "discount";
  bannerImageUrl: string;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  priority: string;
  validFrom: string;
  validUntil: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  type: "banner",
  bannerImageUrl: "",
  backgroundColor: "#3b82f6",
  textColor: "#ffffff",
  linkUrl: "",
  priority: "0",
  validFrom: "",
  validUntil: "",
};

export default function PromotionsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [previewMode, setPreviewMode] = useState(false);

  const loadPromotions = async () => {
    try {
      const res = await fetch("/api/promotions", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPromotions(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadPromotions(); }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setPreviewMode(false);
    setShowForm(true);
  };

  const startEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setForm({
      title: promotion.title,
      description: promotion.description,
      type: promotion.type as "banner" | "discount",
      bannerImageUrl: promotion.bannerImageUrl,
      backgroundColor: promotion.backgroundColor,
      textColor: promotion.textColor,
      linkUrl: promotion.linkUrl,
      priority: String(promotion.priority),
      validFrom: promotion.validFrom ? new Date(promotion.validFrom).toISOString().slice(0, 16) : "",
      validUntil: promotion.validUntil ? new Date(promotion.validUntil).toISOString().slice(0, 16) : "",
    });
    setPreviewMode(false);
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      bannerImageUrl: form.bannerImageUrl,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      linkUrl: form.linkUrl,
      priority: Number(form.priority) || 0,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/promotions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPromotions((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        }
      } else {
        const res = await fetch("/api/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPromotions((prev) => [created, ...prev]);
        }
      }
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
    } catch {}
  };

  const toggleActive = async (promotion: Promotion) => {
    const res = await fetch(`/api/promotions/${promotion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !promotion.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPromotions((prev) => prev.map((p) => (p.id === promotion.id ? updated : p)));
    }
  };

  const deletePromotion = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/promotions/${id}`, { method: "DELETE", credentials: "include" });
    setPromotions((prev) => prev.filter((p) => p.id !== id));
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

      {/* Promotions list */}
      {promotions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noItems}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noItemsHint}</p>
          <button onClick={startCreate} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promotion) => {
            const isExpired = promotion.validUntil && new Date(promotion.validUntil) < new Date();
            return (
              <div key={promotion.id} className={`rounded-xl border bg-white p-4 transition ${!promotion.active || isExpired ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{promotion.title}</span>
                        {!promotion.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{t.inactive}</span>}
                        {isExpired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">Expired</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {promotion.description}
                        {promotion.priority > 0 && <> · Priority: {promotion.priority}</>}
                        {promotion.validUntil && <> · Expires: {new Date(promotion.validUntil).toLocaleDateString()}</>}
                      </p>
                      {/* Preview Banner */}
                      <div className="mt-2 inline-flex max-w-xs">
                        <div 
                          className="rounded-lg px-3 py-2 text-xs font-semibold truncate"
                          style={{ 
                            backgroundColor: promotion.backgroundColor,
                            color: promotion.textColor
                          }}
                        >
                          {promotion.title}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(promotion)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.toggle}>
                      {promotion.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                    </button>
                    <button onClick={() => startEdit(promotion)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.edit}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deletePromotion(promotion.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={t.delete}>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{editingId ? t.edit : t.add}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  title={t.preview}
                >
                  {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {previewMode && (
              <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-500 mb-2">Preview:</p>
                <div 
                  className="rounded-lg p-4 text-center font-semibold"
                  style={{ 
                    backgroundColor: form.backgroundColor,
                    color: form.textColor
                  }}
                >
                  {form.title || "Your promotion title"}
                  {form.description && (
                    <p className="mt-1 text-sm opacity-90">{form.description}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.bannerTitle}</label>
                <input 
                  value={form.title} 
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} 
                  placeholder="Flash Sale - 50% Off!" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Limited time offer on all products"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.type}</label>
                <select 
                  value={form.type} 
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "banner" | "discount" }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                >
                  <option value="banner">{t.banner}</option>
                  <option value="discount">{t.discount}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.priority}</label>
                <input 
                  type="number" 
                  min={0} 
                  max={100}
                  value={form.priority} 
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
                <p className="text-xs text-slate-500 mt-1">{t.priorityHint}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.backgroundColor}</label>
                <input 
                  type="color" 
                  value={form.backgroundColor} 
                  onChange={(e) => setForm((p) => ({ ...p, backgroundColor: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-2" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.textColor}</label>
                <input 
                  type="color" 
                  value={form.textColor} 
                  onChange={(e) => setForm((p) => ({ ...p, textColor: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-2" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.bannerImage}</label>
                <input 
                  value={form.bannerImageUrl} 
                  onChange={(e) => setForm((p) => ({ ...p, bannerImageUrl: e.target.value }))} 
                  placeholder="https://example.com/banner.jpg (optional)" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.linkUrl}</label>
                <input 
                  value={form.linkUrl} 
                  onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))} 
                  placeholder="https://example.com/sale (optional)" 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
                <p className="text-xs text-slate-500 mt-1">{t.linkHint}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.validFrom}</label>
                <input 
                  type="datetime-local" 
                  value={form.validFrom} 
                  onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">{t.validUntil}</label>
                <input 
                  type="datetime-local" 
                  value={form.validUntil} 
                  onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} 
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" 
                />
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