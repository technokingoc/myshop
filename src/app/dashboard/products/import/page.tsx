"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { 
  Upload, 
  FileUp, 
  Download,
  Settings,
  Info,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  History,
  PlayCircle,
  Package,
  Calendar,
  ArrowRight,
  AlertCircle,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportResult {
  success: boolean;
  errors: ImportError[];
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  preview?: any[];
}

interface ImportHistory {
  id: number;
  activityType: 'import';
  operationType: string;
  filename: string;
  recordCount: number;
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  errorsFileUrl?: string;
  createdAt: string;
  status: string;
}

const FIELD_MAPPING_OPTIONS = [
  { key: 'productId', label: 'Product ID', required: false },
  { key: 'name', label: 'Product Name', required: true },
  { key: 'type', label: 'Type', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'shortDescription', label: 'Short Description', required: false },
  { key: 'price', label: 'Price', required: true },
  { key: 'compareAtPrice', label: 'Compare At Price', required: false },
  { key: 'stockQuantity', label: 'Stock Quantity', required: false },
  { key: 'lowStockThreshold', label: 'Low Stock Threshold', required: false },
  { key: 'imageUrl', label: 'Image URL', required: false },
  { key: 'trackInventory', label: 'Track Inventory', required: false },
  { key: 'hasVariants', label: 'Has Variants', required: false },
];

