"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { 
  DollarSign, 
  Search, 
  Filter,
  Check, 
  X, 
  AlertCircle, 
  Package, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  currentPrice: number;
  compareAtPrice?: number;
  category: string;
  status: string;
  stockQuantity: number;
  imageUrl?: string;
  hasVariants: boolean;
};

type PricingMode = 'percentage' | 'fixed';
type PricingOperation = 'increase' | 'decrease' | 'set';

type BulkPricingUpdate = {
  mode: PricingMode;
  operation: PricingOperation;
  value: number;
  affectComparePrice: boolean;
  selectedProductIds: number[];
  reason: string;
  preview: boolean;
};

type PricingPreview = {
  id: number;
  name: string;
  currentPrice: number;
  newPrice: number;
  currentComparePrice?: number;
  newComparePrice?: number;
  changePercent: number;
};

const dict = {
  en: {
    title: "Bulk Price Adjustment",
    description: "Update prices for multiple products at once",
    searchPlaceholder: "Search products by name or category...",
    filterByCategory: "Filter by category",
    filterByStatus: "Filter by status",
    allCategories: "All Categories",
    allStatuses: "All Statuses",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedCount: "selected",
    pricingMode: "Pricing Mode",
    percentageMode: "Percentage",
    fixedMode: "Fixed Amount",
    operation: "Operation",
    increase: "Increase",
    decrease: "Decrease",
    setValue: "Set to Value",
    value: "Value",
    percentageLabel: "Percentage (%)",
    amountLabel: "Amount",
    valueLabel: "Price",
    affectComparePrice: "Also adjust compare-at prices",
    reason: "Reason for price change",
    reasonPlaceholder: "Enter reason for bulk price adjustment...",
    previewChanges: "Preview Changes",
    applyChanges: "Apply Changes",
    currentPrice: "Current",
    newPrice: "New Price",
    change: "Change",
    product: "Product",
    category: "Category",
    stock: "Stock",
    noProducts: "No products found",
    loadingProducts: "Loading products...",
    processingChanges: "Processing changes...",
    previewMode: "Preview Mode",
    confirmChanges: "Confirm Changes",
    changesApplied: "Changes applied successfully!",
    error: "Error applying changes",
    invalidValue: "Please enter a valid value",
    noSelection: "Please select at least one product",
    noReason: "Please provide a reason for the price change",
    pricePreview: "Price Preview",
    affectedProducts: "Affected Products",
    totalProducts: "Total Products",
    estimatedRevenue: "Est. Revenue Impact",
    close: "Close",
    apply: "Apply",
    cancel: "Cancel",
    showPreview: "Show Preview",
    hidePreview: "Hide Preview",
  },
  pt: {
    title: "Ajuste de Preço em Lote",
    description: "Atualize preços para vários produtos de uma vez",
    searchPlaceholder: "Pesquisar produtos por nome ou categoria...",
    filterByCategory: "Filtrar por categoria",
    filterByStatus: "Filtrar por status",
    allCategories: "Todas as Categorias",
    allStatuses: "Todos os Status",
    published: "Publicado",
    draft: "Rascunho",
    archived: "Arquivado",
    selectAll: "Selecionar Todos",
    deselectAll: "Desmarcar Todos",
    selectedCount: "selecionados",
    pricingMode: "Modo de Preço",
    percentageMode: "Porcentagem",
    fixedMode: "Valor Fixo",
    operation: "Operação",
    increase: "Aumentar",
    decrease: "Diminuir",
    setValue: "Definir Valor",
    value: "Valor",
    percentageLabel: "Porcentagem (%)",
    amountLabel: "Quantidade",
    valueLabel: "Preço",
    affectComparePrice: "Também ajustar preços de comparação",
    reason: "Motivo da mudança de preço",
    reasonPlaceholder: "Digite o motivo do ajuste de preço em lote...",
    previewChanges: "Visualizar Mudanças",
    applyChanges: "Aplicar Mudanças",
    currentPrice: "Atual",
    newPrice: "Novo Preço",
    change: "Mudança",
    product: "Produto",
    category: "Categoria",
    stock: "Estoque",
    noProducts: "Nenhum produto encontrado",
    loadingProducts: "Carregando produtos...",
    processingChanges: "Processando mudanças...",
    previewMode: "Modo de Visualização",
    confirmChanges: "Confirmar Mudanças",
    changesApplied: "Mudanças aplicadas com sucesso!",
    error: "Erro ao aplicar mudanças",
    invalidValue: "Por favor digite um valor válido",
    noSelection: "Por favor selecione pelo menos um produto",
    noReason: "Por favor forneça um motivo para a mudança de preço",
    pricePreview: "Visualização de Preços",
    affectedProducts: "Produtos Afetados",
    totalProducts: "Total de Produtos",
    estimatedRevenue: "Impacto Estimado na Receita",
    close: "Fechar",
    apply: "Aplicar",
    cancel: "Cancelar",
    showPreview: "Mostrar Visualização",
    hidePreview: "Ocultar Visualização",
  },
};

