"use client";

import { useLanguage } from "@/lib/language";
import { 
  Package, 
  FileDown, 
  FileUp, 
  History,
  ArrowRight,
  Download,
  Upload,
  Settings,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ProductsPage() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Package className="h-8 w-8" />
          {t("navigation.products")}
        </h1>
        <p className="text-gray-600">
          Manage your product catalog with bulk import and export tools
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Products */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-blue-600" />
              {t("products.export.title")}
            </CardTitle>
            <CardDescription>
              {t("products.export.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="h-4 w-4" />
                CSV format with all product data
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Settings className="h-4 w-4" />
                Optional variant data export
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4" />
                Excel & Google Sheets compatible
              </div>
            </div>
            <Link href="/dashboard/products/export">
              <Button className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Export Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Import Products */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-green-600" />
              {t("products.import.title")}
            </CardTitle>
            <CardDescription>
              {t("products.import.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Upload className="h-4 w-4" />
                Bulk create and update products
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Settings className="h-4 w-4" />
                Column mapping & validation
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <History className="h-4 w-4" />
                Preview before importing
              </div>
            </div>
            <Link href="/dashboard/products/import">
              <Button className="w-full" variant="secondary">
                <FileUp className="h-4 w-4 mr-2" />
                Import Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats or Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and helpful links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/catalog">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                View All Products
              </Button>
            </Link>
            <Link href="/dashboard/products/export">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </Link>
            <Link href="/dashboard/inventory">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Manage Inventory
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}