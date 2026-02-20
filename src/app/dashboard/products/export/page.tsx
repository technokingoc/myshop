"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { 
  Download, 
  FileDown, 
  Package, 
  History, 
  Settings,
  Info,
  CheckSquare,
  Square,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ExportHistory {
  id: number;
  activityType: 'export';
  operationType: string;
  filename: string;
  recordCount: number;
  includeVariants: boolean;
  createdAt: string;
  status: string;
}

export default function ProductExportPage() {
  const { t } = useLanguage();
  const toast = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  const [includeVariants, setIncludeVariants] = useState(false);
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response: any = await fetchJsonWithRetry("/api/dashboard/products/history?type=export&limit=10");
      setHistory(response.history || []);
    } catch (error) {
      console.error("Failed to load export history:", error);
      toast.error(t("products.export.historyLoadError"));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const url = `/api/dashboard/products/export?format=csv&includeVariants=${includeVariants}`;
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t("products.export.success"));

      // Refresh history
      setTimeout(() => {
        loadExportHistory();
      }, 1000);

    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("products.export.error"));
    } finally {
      setIsExporting(false);
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
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FileDown className="h-8 w-8" />
          {t("products.export.title")}
        </h1>
        <p className="text-gray-600">
          {t("products.export.description")}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("products.export.configuration")}
            </CardTitle>
            <CardDescription>
              {t("products.export.configurationDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Include Variants Option */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="includeVariants" className="text-sm font-medium">
                  {t("products.export.includeVariants")}
                </Label>
                <p className="text-sm text-gray-500">
                  {t("products.export.includeVariantsDescription")}
                </p>
              </div>
              <Switch
                id="includeVariants"
                checked={includeVariants}
                onCheckedChange={setIncludeVariants}
              />
            </div>

            {/* Export Format Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    {t("products.export.formatInfo")}
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t("products.export.formatInfoItem1")}</li>
                    <li>• {t("products.export.formatInfoItem2")}</li>
                    <li>• {t("products.export.formatInfoItem3")}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                size="lg"
                className="min-w-48"
              >
                <Download className="h-5 w-5 mr-2" />
                {isExporting ? t("common.exporting") : t("products.export.exportNow")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("products.export.history")}
            </CardTitle>
            <CardDescription>
              {t("products.export.historyDescription")}
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
                <p className="text-gray-500">{t("products.export.noHistory")}</p>
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
                          {t(`products.export.status.${item.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>{t("products.export.recordCount")}: {item.recordCount}</span>
                      <span>
                        {item.includeVariants ? (
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {t("products.export.withVariants")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Square className="h-3 w-3" />
                            {t("products.export.productsOnly")}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}