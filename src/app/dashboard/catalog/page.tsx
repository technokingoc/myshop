"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { Plus, Search, PackageOpen, Trash2, Pencil, CheckSquare, Square, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ImageUpload } from "@/components/image-upload";

type CatalogItem = {
  id: number;
  sellerId: number;
  name: string;
  type: "Product" | "Service";
  category: string;
  shortDescription: string;
  imageUrl: string;
  imageUrls: string;
  price: string;
  status: "Draft" | "Published";
};

const STORAGE_CATALOG = "myshop_catalog_v2";

const dict = {
  en: {
    title: "Catalog",
    subtitle: "Create and manage products and services",
    add: "Add item",
    addFirst: "Add first item",
    search: "Search by name or description",
    all: "All",
    published: "Published",
    draft: "Draft",
    type: "Type",
    price: "Price",
    status: "Status",
    actions: "Actions",
    noItemsTitle: "Your catalog is empty",
    noItemsHint: "Start by adding your first product or service.",
    bulkPublish: "Bulk publish",
    bulkUnpublish: "Bulk unpublish",
    selected: "selected",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    name: "Name",
    category: "Category",
    description: "Description",
    imageUrl: "Main image URL",
    service: "Service",
    product: "Product",
    publish: "Publish",
    unpublish: "Unpublish",
    dbFallback: "DB sync unavailable. Using local fallback.",
    imageUrls: "Additional images",
    addImageUrl: "Add image URL",
    removeImage: "Remove",
    statusLabel: "Visibility",
    preview: "Preview",
  },
  pt: {
    title: "Catálogo",
    subtitle: "Crie e gerencie produtos e serviços",
    add: "Adicionar item",
    addFirst: "Adicionar primeiro item",
    search: "Pesquisar por nome ou descrição",
    all: "Todos",
    published: "Publicado",
    draft: "Rascunho",
    type: "Tipo",
    price: "Preço",
    status: "Estado",
    actions: "Ações",
    noItemsTitle: "Seu catálogo está vazio",
    noItemsHint: "Comece adicionando o seu primeiro produto ou serviço.",
    bulkPublish: "Publicar em lote",
    bulkUnpublish: "Despublicar em lote",
    selected: "selecionados",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    name: "Nome",
    category: "Categoria",
    description: "Descrição",
    imageUrl: "URL da imagem principal",
    service: "Serviço",
    product: "Produto",
    publish: "Publicar",
    unpublish: "Despublicar",
    dbFallback: "Sincronização com BD indisponível. A usar fallback local.",
    imageUrls: "Imagens adicionais",
    addImageUrl: "Adicionar URL de imagem",
    removeImage: "Remover",
    statusLabel: "Visibilidade",
    preview: "Pré-visualização",
  },
};

type FormState = Omit<CatalogItem, "id" | "sellerId">;
const initialForm: FormState = {
  name: "",
  type: "Product",
  category: "",
  shortDescription: "",
  imageUrl: "",
  imageUrls: "",
  price: "",
  status: "Draft",
};

/* ── Tiny image preview (shows thumbnail if URL is valid) ── */
function ImagePreview({ url, size = "h-10 w-10" }: { url: string; size?: string }) {
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(true); }, [url]);
  if (!url || !ok) return null;
  return (
    <img
      src={url}
      alt=""
      className={`${size} shrink-0 rounded-lg object-cover border border-slate-200`}
      onError={() => setOk(false)}
    />
  );
}

