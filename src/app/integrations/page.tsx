import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Code, Webhook, Database, Download, Zap, ShoppingCart, Package, Bell, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API & Integrations - MyShop",
  description: "Integrate MyShop with your existing systems using our REST API, webhooks, and product feeds",
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API & Integrations</h1>
              <p className="text-gray-600 mt-2">Connect MyShop to your business systems</p>
            </div>
            <Link href="/api/v1/docs">
              <Button variant="outline" className="gap-2">
                <Code className="w-4 h-4" />
                API Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Sprint S55: API & Webhooks Complete
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Integration Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sync inventory, automate order processing, and export product feeds. 
            Built for developers, designed for scale.
          </p>
        </div>

        {/* Key Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <Database className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">REST API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Full CRUD operations for products, orders, and inventory with pagination and filtering.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <Webhook className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Real-time notifications for order updates, inventory changes, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <Download className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Product Feeds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                JSON/XML feeds for Facebook Catalog, Google Merchant, and other marketplaces.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <Globe className="w-8 h-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">Marketplace Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pre-built integrations for major e-commerce platforms and marketplaces.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Inventory Management API
              </CardTitle>
              <CardDescription>
                Sync stock levels with your ERP, WMS, or POS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-mono text-sm text-gray-700 mb-2">GET /api/v1/inventory</h4>
                <p className="text-sm text-gray-600">List products with stock levels, low stock alerts, and variants</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Pagination</Badge>
                  <Badge variant="outline" className="text-xs">Filtering</Badge>
                  <Badge variant="outline" className="text-xs">Variants</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-mono text-sm text-gray-700 mb-2">POST /api/v1/inventory/bulk-update</h4>
                <p className="text-sm text-gray-600">Update multiple products' stock in a single request</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Bulk Operations</Badge>
                  <Badge variant="outline" className="text-xs">Stock History</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Orders API
              </CardTitle>
              <CardDescription>
                Retrieve and manage customer orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-mono text-sm text-gray-700 mb-2">GET /api/v1/orders</h4>
                <p className="text-sm text-gray-600">Fetch orders with customer details and status filtering</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Date Filters</Badge>
                  <Badge variant="outline" className="text-xs">Status Search</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-mono text-sm text-gray-700 mb-2">PUT /api/v1/orders/{"{"}"id{"}"}</h4>
                <p className="text-sm text-gray-600">Update order status and trigger webhooks</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Status Updates</Badge>
                  <Badge variant="outline" className="text-xs">Webhook Triggers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Events Section */}
        <Card className="shadow-lg border-0 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Webhook Events
            </CardTitle>
            <CardDescription>
              Real-time notifications for business-critical events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { event: "order.created", desc: "New order placed", color: "blue" },
                { event: "order.confirmed", desc: "Order confirmed by seller", color: "green" },
                { event: "order.shipped", desc: "Order shipped", color: "purple" },
                { event: "order.delivered", desc: "Order delivered", color: "green" },
                { event: "order.cancelled", desc: "Order cancelled", color: "red" },
                { event: "inventory.low_stock", desc: "Product below threshold", color: "orange" },
                { event: "inventory.out_of_stock", desc: "Product out of stock", color: "red" },
                { event: "product.updated", desc: "Product information changed", color: "blue" }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-sm font-mono text-gray-800">{item.event}</code>
                  <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">HMAC Signature Verification</h4>
              <p className="text-sm text-blue-700 mb-2">All webhooks include cryptographic signatures for security:</p>
              <code className="text-xs bg-blue-100 text-blue-800 p-2 rounded block">
                X-Webhook-Signature: sha256=a1b2c3d4...
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Product Feeds Section */}
        <Card className="shadow-lg border-0 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Product Data Feeds
            </CardTitle>
            <CardDescription>
              Export your catalog for marketplace integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Facebook Catalog Feed</h4>
                <p className="text-sm text-gray-600">
                  JSON format compatible with Facebook Business Manager for advertising and Instagram Shopping.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-sm text-gray-800">
                    /api/v1/feed/products.json?store=your-slug&key=your-key
                  </code>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Auto-sync</Badge>
                  <Badge variant="secondary" className="text-xs">Image URLs</Badge>
                  <Badge variant="secondary" className="text-xs">Inventory Status</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Google Merchant Feed</h4>
                <p className="text-sm text-gray-600">
                  XML format for Google Shopping ads and Google Merchant Center integration.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-sm text-gray-800">
                    /api/v1/feed/products.xml?store=your-slug&key=your-key
                  </code>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">Rich Snippets</Badge>
                  <Badge variant="secondary" className="text-xs">Structured Data</Badge>
                  <Badge variant="secondary" className="text-xs">SEO Friendly</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Examples */}
        <Card className="shadow-lg border-0 mb-12">
          <CardHeader>
            <CardTitle>Popular Integration Use Cases</CardTitle>
            <CardDescription>
              See how businesses use MyShop APIs to automate their operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "ERP Inventory Sync",
                  description: "Automatically sync stock levels between your ERP system and MyShop",
                  tech: ["SAP", "Oracle", "NetSuite"],
                  icon: <Database className="w-6 h-6 text-blue-600" />
                },
                {
                  title: "Multi-Channel Orders",
                  description: "Centralize orders from multiple marketplaces into one dashboard",
                  tech: ["Amazon", "eBay", "Facebook"],
                  icon: <ShoppingCart className="w-6 h-6 text-green-600" />
                },
                {
                  title: "Automated Fulfillment",
                  description: "Trigger shipping labels and tracking updates via webhooks",
                  tech: ["ShipStation", "FedEx", "DHL"],
                  icon: <Package className="w-6 h-6 text-purple-600" />
                }
              ].map((example, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    {example.icon}
                    <div>
                      <h4 className="font-semibold text-gray-900">{example.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{example.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {example.tech.map((tech, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="text-center py-12">
            <h3 className="text-2xl font-bold mb-4">Ready to Build Your Integration?</h3>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Get started with our comprehensive API documentation and start syncing your business systems today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/api/v1/docs">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Code className="w-5 h-5" />
                  View API Documentation
                </Button>
              </Link>
              <Link href="/dashboard/settings/api-keys">
                <Button size="lg" variant="outline" className="gap-2 border-white text-white hover:bg-white hover:text-blue-600">
                  <ArrowRight className="w-5 h-5" />
                  Generate API Key
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}