"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { EnhancedProductForm } from "@/components/enhanced-product-form";
import {
  Plus, Search, PackageOpen, Trash2, Pencil, CheckSquare, Square, Eye, EyeOff,
  Image as ImageIcon, AlertTriangle, Copy, Package, Layers3, Archive, MoreHorizontal,
  ZoomIn, Settings, AlertCircle, Filter
} from "lucide-react";
import { PlaceholderImage } from "@/components/placeholder-image";
import { FAB } from "@/components/fab";

type ProductVariant = {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  attributes: Record<string, string>;
  sortOrder: number;
  active: boolean;
};

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
  compareAtPrice: string;
  status: "Draft" | "Published";
  stockQuantity: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  hasVariants: boolean;
  variants?: ProductVariant[];
};

const dict = {
  en: {
    title: "Product Management Premium",
    subtitle: "Manage products, variants, inventory, and bulk operations",
    add: "Add Product",
    addFirst: "Add First Product",
    search: "Search by name, SKU, or description",
    all: "All",
    published: "Published",
    draft: "Draft",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    noItemsTitle: "Your catalog is empty",
    noItemsHint: "Start by adding your first product with variants and inventory tracking.",
    bulkActions: "Bulk Actions",
    bulkActivate: "Activate",
    bulkDeactivate: "Deactivate",
    bulkDelete: "Delete",
    bulkDuplicate: "Duplicate",
    selected: "selected",
    duplicate: "Duplicate",
    edit: "Edit",
    delete: "Delete",
    variants: "variants",
    inStock: "in stock",
    stockAlert: "Low stock",
    outOfStockAlert: "Out of stock",
    hasVariants: "Has Variants",
    manageVariants: "Manage Variants",
    zoomHover: "Hover to zoom",
    dragToReorder: "Drag to reorder",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error loading products",
    productSaved: "Product saved successfully",
    productDeleted: "Product deleted successfully",
    bulkActionComplete: "Bulk action completed",
    confirmDelete: "Are you sure you want to delete this product?",
    confirmBulkDelete: "Are you sure you want to delete {count} products?",
  },
  pt: {
    title: "Gestão de Produtos Premium",
    subtitle: "Gerir produtos, variantes, inventário e operações em lote",
    add: "Adicionar Produto",
    addFirst: "Adicionar Primeiro Produto",
    search: "Pesquisar por nome, SKU ou descrição",
    all: "Todos",
    published: "Publicado",
    draft: "Rascunho",
    lowStock: "Stock Baixo",
    outOfStock: "Sem Stock",
    noItemsTitle: "O seu catálogo está vazio",
    noItemsHint: "Comece por adicionar o seu primeiro produto com variantes e rastreio de inventário.",
    bulkActions: "Ações em Lote",
    bulkActivate: "Ativar",
    bulkDeactivate: "Desativar",
    bulkDelete: "Eliminar",
    bulkDuplicate: "Duplicar",
    selected: "selecionados",
    duplicate: "Duplicar",
    edit: "Editar",
    delete: "Eliminar",
    variants: "variantes",
    inStock: "em stock",
    stockAlert: "Stock baixo",
    outOfStockAlert: "Sem stock",
    hasVariants: "Tem Variantes",
    manageVariants: "Gerir Variantes",
    zoomHover: "Passar o rato para ampliar",
    dragToReorder: "Arrastar para reordenar",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "A carregar...",
    error: "Erro ao carregar produtos",
    productSaved: "Produto guardado com sucesso",
    productDeleted: "Produto eliminado com sucesso",
    bulkActionComplete: "Ação em lote concluída",
    confirmDelete: "Tem a certeza que quer eliminar este produto?",
    confirmBulkDelete: "Tem a certeza que quer eliminar {count} produtos?",
  },
};

// Stock indicator component with enhanced styling
function StockIndicator({ item }: { item: CatalogItem }) {
  const { lang } = useLanguage();
  const t = dict[lang];

  if (!item.trackInventory) return null;

  const totalStock = item.hasVariants 
    ? (item.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0)
    : item.stockQuantity;

  const isLowStock = totalStock <= item.lowStockThreshold && totalStock > 0;
  const isOutOfStock = totalStock === 0;

  if (isOutOfStock) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
        <AlertCircle className="h-3 w-3" />
        {t.outOfStockAlert}
      </div>
    );
  }

  if (isLowStock) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
        <AlertTriangle className="h-3 w-3" />
        {t.stockAlert}
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-500">
      {totalStock} {t.inStock}
    </div>
  );
}