export default function DashboardCatalogPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [dbReady, setDbReady] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Draft" | "Published">("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const persistLocal = (next: CatalogItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_CATALOG, JSON.stringify(next));
  };

  const loadData = useCallback(async () => {
    // Load cached catalog from localStorage first
    const rawCatalog = localStorage.getItem(STORAGE_CATALOG);
    const fallback = rawCatalog ? (JSON.parse(rawCatalog) as CatalogItem[]) : [];
    setItems(Array.isArray(fallback) ? fallback : []);

    // Get sellerId from /api/auth/me session (cookie-based)
    let currentSellerId: number | null = null;
    let currentSlug = "";
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.session) {
          currentSellerId = meData.session.sellerId || null;
          currentSlug = meData.session.sellerSlug || "";
        }
      }
    } catch {
      // session fetch failed, continue with fallback
    }

    setSellerId(currentSellerId);
    setSlug(currentSlug);

    if (!currentSellerId && !currentSlug) {
      setDbReady(false);
      setHydrated(true);
      return;
    }

    try {
      const health = await fetch("/api/health/db").then((r) => r.json()).catch(() => null);
      if (health && !health.ok) {
        setDbReady(false);
        setHydrated(true);
        return;
      }

      const dbItems = currentSellerId
        ? await fetchJsonWithRetry<CatalogItem[]>(`/api/catalog?sellerId=${currentSellerId}`, undefined, 2, "catalog:list")
        : await fetchJsonWithRetry<CatalogItem[]>(`/api/catalog?sellerSlug=${currentSlug}`, undefined, 2, "catalog:list");

      setDbReady(true);
      persistLocal(Array.isArray(dbItems) ? dbItems : []);
    } catch {
      setDbReady(false);
      toast.info(t.dbFallback);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.shortDescription || "").toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  // Count badges
  const countAll = items.length;
  const countPublished = items.filter((i) => i.status === "Published").length;
  const countDraft = items.filter((i) => i.status === "Draft").length;

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const startEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      category: item.category,
      shortDescription: item.shortDescription,
      imageUrl: item.imageUrl,
      imageUrls: item.imageUrls || "",
      price: item.price,
      status: item.status,
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) return;

    if (editingId) {
      const localNext = items.map((i) => (i.id === editingId ? { ...i, ...form } : i));
      persistLocal(localNext);
      if (dbReady) {
        try {
          const updated = await fetchJsonWithRetry<CatalogItem>(
            "/api/catalog",
            { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...form }) },
            2, "catalog:update",
          );
          persistLocal(localNext.map((i) => (i.id === editingId ? updated : i)));
        } catch { setDbReady(false); }
      }
    } else {
      const tempId = Date.now();
      const draft: CatalogItem = { id: tempId, sellerId: sellerId || 0, ...form };
      persistLocal([draft, ...items]);

      if (dbReady && sellerId) {
        try {
          const created = await fetchJsonWithRetry<CatalogItem>(
            "/api/catalog",
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sellerId, ...form }) },
            2, "catalog:create",
          );
          persistLocal([created, ...items]);
        } catch { setDbReady(false); }
      }
    }

    setShowForm(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const removeItem = async (id: number) => {
    const next = items.filter((i) => i.id !== id);
    persistLocal(next);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (dbReady) {
      try { await fetchJsonWithRetry(`/api/catalog?id=${id}`, { method: "DELETE" }, 2, "catalog:delete"); } catch { setDbReady(false); }
    }
  };

  const togglePublish = async (item: CatalogItem, publish: boolean) => {
    const nextStatus: CatalogItem["status"] = publish ? "Published" : "Draft";
    const next = items.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i));
    persistLocal(next);
    if (dbReady) {
      try {
        await fetchJsonWithRetry("/api/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: nextStatus }) }, 2, "catalog:toggle");
      } catch { setDbReady(false); }
    }
  };

  const bulkSetStatus = async (publish: boolean) => {
    if (selected.size === 0) return;
    const nextStatus: CatalogItem["status"] = publish ? "Published" : "Draft";
    const ids = new Set(selected);
    const next = items.map((i) => (ids.has(i.id) ? { ...i, status: nextStatus } : i));
    persistLocal(next);
    if (dbReady) {
      await Promise.all(
        Array.from(ids).map((id) =>
          fetchJsonWithRetry("/api/catalog", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) }, 2, "catalog:bulk").catch(() => { setDbReady(false); return null; }),
        ),
      );
    }
  };

  if (!hydrated) return null;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
          {!dbReady && <p className="mt-2 text-xs font-medium text-amber-700">{t.dbFallback}</p>}
        </div>
        <button onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> {t.add}
        </button>
      </div>

      {/* Search + filter tabs with count badges */}
      <section className="mb-4 space-y-3">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full text-sm outline-none bg-transparent" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([["All", t.all, countAll], ["Published", t.published, countPublished], ["Draft", t.draft, countDraft]] as const).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                statusFilter === val ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === val ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm">
          <span className="font-medium text-indigo-800">{selected.size} {t.selected}</span>
          <button onClick={() => bulkSetStatus(true)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">{t.bulkPublish}</button>
          <button onClick={() => bulkSetStatus(false)} className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">{t.bulkUnpublish}</button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <section className="shell-empty rounded-2xl border border-slate-200 bg-white">
          <div className="shell-empty-card">
            <PackageOpen className="shell-empty-icon" />
            <h2 className="shell-empty-title">{t.noItemsTitle}</h2>
            <p className="shell-empty-subtitle">{t.noItemsHint}</p>
            <button onClick={startCreate} className="shell-empty-cta inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">{t.addFirst}</button>
          </div>
        </section>
      ) : (
        <>
          {/* Mobile: Card layout */}
          <section className="space-y-3 md:hidden">
            {filtered.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <PlaceholderImage className="h-16 w-16 rounded-lg" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{item.category || "—"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {item.status === "Published" ? t.published : t.draft}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-800">{item.price || "0"}</p>
                    </div>
                  </div>
                  {/* Actions row */}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                    <button onClick={() => setSelected((prev) => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}>
                      {isSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePublish(item, item.status !== "Published")} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={item.status === "Published" ? t.unpublish : t.publish}>
                        {item.status === "Published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title={t.edit}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={t.delete}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Desktop: Table layout */}
          <section className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[40px_1fr_100px_100px_100px_120px] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>
                <button onClick={() => setSelected(new Set(selected.size === filtered.length ? [] : filtered.map((i) => i.id)))}>
                  {selected.size === filtered.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </div>
              <div>{t.name}</div>
              <div>{t.type}</div>
              <div>{t.price}</div>
              <div>{t.status}</div>
              <div className="text-right">{t.actions}</div>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <div key={item.id} className="grid grid-cols-[40px_1fr_100px_100px_100px_120px] items-center gap-2 px-4 py-3">
                    <div>
                      <button onClick={() => setSelected((prev) => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}>
                        {isSelected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                      </button>
                    </div>
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <PlaceholderImage className="h-9 w-9 shrink-0 rounded-lg" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="truncate text-xs text-slate-500">{item.category || "—"} {item.shortDescription ? `• ${item.shortDescription}` : ""}</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-700">{item.type === "Service" ? t.service : t.product}</div>
                    <div className="text-sm font-medium text-slate-800">{item.price || "0"}</div>
                    <div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {item.status === "Published" ? t.published : t.draft}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => togglePublish(item, item.status !== "Published")} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" title={item.status === "Published" ? t.unpublish : t.publish}>
                        {item.status === "Published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" title={t.edit}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" title={t.delete}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/35 p-4" onClick={() => setShowForm(false)}>
          <div className="mx-auto mt-4 mb-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:mt-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">{editingId ? t.edit : t.add}</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <Field label={t.name} value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
              {/* Price */}
              <Field label={t.price} value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} />
              {/* Category */}
              <Field label={t.category} value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} />
              {/* Type */}
              <div>
                <label className="text-sm font-medium text-slate-700">{t.type}</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "Product" | "Service" }))} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm">
                  <option value="Product">{t.product}</option>
                  <option value="Service">{t.service}</option>
                </select>
              </div>
              {/* Status toggle */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.statusLabel}</label>
                <div className="mt-1 flex gap-2">
                  {(["Draft", "Published"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, status: s }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        form.status === s
                          ? s === "Published" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {s === "Published" ? t.published : t.draft}
                    </button>
                  ))}
                </div>
              </div>
              {/* Description */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.description}</label>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {/* Main image upload */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">{t.imageUrl}</label>
                <div className="mt-1">
                  <ImageUpload
                    currentUrl={form.imageUrl}
                    onUrlChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                  />
                </div>
              </div>
              {/* Additional images */}
              <div className="sm:col-span-2">
                <MultiImageUploadField
                  label={t.imageUrls}
                  value={form.imageUrls}
                  onChange={(v) => setForm((p) => ({ ...p, imageUrls: v }))}
                  addLabel={t.addImageUrl}
                  removeLabel={t.removeImage}
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
    </div>
  );
}

function MultiImageUploadField({
  label, value, onChange, addLabel, removeLabel,
}: {
  label: string; value: string; onChange: (v: string) => void; addLabel: string; removeLabel: string;
}) {
  let urls: string[] = [];
  try { const p = JSON.parse(value); if (Array.isArray(p)) urls = p; } catch {}

  const update = (next: string[]) => onChange(JSON.stringify(next.filter(Boolean).length > 0 ? next : []));
  const add = () => { if (urls.length < 5) update([...urls, ""]); };
  const remove = (i: number) => update(urls.filter((_, idx) => idx !== i));
  const set = (i: number, v: string) => { const n = [...urls]; n[i] = v; update(n); };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => (
          <ImageUpload key={i} currentUrl={url} onUrlChange={(v) => set(i, v)} />
        ))}
        {urls.length < 5 && (
          <button type="button" onClick={add} className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition">
            <Plus className="h-5 w-5" /> <span className="text-xs">{addLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
