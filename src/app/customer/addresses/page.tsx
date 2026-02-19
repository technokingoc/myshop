"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { MapPin, Plus, Edit3, Trash2, Loader2, Save, X, Check } from "lucide-react";

const dict = {
  en: {
    title: "Saved Addresses", subtitle: "Manage your delivery addresses",
    loading: "Loading...", empty: "No saved addresses", emptyHint: "Add an address to get started.",
    addNew: "Add New Address", edit: "Edit", delete: "Delete", default: "Default",
    makeDefault: "Make Default", cancel: "Cancel", save: "Save Address",
    label: "Label", fullName: "Full Name", addressLine1: "Address Line 1", addressLine2: "Address Line 2 (Optional)",
    city: "City", state: "State/Province (Optional)", postalCode: "Postal Code (Optional)", country: "Country",
    phone: "Phone (Optional)", home: "Home", work: "Work", other: "Other",
    saving: "Saving...", deleting: "Deleting...", deleteConfirm: "Are you sure you want to delete this address?",
  },
  pt: {
    title: "Endereços Guardados", subtitle: "Gerencie seus endereços de entrega",
    loading: "A carregar...", empty: "Sem endereços guardados", emptyHint: "Adicione um endereço para começar.",
    addNew: "Adicionar Endereço", edit: "Editar", delete: "Apagar", default: "Padrão",
    makeDefault: "Tornar Padrão", cancel: "Cancelar", save: "Guardar Endereço",
    label: "Etiqueta", fullName: "Nome Completo", addressLine1: "Linha de Endereço 1", addressLine2: "Linha de Endereço 2 (Opcional)",
    city: "Cidade", state: "Estado/Província (Opcional)", postalCode: "Código Postal (Opcional)", country: "País",
    phone: "Telefone (Opcional)", home: "Casa", work: "Trabalho", other: "Outro",
    saving: "A guardar...", deleting: "A apagar...", deleteConfirm: "Tem certeza de que quer apagar este endereço?",
  },
};

type Address = {
  id: number;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export default function CustomerAddressesPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Mozambique",
    phone: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/auth/customer/addresses", { credentials: "include" });
      if (response.status === 401) {
        router.push("/customer/login");
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) setAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingId 
        ? "/api/auth/customer/addresses"
        : "/api/auth/customer/addresses";
      
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...form, id: editingId } : form;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchAddresses();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/auth/customer/addresses?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleMakeDefault = async (id: number) => {
    try {
      const address = addresses.find(a => a.id === id);
      if (!address) return;

      const response = await fetch("/api/auth/customer/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...address, id, isDefault: true }),
      });

      if (response.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const resetForm = () => {
    setForm({
      label: "Home",
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Mozambique",
      phone: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{t.title}</h1>
            <p className="text-xs text-slate-500">{t.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? t.cancel : t.addNew}
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">{t.label}</label>
                <select 
                  value={form.label} 
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className={inputClass}
                >
                  <option value="Home">{t.home}</option>
                  <option value="Work">{t.work}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">{t.fullName}</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">{t.addressLine1}</label>
              <input
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">{t.addressLine2}</label>
              <input
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">{t.city}</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">{t.state}</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">{t.postalCode}</label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">{t.country}</label>
                <input
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">{t.phone}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-600">{t.makeDefault}</label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? t.saving : t.save}
            </button>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="mt-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">{t.empty}</p>
          <p className="mt-1 text-xs text-slate-400">{t.emptyHint}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{address.label}</span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" /> {t.default}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{address.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  <p className="text-sm text-slate-600">
                    {address.city}
                    {address.state && `, ${address.state}`}
                    {address.postalCode && ` ${address.postalCode}`}
                  </p>
                  <p className="text-sm text-slate-600">{address.country}</p>
                  {address.phone && <p className="text-sm text-slate-600">{address.phone}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleMakeDefault(address.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      {t.makeDefault}
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}