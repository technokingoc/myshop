"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { Tag, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Copy, Check, Percent, DollarSign, TicketPercent } from "lucide-react";

type Coupon = {
  id: number;
  sellerId: number;
  code: string;
  type: string;
  value: string;
  minOrderAmount: string;
  maxUses: number;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
};

const dict = {
  en: {
    title: "Coupons",
    subtitle: "Create and manage discount coupons for your store",
    add: "Create Coupon",
    noItems: "No coupons yet",
    noItemsHint: "Create your first coupon to offer discounts to customers.",
    code: "Code",
    type: "Type",
    value: "Value",
    minOrder: "Min. order",
    maxUses: "Max uses",
    uses: "Uses",
    validFrom: "Valid from",
    validUntil: "Valid until",
    active: "Active",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    percentage: "Percentage",
    fixed: "Fixed amount",
    unlimited: "Unlimited",
    expired: "Expired",
    generate: "Generate",
    copied: "Copied!",
    totalRedemptions: "Total Redemptions",
    activeCoupons: "Active Coupons",
    noExpiry: "No expiry",
    couponCreated: "Coupon created!",
    duplicateCode: "This code already exists",
  },
  pt: {
    title: "Cupons",
    subtitle: "Crie e gerencie cupons de desconto para sua loja",
    add: "Criar Cupom",
    noItems: "Nenhum cupom ainda",
    noItemsHint: "Crie seu primeiro cupom para oferecer descontos aos clientes.",
    code: "Código",
    type: "Tipo",
    value: "Valor",
    minOrder: "Pedido mín.",
    maxUses: "Usos máx.",
    uses: "Usos",
    validFrom: "Válido de",
    validUntil: "Válido até",
    active: "Ativo",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    percentage: "Percentagem",
    fixed: "Valor fixo",
    unlimited: "Ilimitado",
    expired: "Expirado",
    generate: "Gerar",
    copied: "Copiado!",
    totalRedemptions: "Total de Resgates",
    activeCoupons: "Cupons Ativos",
    noExpiry: "Sem expiração",
    couponCreated: "Cupom criado!",
    duplicateCode: "Este código já existe",
  },
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

type FormState = {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
};

const initialForm: FormState = {
  code: "",
  type: "percentage",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
};

export default function CouponsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadCoupons = async () => {
    try {
      const res = await fetch("/api/coupons", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadCoupons(); }, []);

  const stats = useMemo(() => {
    const totalRedemptions = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);
    const activeCoupons = coupons.filter((c) => c.active).length;
    return { totalRedemptions, activeCoupons };
  }, [coupons]);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type as "percentage" | "fixed",
      value: c.value,
      minOrderAmount: c.minOrderAmount || "",
      maxUses: c.maxUses === -1 ? "" : String(c.maxUses),
      validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 16) : "",
      validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 16) : "",
    });
    setError("");
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.code.trim() || !form.value) return;
    setError("");

    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxUses: form.maxUses ? Number(form.maxUses) : -1,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/coupons/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setCoupons((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        }
      } else {
        const res = await fetch("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (res.status === 409) {
          setError(t.duplicateCode);
          return;
        }
        if (res.ok) {
          const created = await res.json();
          setCoupons((prev) => [created, ...prev]);
        }
      }
      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
    } catch {}
  };

  const toggleActive = async (c: Coupon) => {
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !c.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    }
  };

  const deleteCoupon = async (id: number) => {
    await fetch(`/api/coupons/${id}`, { method: "DELETE", credentials: "include" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

      {/* Stats */}
      {coupons.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{t.activeCoupons}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.activeCoupons}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{t.totalRedemptions}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalRedemptions}</p>
          </div>
        </div>
      )}

      {/* Coupon list */}
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <TicketPercent className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.noItems}</p>
          <p className="mt-1 text-xs text-slate-400">{t.noItemsHint}</p>
          <button onClick={startCreate} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const isExpired = c.validUntil && new Date(c.validUntil) < new Date();
            return (
              <div key={c.id} className={`rounded-xl border bg-white p-4 transition ${!c.active || isExpired ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-green-300 bg-green-50">
                      <Tag className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">{c.code}</span>
                        <button onClick={() => copyCode(c.id, c.code)} className="rounded p-1 text-slate-400 hover:text-slate-600">
                          {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        {isExpired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">{t.expired}</span>}
                      </div>
                      <p className="text-xs text-slate-500">
                        {c.type === "percentage" ? <><Percent className="mr-0.5 inline h-3 w-3" />{c.value}% off</> : <><DollarSign className="mr-0.5 inline h-3 w-3" />{c.value} off</>}
                        {Number(c.minOrderAmount) > 0 && <> · {t.minOrder}: {c.minOrderAmount}</>}
                        {" · "}{c.usedCount}/{c.maxUses === -1 ? "∞" : c.maxUses} {t.uses.toLowerCase()}
                        {c.validUntil ? <> · {t.validUntil}: {new Date(c.validUntil).toLocaleDateString()}</> : <> · {t.noExpiry}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(c)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.active}>
                      {c.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                    </button>
                    <button onClick={() => startEdit(c)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.edit}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={t.delete}>
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
          <div className="mx-auto mt-4 mb-4 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:mt-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">{editingId ? t.edit : t.add}</h3>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.code}</label>
                <div className="mt-1 flex gap-2">
                  <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE10" className="h-11 flex-1 rounded-xl border border-slate-300 px-3 font-mono text-sm uppercase" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, code: generateCode() }))} className="h-11 shrink-0 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">{t.generate}</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.type}</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "percentage" | "fixed" }))} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">
                  <option value="percentage">{t.percentage}</option>
                  <option value="fixed">{t.fixed}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.value}</label>
                <input type="number" min={0} step="0.01" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} placeholder={form.type === "percentage" ? "10" : "5.00"} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.minOrder}</label>
                <input type="number" min={0} step="0.01" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} placeholder="0" className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.maxUses}</label>
                <input type="number" min={0} value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} placeholder={t.unlimited} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.validFrom}</label>
                <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">{t.validUntil}</label>
                <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
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