export function BulkPricingComponent() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  
  // Pricing configuration
  const [pricingMode, setPricingMode] = useState<PricingMode>('percentage');
  const [operation, setOperation] = useState<PricingOperation>('increase');
  const [value, setValue] = useState<number>(0);
  const [affectComparePrice, setAffectComparePrice] = useState(false);
  const [reason, setReason] = useState("");
  
  // Preview and processing
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<PricingPreview[]>([]);
  const [processing, setProcessing] = useState(false);
  
  // Categories for filter
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, statusFilter]);

  const loadProducts = async (search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        category: categoryFilter,
        status: statusFilter,
        limit: "100",
      });
      
      const response = await fetch(`/api/dashboard/products/bulk/list?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.products?.map((p: Product) => p.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    setSelectedProductIds(new Set(products.map(p => p.id)));
  };

  const deselectAllProducts = () => {
    setSelectedProductIds(new Set());
  };

  const calculateNewPrice = (currentPrice: number): number => {
    let newPrice = currentPrice;
    
    if (pricingMode === 'percentage') {
      if (operation === 'increase') {
        newPrice = currentPrice * (1 + value / 100);
      } else if (operation === 'decrease') {
        newPrice = currentPrice * (1 - value / 100);
      } else { // set
        newPrice = currentPrice * (value / 100);
      }
    } else { // fixed
      if (operation === 'increase') {
        newPrice = currentPrice + value;
      } else if (operation === 'decrease') {
        newPrice = currentPrice - value;
      } else { // set
        newPrice = value;
      }
    }
    
    return Math.max(0, Math.round(newPrice * 100) / 100);
  };

  const generatePreview = () => {
    if (selectedProductIds.size === 0) {
      alert(t.noSelection);
      return;
    }

    if (value <= 0 || isNaN(value)) {
      alert(t.invalidValue);
      return;
    }

    const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
    const previewData: PricingPreview[] = selectedProducts.map(product => {
      const newPrice = calculateNewPrice(product.currentPrice);
      const newComparePrice = affectComparePrice && product.compareAtPrice 
        ? calculateNewPrice(product.compareAtPrice) 
        : product.compareAtPrice;
      
      const changePercent = ((newPrice - product.currentPrice) / product.currentPrice) * 100;
      
      return {
        id: product.id,
        name: product.name,
        currentPrice: product.currentPrice,
        newPrice,
        currentComparePrice: product.compareAtPrice,
        newComparePrice,
        changePercent,
      };
    });

    setPreview(previewData);
    setShowPreview(true);
  };

  const applyPricingChanges = async () => {
    if (!reason.trim()) {
      alert(t.noReason);
      return;
    }

    setProcessing(true);
    try {
      const updateData: BulkPricingUpdate = {
        mode: pricingMode,
        operation,
        value,
        affectComparePrice,
        selectedProductIds: Array.from(selectedProductIds),
        reason: reason.trim(),
        preview: false,
      };

      const response = await fetch('/api/dashboard/products/bulk/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${t.changesApplied} ${result.updatedCount} products updated.`);
        
        // Reload products and reset state
        loadProducts();
        setSelectedProductIds(new Set());
        setValue(0);
        setReason("");
        setShowPreview(false);
        setPreview([]);
      } else {
        const error = await response.json();
        alert(error.error || t.error);
      }
    } catch (error) {
      console.error('Failed to apply pricing changes:', error);
      alert(t.error);
    } finally {
      setProcessing(false);
    }
  };

  const PreviewModal = () => {
    if (!showPreview) return null;

    const totalRevenue = preview.reduce((sum, p) => sum + p.newPrice, 0);
    const currentRevenue = preview.reduce((sum, p) => sum + p.currentPrice, 0);
    const revenueImpact = totalRevenue - currentRevenue;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.pricePreview}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="p-6 bg-gray-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{preview.length}</p>
                <p className="text-sm text-slate-600">{t.affectedProducts}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  ${totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600">New Total Value</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${revenueImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueImpact >= 0 ? '+' : ''}${revenueImpact.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600">{t.estimatedRevenue}</p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.product}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.currentPrice}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.newPrice}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.change}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {preview.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono">${item.currentPrice.toFixed(2)}</span>
                      {item.currentComparePrice && (
                        <div className="text-sm text-slate-500">
                          Compare: ${item.currentComparePrice.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold">${item.newPrice.toFixed(2)}</span>
                      {item.newComparePrice && (
                        <div className="text-sm text-slate-500">
                          Compare: ${item.newComparePrice.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 ${
                        item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.changePercent >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {item.changePercent >= 0 ? '+' : ''}
                          {item.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        ${(item.newPrice - item.currentPrice).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-slate-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={applyPricingChanges}
                disabled={processing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.processingChanges}
                  </span>
                ) : (
                  t.confirmChanges
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
        
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">{t.allCategories}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">{t.allStatuses}</option>
            <option value="Published">{t.published}</option>
            <option value="Draft">{t.draft}</option>
            <option value="Archived">{t.archived}</option>
          </select>
        </div>

        {/* Pricing Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.pricingMode}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="percentage"
                    checked={pricingMode === 'percentage'}
                    onChange={(e) => setPricingMode(e.target.value as PricingMode)}
                    className="mr-2"
                  />
                  {t.percentageMode}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="fixed"
                    checked={pricingMode === 'fixed'}
                    onChange={(e) => setPricingMode(e.target.value as PricingMode)}
                    className="mr-2"
                  />
                  {t.fixedMode}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.operation}
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as PricingOperation)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="increase">{t.increase}</option>
                <option value="decrease">{t.decrease}</option>
                <option value="set">{t.setValue}</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {pricingMode === 'percentage' ? t.percentageLabel : 
                 operation === 'set' ? t.valueLabel : t.amountLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={pricingMode === 'percentage' ? '0.1' : '0.01'}
                  value={value || ''}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {pricingMode === 'percentage' ? '%' : '$'}
                </div>
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={affectComparePrice}
                onChange={(e) => setAffectComparePrice(e.target.checked)}
                className="mr-2 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">{t.affectComparePrice}</span>
            </label>
          </div>
        </div>

        {/* Reason Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t.reason} *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-600">
            {selectedProductIds.size} {t.selectedCount}
          </div>
          <div className="flex gap-3">
            <button
              onClick={generatePreview}
              disabled={selectedProductIds.size === 0 || value <= 0 || !reason.trim()}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              {t.previewChanges}
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-medium">
            {t.totalProducts}: {products.length}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={selectAllProducts}
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              {t.selectAll}
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={deselectAllProducts}
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              {t.deselectAll}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">{t.loadingProducts}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{t.noProducts}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && products.every(p => selectedProductIds.has(p.id))}
                      onChange={(e) => e.target.checked ? selectAllProducts() : deselectAllProducts()}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.product}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.category}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.currentPrice}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.stock}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => (
                  <tr 
                    key={product.id}
                    className={`hover:bg-slate-50 ${
                      selectedProductIds.has(product.id) ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              product.status === 'Published' 
                                ? 'bg-green-100 text-green-800'
                                : product.status === 'Draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.status}
                            </span>
                            {product.hasVariants && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Variants
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-600">{product.category || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-mono font-medium">${product.currentPrice.toFixed(2)}</span>
                        {product.compareAtPrice && (
                          <div className="text-sm text-slate-500">
                            Was: ${product.compareAtPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${
                        product.stockQuantity <= 0 
                          ? 'text-red-600' 
                          : product.stockQuantity < 10 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PreviewModal />
    </div>
  );
}