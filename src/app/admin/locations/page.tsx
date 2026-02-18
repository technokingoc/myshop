"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { Plus, Pencil, Trash2, Save, X, MapPin } from "lucide-react";

type Location = {
  id: number; nameEn: string; namePt: string; slug: string;
  country: string; region: string; sortOrder: number; active: boolean;
};

const dict = {
  en: {
    title: "Locations", subtitle: "Manage cities and delivery areas",
    add: "Add Location", nameEn: "Name (EN)", namePt: "Name (PT)", slug: "Slug",
    country: "Country", region: "Region", sortOrder: "Sort Order",
    active: "Active", save: "Save", cancel: "Cancel",
    edit: "Edit", delete: "Delete", confirmDelete: "Delete this location?",
    noLocations: "No locations yet", actions: "Actions",
  },
  pt: {
    title: "Localizações", subtitle: "Gerir cidades e áreas de entrega",
    add: "Adicionar Localização", nameEn: "Nome (EN)", namePt: "Nome (PT)", slug: "Slug",
    country: "País", region: "Região", sortOrder: "Ordem",
    active: "Ativo", save: "Guardar", cancel: "Cancelar",
    edit: "Editar", delete: "Eliminar", confirmDelete: "Eliminar esta localização?",
    noLocations: "Ainda sem localizações", actions: "Ações",
  },
};

const emptyForm = { nameEn: "", namePt: "", slug: "", country: "Mozambique", region: "", sortOrder: 0, active: true };

export default function AdminLocationsPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/locations", { credentials: "include" });
      if (res.ok) setLocs(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (loc: Location) => {
    setEditing(loc.id);
    setForm({ nameEn: loc.nameEn, namePt: loc.namePt, slug: loc.slug, country: loc.country, region: loc.region, sortOrder: loc.sortOrder, active: loc.active });
  };

  const startNew = () => {
    setEditing("new");
    setForm({ ...emptyForm, sortOrder: locs.length + 1 });
  };

  const cancel = () => { setEditing(null); setForm(emptyForm); };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const save = async () => {
    if (!form.nameEn || !form.slug) return;
    try {
      if (editing === "new") {
        await fetch("/api/admin/locations", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      } else {
        await fetch("/api/admin/locations", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: editing, ...form }) });
      }
      cancel();
      load();
    } catch {}
  };

  const remove = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/admin/locations?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition">
          <Plus className="h-4 w-4" /> {t.add}
        </button>
      </div>

      {editing !== null && (
        <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-500">{t.nameEn}</label>
              <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value, slug: editing === "new" ? autoSlug(e.target.value) : f.slug }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{t.namePt}</label>
              <input value={form.namePt} onChange={(e) => setForm((f) => ({ ...f, namePt: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{t.slug}</label>
              <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-violet-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{t.country}</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{t.region}</label>
              <input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">{t.sortOrder}</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded border-slate-300" />
                  {t.active}
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"><Save className="h-3.5 w-3.5" /> {t.save}</button>
            <button onClick={cancel} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><X className="h-3.5 w-3.5" /> {t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t.nameEn}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t.namePt}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t.country}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">{t.region}</th>
              <th className="px-4 py-3 text-center font-medium text-slate-500">{t.active}</th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locs.map((loc) => (
              <tr key={loc.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-slate-400">{loc.sortOrder}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{loc.nameEn}</td>
                <td className="px-4 py-3 text-slate-600">{loc.namePt}</td>
                <td className="px-4 py-3 text-slate-500">{loc.country}</td>
                <td className="px-4 py-3 text-slate-500">{loc.region || "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block h-2 w-2 rounded-full ${loc.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(loc)} className="mr-2 text-slate-400 hover:text-violet-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(loc.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!loading && locs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400"><MapPin className="mx-auto h-8 w-8 mb-2" />{t.noLocations}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