export default function ProductImportPage() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetchJsonWithRetry("/api/dashboard/products/history?type=import&limit=10");
      setHistory(response.history || []);
    } catch (error) {
      console.error("Failed to load import history:", error);
      addToast({
        type: "error",
        message: t("products.import.historyLoadError"),
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      addToast({
        type: "error",
        message: t("products.import.invalidFileType"),
      });
      return;
    }

    setFile(selectedFile);
    parseCsvHeaders(selectedFile);
  };

  const parseCsvHeaders = async (file: File) => {
    try {
      const text = await file.text();
      const firstLine = text.split('\n')[0];
      const headers = firstLine.split(',').map(header => header.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);
      
      // Auto-map some common fields
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('name')) autoMapping.name = header;
        if (lowerHeader.includes('price') && !lowerHeader.includes('compare')) autoMapping.price = header;
        if (lowerHeader.includes('category')) autoMapping.category = header;
        if (lowerHeader.includes('description')) autoMapping.shortDescription = header;
        if (lowerHeader.includes('stock')) autoMapping.stockQuantity = header;
        if (lowerHeader.includes('image') && lowerHeader.includes('url')) autoMapping.imageUrl = header;
      });
      setMapping(autoMapping);
    } catch (error) {
      console.error("Failed to parse CSV headers:", error);
      addToast({
        type: "error",
        message: t("products.import.parseError"),
      });
    }
  };

  const handlePreview = async () => {
    if (!file || !validateMapping()) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('dryRun', 'true');

      const response = await fetch('/api/dashboard/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error("Preview failed:", error);
      addToast({
        type: "error",
        message: t("products.import.previewError"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validateMapping()) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('dryRun', 'false');

      const response = await fetch('/api/dashboard/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        addToast({
          type: "success",
          message: t("products.import.success", {
            created: result.created,
            updated: result.updated,
          }),
        });
        
        // Reset form
        setFile(null);
        setCsvHeaders([]);
        setMapping({});
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refresh history
        loadImportHistory();
      } else {
        addToast({
          type: "error",
          message: t("products.import.error"),
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
      addToast({
        type: "error",
        message: t("products.import.error"),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validateMapping = () => {
    const requiredFields = FIELD_MAPPING_OPTIONS.filter(f => f.required);
    const missingFields = requiredFields.filter(field => !mapping[field.key]);
    
    if (missingFields.length > 0) {
      addToast({
        type: "error",
        message: t("products.import.missingRequiredFields", {
          fields: missingFields.map(f => f.label).join(', ')
        }),
      });
      return false;
    }
    
    return true;
  };

  const downloadTemplate = async () => {
    try {
      const url = `/api/dashboard/products/import?includeVariants=false`;
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast({
        type: "success",
        message: t("products.import.templateDownloaded"),
      });
    } catch (error) {
      console.error("Template download failed:", error);
      addToast({
        type: "error",
        message: t("products.import.templateError"),
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'completed_with_errors': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileUp className="h-8 w-8" />
          {t("products.import.title")}
        </h1>
        <p className="text-gray-600">
          {t("products.import.description")}
        </p>
      </div>

      <div className="grid gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("products.import.uploadFile")}
            </CardTitle>
            <CardDescription>
              {t("products.import.uploadDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-dashed"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>{file ? file.name : t("products.import.selectFile")}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t("products.import.fileFormat")}
                  </p>
                </div>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Button variant="ghost" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                {t("products.import.downloadTemplate")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Column Mapping */}
        {csvHeaders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t("products.import.columnMapping")}
              </CardTitle>
              <CardDescription>
                {t("products.import.columnMappingDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {FIELD_MAPPING_OPTIONS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`mapping-${field.key}`} className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select 
                      value={mapping[field.key] || ''} 
                      onValueChange={(value) => setMapping(prev => ({ ...prev, [field.key]: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("products.import.selectColumn")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t("products.import.noMapping")}</SelectItem>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 justify-center">
                <Button 
                  onClick={handlePreview} 
                  variant="outline"
                  disabled={isUploading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isUploading ? t("common.loading") : t("products.import.preview")}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !file}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {isImporting ? t("common.importing") : t("products.import.import")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Result */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {t("products.import.results")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.processed}</div>
                  <div className="text-sm text-blue-800">{t("products.import.processed")}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                  <div className="text-sm text-green-800">{t("products.import.created")}</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.updated}</div>
                  <div className="text-sm text-yellow-800">{t("products.import.updated")}</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                  <div className="text-sm text-red-800">{t("products.import.errors")}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    {t("products.import.errorDetails")}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <strong>{t("products.import.row")} {error.row}:</strong> {error.message}
                        {error.value && (
                          <span className="text-gray-600"> ({error.value})</span>
                        )}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        {t("products.import.moreErrors", { count: importResult.errors.length - 10 })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("products.import.history")}
            </CardTitle>
            <CardDescription>
              {t("products.import.historyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">{t("common.loading")}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t("products.import.noHistory")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{item.filename}</span>
                        <Badge className={getStatusColor(item.status)}>
                          {t(`products.import.status.${item.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>{t("products.import.recordCount")}: {item.recordCount}</span>
                      <span className="text-green-600">{t("products.import.created")}: {item.createdCount}</span>
                      <span className="text-yellow-600">{t("products.import.updated")}: {item.updatedCount}</span>
                      {item.errorCount > 0 && (
                        <span className="text-red-600">{t("products.import.errors")}: {item.errorCount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("products.import.previewResults")}</DialogTitle>
            <DialogDescription>
              {t("products.import.previewDescription")}
            </DialogDescription>
          </DialogHeader>
          
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="font-bold text-blue-600">{importResult.processed}</div>
                  <div className="text-xs text-blue-800">{t("products.import.processed")}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="font-bold text-green-600">{importResult.created}</div>
                  <div className="text-xs text-green-800">{t("products.import.toCreate")}</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="font-bold text-yellow-600">{importResult.updated}</div>
                  <div className="text-xs text-yellow-800">{t("products.import.toUpdate")}</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="font-bold text-red-600">{importResult.errors.length}</div>
                  <div className="text-xs text-red-800">{t("products.import.errors")}</div>
                </div>
              </div>

              {importResult.preview && importResult.preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{t("products.import.previewData")}</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResult.preview.map((item, index) => (
                      <div key={index} className="p-3 border rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={item.action === 'create' ? 'default' : 'secondary'}>
                            {t(`products.import.${item.action}`)}
                          </Badge>
                          <span className="font-medium">{item.data.name}</span>
                        </div>
                        <div className="text-gray-600 text-xs">
                          {t("products.import.price")}: {item.data.price} | 
                          {t("products.import.category")}: {item.data.category || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}