// Enhanced product card with hover effects and better layout
function EnhancedProductCard({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
}: {
  item: CatalogItem;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
}) {
  const { lang } = useLanguage();
  const t = dict[lang];

  const imageUrls = item.imageUrls ? JSON.parse(item.imageUrls) : [];

  return (
    <div className={`group rounded-xl border-2 bg-white p-4 transition-all duration-200 hover:shadow-md ${
      isSelected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
    }`}>
      <div className="flex gap-4">
        {/* Product image with zoom on hover */}
        <div className="shrink-0 relative">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border relative group/image">
            {item.imageUrl ? (
              <>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-125"
                />
                {/* Zoom indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
                  <ZoomIn className="h-4 w-4 text-white drop-shadow-sm" />
                </div>
              </>
            ) : (
              <PlaceholderImage className="w-full h-full" />
            )}
            
            {/* Additional images indicator */}
            {imageUrls.length > 0 && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                +{imageUrls.length}
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                
                {/* Variants badge */}
                {item.hasVariants && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <Layers3 className="h-3 w-3" />
                    {item.variants?.length || 0} {t.variants}
                  </span>
                )}
                
                {/* Type badge */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.type === "Service" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {item.type}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-800">${item.price}</span>
                {item.compareAtPrice && parseFloat(item.compareAtPrice) > 0 && (
                  <span className="text-xs text-slate-500 line-through">${item.compareAtPrice}</span>
                )}
              </div>

              {/* Stock indicator */}
              <div className="mt-1">
                <StockIndicator item={item} />
              </div>
            </div>

            {/* Status badge */}
            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
              item.status === "Published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {item.status === "Published" ? t.published : t.draft}
            </span>
          </div>

          {/* Category and description */}
          <div className="mt-2 space-y-1">
            {item.category && (
              <p className="text-xs text-slate-500 truncate">
                {item.category}
              </p>
            )}
            {item.shortDescription && (
              <p className="text-xs text-slate-600 line-clamp-2">
                {item.shortDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onSelect}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-slate-400" />
          )}
          <span className="hidden sm:inline">Select</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleStatus}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title={item.status === "Published" ? "Unpublish" : "Publish"}
          >
            {item.status === "Published" ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={onDuplicate}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title={t.duplicate}
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={onEdit}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title={t.edit}
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            title={t.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedCatalogPage() {
  const { lang } = useLanguage();
  const t = dict[lang];
  const toast = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Load products with variants
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get session info
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        throw new Error("Authentication failed");
      }
      const meData = await meRes.json();
      const sellerId = meData.session?.sellerId;

      if (!sellerId) {
        throw new Error("No seller ID found");
      }

      // Load products
      const products = await fetchJsonWithRetry<CatalogItem[]>(
        `/api/catalog?sellerId=${sellerId}`,
        undefined,
        2,
        "catalog:list"
      );

      // Load variants for each product that has them
      const productsWithVariants = await Promise.all(
        products.map(async (product) => {
          if (product.hasVariants) {
            try {
              const variants = await fetchJsonWithRetry<ProductVariant[]>(
                `/api/catalog/variants?productId=${product.id}`,
                undefined,
                2,
                "variants:list"
              );
              return { ...product, variants };
            } catch (error) {
              console.warn(`Failed to load variants for product ${product.id}:`, error);
              return product;
            }
          }
          return product;
        })
      );

      setItems(Array.isArray(productsWithVariants) ? productsWithVariants : []);
    } catch (error) {
      console.error("Error loading catalog:", error);
      setError(t.error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Enhanced filtering with stock status
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter === "Published" && item.status !== "Published") return false;
      if (statusFilter === "Draft" && item.status !== "Draft") return false;
      
      if (statusFilter === "Low Stock" || statusFilter === "Out of Stock") {
        if (!item.trackInventory) return false;
        
        const totalStock = item.hasVariants 
          ? (item.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0)
          : item.stockQuantity;
        
        if (statusFilter === "Low Stock" && (totalStock > item.lowStockThreshold || totalStock === 0)) return false;
        if (statusFilter === "Out of Stock" && totalStock > 0) return false;
      }

      // Search filter
      const q = search.trim().toLowerCase();
      if (!q) return true;
      
      return (
        item.name.toLowerCase().includes(q) ||
        (item.shortDescription || "").toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.variants?.some(v => 
          v.name.toLowerCase().includes(q) || 
          v.sku.toLowerCase().includes(q)
        ))
      );
    });
  }, [items, search, statusFilter]);

  // Count filters
  const countAll = items.length;
  const countPublished = items.filter(i => i.status === "Published").length;
  const countDraft = items.filter(i => i.status === "Draft").length;
  const countLowStock = items.filter(i => {
    if (!i.trackInventory) return false;
    const totalStock = i.hasVariants 
      ? (i.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0)
      : i.stockQuantity;
    return totalStock <= i.lowStockThreshold && totalStock > 0;
  }).length;
  const countOutOfStock = items.filter(i => {
    if (!i.trackInventory) return false;
    const totalStock = i.hasVariants 
      ? (i.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0)
      : i.stockQuantity;
    return totalStock === 0;
  }).length;

  // Bulk operations
  const handleBulkAction = async (action: "activate" | "deactivate" | "delete" | "duplicate") => {
    if (selected.size === 0) return;

    const productIds = Array.from(selected);

    try {
      const response = await fetch("/api/catalog/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          productIds,
        }),
      });

      if (response.ok) {
        toast.success(t.bulkActionComplete);
        setSelected(new Set());
        await loadData(); // Refresh data
      } else {
        throw new Error("Bulk action failed");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Bulk action failed");
    }
  };

  // Duplicate product
  const duplicateProduct = async (productId: number) => {
    try {
      const response = await fetch("/api/catalog/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        toast.success("Product duplicated successfully");
        await loadData();
      } else {
        throw new Error("Duplication failed");
      }
    } catch (error) {
      console.error("Duplication error:", error);
      toast.error("Failed to duplicate product");
    }
  };

  // Delete product
  const deleteProduct = async (productId: number) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      await fetchJsonWithRetry(
        `/api/catalog?id=${productId}`,
        { method: "DELETE" },
        2,
        "catalog:delete"
      );
      
      toast.success(t.productDeleted);
      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product");
    }
  };

  // Toggle product status
  const toggleProductStatus = async (item: CatalogItem) => {
    const newStatus = item.status === "Published" ? "Draft" : "Published";
    
    try {
      await fetchJsonWithRetry(
        "/api/catalog",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, status: newStatus }),
        },
        2,
        "catalog:toggle"
      );
      
      await loadData();
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Failed to update product status");
    }
  };

  // Handle form save
  const handleFormSave = async (formData: any) => {
    try {
      const isEditing = !!editingItem;
      const endpoint = "/api/catalog";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing ? { ...formData, id: editingItem.id } : formData;

      await fetchJsonWithRetry(
        endpoint,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        2,
        isEditing ? "catalog:update" : "catalog:create"
      );

      toast.success(t.productSaved);
      setShowForm(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error("Save error:", error);
      throw error; // Re-throw to be handled by the form
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-sm text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            {t.add}
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Enhanced filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["All", t.all, countAll],
              ["Published", t.published, countPublished],
              ["Draft", t.draft, countDraft],
              ["Low Stock", t.lowStock, countLowStock],
              ["Out of Stock", t.outOfStock, countOutOfStock],
            ].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(String(key))}
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

        {/* Enhanced bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
            <span className="text-sm font-semibold text-indigo-900">
              {selected.size} {t.selected}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Eye className="h-3 w-3" />
                {t.bulkActivate}
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                <EyeOff className="h-3 w-3" />
                {t.bulkDeactivate}
              </button>
              <button
                onClick={() => handleBulkAction("duplicate")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Copy className="h-3 w-3" />
                {t.bulkDuplicate}
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                {t.bulkDelete}
              </button>
            </div>
          </div>
        )}

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
            <PackageOpen className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t.noItemsTitle}</h3>
            <p className="mt-2 text-sm text-slate-500">{t.noItemsHint}</p>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              {t.addFirst}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((item) => (
              <EnhancedProductCard
                key={item.id}
                item={item}
                isSelected={selected.has(item.id)}
                onSelect={() => {
                  const newSelected = new Set(selected);
                  if (newSelected.has(item.id)) {
                    newSelected.delete(item.id);
                  } else {
                    newSelected.add(item.id);
                  }
                  setSelected(newSelected);
                }}
                onEdit={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                onDelete={() => deleteProduct(item.id)}
                onDuplicate={() => duplicateProduct(item.id)}
                onToggleStatus={() => toggleProductStatus(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-6xl">
              <EnhancedProductForm
                initialData={editingItem ? {
                  ...editingItem,
                  imageUrls: editingItem.imageUrls ? JSON.parse(editingItem.imageUrls) : []
                } : undefined}
                onSave={handleFormSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* FAB for mobile */}
      <FAB 
        onClick={() => {
          setEditingItem(null);
          setShowForm(true);
        }} 
        icon={Plus}
      >
        Add Product
      </FAB>
    </>
  );
}