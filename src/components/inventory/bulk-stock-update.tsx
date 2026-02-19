"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { 
  Upload, 
  Download, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Package, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

type BulkUpdateItem = {
  id: number;
  type: 'product' | 'variant';
  name: string;
  variantName?: string;
  sku: string;
  currentStock: number;
  newStock: number;
  changed: boolean;
};

type UpdateResult = {
  id: number;
  type: string;
  success: boolean;
  error?: string;
  newStock?: number;
};

const dict = {
  en: {
    title: "Bulk Stock Update",
    description: "Update stock levels for multiple products at once",
    searchPlaceholder: "Search products...",
    loadMore: "Load More",
    product: "Product",
    variant: "Variant",
    sku: "SKU",
    currentStock: "Current",
    newStock: "New Stock",
    changes: "Changes",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    updateSelected: "Update Selected",
    exportTemplate: "Export Template",
    importCSV: "Import CSV",
    reason: "Reason for changes",
    reasonPlaceholder: "Enter reason for bulk stock update...",
    notes: "Additional notes",
    notesPlaceholder: "Optional notes...",
    noChanges: "No changes to apply",
    itemsSelected: "items selected",
    updating: "Updating...",
    successTitle: "Update Complete",
    errorTitle: "Update Failed",
    partialSuccess: "Partial Success",
    successful: "successful",
    failed: "failed",
    viewDetails: "View Details",
    tryAgain: "Try Again",
    close: "Close",
    loadingItems: "Loading items...",
    noItemsFound: "No items found",
    resetChanges: "Reset Changes",
    csvImportHelp: "Import a CSV file with columns: SKU, Stock",
    templateHeaders: "Product Name,SKU,Current Stock,New Stock",
  },
  pt: {
    title: "Atualização em Lote de Estoque",
    description: "Atualize os níveis de estoque para vários produtos de uma vez",
    searchPlaceholder: "Pesquisar produtos...",
    loadMore: "Carregar Mais",
    product: "Produto",
    variant: "Variante",
    sku: "SKU",
    currentStock: "Atual",
    newStock: "Novo Estoque",
    changes: "Mudanças",
    selectAll: "Selecionar Todos",
    deselectAll: "Desmarcar Todos",
    updateSelected: "Atualizar Selecionados",
    exportTemplate: "Exportar Modelo",
    importCSV: "Importar CSV",
    reason: "Motivo das mudanças",
    reasonPlaceholder: "Digite o motivo da atualização em lote...",
    notes: "Notas adicionais",
    notesPlaceholder: "Notas opcionais...",
    noChanges: "Nenhuma mudança para aplicar",
    itemsSelected: "itens selecionados",
    updating: "Atualizando...",
    successTitle: "Atualização Concluída",
    errorTitle: "Falha na Atualização",
    partialSuccess: "Sucesso Parcial",
    successful: "bem-sucedidos",
    failed: "falharam",
    viewDetails: "Ver Detalhes",
    tryAgain: "Tentar Novamente",
    close: "Fechar",
    loadingItems: "Carregando itens...",
    noItemsFound: "Nenhum item encontrado",
    resetChanges: "Redefinir Mudanças",
    csvImportHelp: "Importe um arquivo CSV com colunas: SKU, Estoque",
    templateHeaders: "Nome do Produto,SKU,Estoque Atual,Novo Estoque",
  },
};

export function BulkStockUpdate() {
  const { lang } = useLanguage();
  const t = dict[lang];
  
  const [items, setItems] = useState<BulkUpdateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Load items
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (search = "", offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        limit: "50",
        offset: offset.toString(),
      });
      
      const response = await fetch(`/api/inventory/bulk-update?${params}`);
      if (response.ok) {
        const data = await response.json();
        const formattedItems = data.map((item: any) => ({
          ...item,
          newStock: item.currentStock,
          changed: false,
        }));
        
        if (offset === 0) {
          setItems(formattedItems);
        } else {
          setItems(prev => [...prev, ...formattedItems]);
        }
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") {
        setSearching(true);
        loadItems(searchTerm);
      } else if (searchTerm === "") {
        loadItems();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update stock value for an item
  const updateItemStock = (itemId: string, newStock: number) => {
    setItems(prev => prev.map(item => {
      const key = `${item.type}-${item.id}`;
      if (key === itemId) {
        return {
          ...item,
          newStock: Math.max(0, newStock),
          changed: newStock !== item.currentStock,
        };
      }
      return item;
    }));
  };

  // Get changed items
  const changedItems = items.filter(item => item.changed);
  
  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Select all changed items
  const selectAllChanged = () => {
    const changedIds = changedItems.map(item => `${item.type}-${item.id}`);
    setSelectedItems(new Set(changedIds));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Reset all changes
  const resetChanges = () => {
    setItems(prev => prev.map(item => ({
      ...item,
      newStock: item.currentStock,
      changed: false,
    })));
    setSelectedItems(new Set());
  };

  // Export CSV template
  const exportTemplate = () => {
    const headers = t.templateHeaders.split(',');
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name}${item.variantName ? ' - ' + item.variantName : ''}"`,
        item.sku,
        item.currentStock,
        item.newStock,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle CSV import
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find SKU and Stock columns
      const skuIndex = headers.findIndex(h => h.toLowerCase().includes('sku'));
      const stockIndex = headers.findIndex(h => h.toLowerCase().includes('stock') && !h.toLowerCase().includes('current'));
      
      if (skuIndex === -1 || stockIndex === -1) {
        alert('CSV must contain SKU and Stock columns');
        return;
      }

      // Parse data rows
      const updates = new Map();
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        if (row.length > Math.max(skuIndex, stockIndex)) {
          const sku = row[skuIndex];
          const stock = parseInt(row[stockIndex]);
          if (sku && !isNaN(stock)) {
            updates.set(sku, stock);
          }
        }
      }

      // Apply updates to items
      setItems(prev => prev.map(item => {
        if (updates.has(item.sku)) {
          const newStock = updates.get(item.sku);
          return {
            ...item,
            newStock,
            changed: newStock !== item.currentStock,
          };
        }
        return item;
      }));
    };
    reader.readAsText(file);
  };

  // Apply bulk update
  const applyBulkUpdate = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the changes');
      return;
    }

    const selectedChangedItems = changedItems.filter(item => 
      selectedItems.has(`${item.type}-${item.id}`)
    );

    if (selectedChangedItems.length === 0) {
      alert('No items selected for update');
      return;
    }

    setUpdating(true);
    try {
      const updates = selectedChangedItems.map(item => ({
        id: item.id,
        type: item.type,
        newStock: item.newStock,
        reason,
        notes,
      }));

      const response = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates, reason, notes }),
      });

      if (response.ok) {
        const result = await response.json();
        setUpdateResults(result.results);
        setShowResults(true);
        
        // Update local state with successful changes
        if (result.results) {
          setItems(prev => prev.map(item => {
            const key = `${item.type}-${item.id}`;
            const updateResult = result.results.find((r: UpdateResult) => 
              `${r.type}-${r.id}` === key
            );
            
            if (updateResult?.success) {
              return {
                ...item,
                currentStock: updateResult.newStock || item.newStock,
                newStock: updateResult.newStock || item.newStock,
                changed: false,
              };
            }
            return item;
          }));
        }
        
        // Clear selections and form
        setSelectedItems(new Set());
        setReason("");
        setNotes("");
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Bulk update failed:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const ResultsModal = () => {
    if (!showResults) return null;

    const successful = updateResults.filter(r => r.success).length;
    const failed = updateResults.filter(r => !r.success).length;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {failed === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : successful === 0 ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-600" />
              )}
              <h2 className="text-lg font-semibold">
                {failed === 0 ? t.successTitle : successful === 0 ? t.errorTitle : t.partialSuccess}
              </h2>
            </div>
            <p className="text-slate-600 mt-2">
              {successful} {t.successful}, {failed} {t.failed}
            </p>
          </div>
          
          <div className="p-6 space-y-3 max-h-60 overflow-y-auto">
            {updateResults.map((result, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                result.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {result.type} ID: {result.id}
                  </p>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={() => setShowResults(false)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
            <p className="text-slate-600 text-sm">{t.description}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportTemplate}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {t.exportTemplate}
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer">
              <Upload className="h-4 w-4" />
              {t.importCSV}
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Selection Controls */}
        {changedItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-900">
                {changedItems.length} {t.changes}
              </span>
              <span className="text-sm text-green-600">
                ({selectedItems.size} {t.itemsSelected})
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllChanged}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                {t.selectAll}
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                {t.deselectAll}
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={resetChanges}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {t.resetChanges}
              </button>
            </div>
          </div>
        )}

        {/* Items Table */}
        {loading && items.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">{t.loadingItems}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{t.noItemsFound}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <input
                      type="checkbox"
                      checked={changedItems.length > 0 && changedItems.every(item => 
                        selectedItems.has(`${item.type}-${item.id}`)
                      )}
                      onChange={(e) => e.target.checked ? selectAllChanged() : deselectAll()}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.product}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.sku}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.currentStock}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    {t.newStock}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => {
                  const itemKey = `${item.type}-${item.id}`;
                  return (
                    <tr 
                      key={itemKey}
                      className={`hover:bg-slate-50 ${item.changed ? 'bg-green-50/50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(itemKey)}
                          onChange={() => toggleItemSelection(itemKey)}
                          disabled={!item.changed}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          {item.variantName && (
                            <p className="text-sm text-slate-500">{item.variantName}</p>
                          )}
                          <span className="inline-flex mt-1 items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                            {item.type === 'product' ? t.product : t.variant}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm">{item.sku}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-medium">{item.currentStock}</span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min="0"
                          value={item.newStock}
                          onChange={(e) => updateItemStock(itemKey, parseInt(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 border rounded text-sm font-mono text-center ${
                            item.changed 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-slate-200'
                          }`}
                        />
                        {item.changed && (
                          <div className="text-xs mt-1">
                            <span className={`font-medium ${
                              item.newStock > item.currentStock 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {item.newStock > item.currentStock ? '+' : ''}
                              {item.newStock - item.currentStock}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Update Form */}
        {changedItems.length > 0 && (
          <div className="mt-6 p-6 bg-slate-50 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.reason} *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={applyBulkUpdate}
                disabled={updating || selectedItems.size === 0 || !reason.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.updating}
                  </span>
                ) : (
                  `${t.updateSelected} (${selectedItems.size})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <ResultsModal />
    </div>
  );
}