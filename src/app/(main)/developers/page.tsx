import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, Webhook, Database, FileText, Zap, Shield, BarChart3, Globe, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Developer API Documentation - MyShop",
  description: "Comprehensive API documentation for MyShop - integrate products, orders, inventory, and webhooks with your applications.",
  keywords: "API, developers, integration, REST, webhooks, MyShop, e-commerce"
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              MyShop Developer API
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Build powerful integrations with our comprehensive REST API. Manage products, sync inventory, process orders, and receive real-time webhooks.
            </p>
            <div className="flex gap-4">
              <Link href="/dashboard/api-keys">
                <Button size="lg" className="gap-2">
                  <Key className="h-4 w-4" />
                  Get API Keys
                </Button>
              </Link>
              <Button variant="outline" size="lg" asChild>
                <a href="#quickstart" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Start
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm text-muted-foreground">API Endpoints</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Webhook className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Webhook Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Feed Formats</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8">
              <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="feeds">Feeds</TabsTrigger>
            </TabsList>

            {/* Quick Start Tab */}
            <TabsContent value="quickstart" id="quickstart">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Getting Started
                    </CardTitle>
                    <CardDescription>
                      Get up and running with the MyShop API in minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">1. Get Your API Key</h3>
                      <p className="text-muted-foreground mb-4">
                        Generate an API key from your dashboard with the permissions you need.
                      </p>
                      <Link href="/dashboard/api-keys">
                        <Button variant="outline" className="gap-2">
                          <Key className="h-4 w-4" />
                          Manage API Keys
                        </Button>
                      </Link>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">2. Authentication</h3>
                      <p className="text-muted-foreground mb-4">
                        Include your API key in the Authorization header or as an X-API-Key header:
                      </p>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <pre><code>{`# Using Authorization header
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://myshop.com/api/v1/products

# Using X-API-Key header  
curl -H "X-API-Key: YOUR_API_KEY" \\
     https://myshop.com/api/v1/products`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">3. Base URL</h3>
                      <p className="text-muted-foreground mb-2">All API requests should be made to:</p>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                        <code className="text-blue-700 dark:text-blue-300">
                          https://myshop-amber.vercel.app/api/v1
                        </code>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">4. Rate Limits</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
                          <div className="font-semibold text-green-800 dark:text-green-200">API Endpoints</div>
                          <div className="text-green-600 dark:text-green-400">100 requests/minute</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-md">
                          <div className="font-semibold text-orange-800 dark:text-orange-200">Feed Endpoints</div>
                          <div className="text-orange-600 dark:text-orange-400">10 requests/5 minutes</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Products API
                    </CardTitle>
                    <CardDescription>
                      Manage your product catalog programmatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* List Products */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">GET</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">List all products with pagination and filtering</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Query Parameters:</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div><code>page</code> - Page number (default: 1)</div>
                            <div><code>limit</code> - Items per page (default: 20, max: 100)</div>
                            <div><code>status</code> - Filter by status (Published, Draft)</div>
                            <div><code>category</code> - Filter by category</div>
                            <div><code>name</code> - Search by name</div>
                            <div><code>include_variants</code> - Include product variants (true/false)</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                          <pre><code>{`curl -H "X-API-Key: YOUR_API_KEY" \\
     "https://myshop.com/api/v1/products?limit=50&include_variants=true"`}</code></pre>
                        </div>
                      </div>
                    </div>

                    {/* Create Product */}
                    <div className="border-l-4 border-orange-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">POST</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Create a new product</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        <pre><code>{`{
  "name": "Premium T-Shirt",
  "price": "29.99",
  "category": "Clothing",
  "shortDescription": "High-quality cotton t-shirt",
  "stockQuantity": 100,
  "trackInventory": true,
  "status": "Published"
}`}</code></pre>
                      </div>
                    </div>

                    {/* Get Single Product */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">GET</Badge>
                        <code className="text-sm">/api/v1/products/{`{id}`}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Get a single product by ID</p>
                    </div>

                    {/* Update Product */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">PUT</Badge>
                        <code className="text-sm">/api/v1/products/{`{id}`}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Update an existing product</p>
                    </div>

                    {/* Delete Product */}
                    <div className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">DELETE</Badge>
                        <code className="text-sm">/api/v1/products/{`{id}`}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Delete a product</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Inventory API
                    </CardTitle>
                    <CardDescription>
                      Sync stock levels and manage inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Get Inventory */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">GET</Badge>
                        <code className="text-sm">/api/v1/inventory</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Get inventory levels for all products</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Query Parameters:</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div><code>low_stock</code> - Show only low stock items (true/false)</div>
                            <div><code>out_of_stock</code> - Show only out of stock items (true/false)</div>
                            <div><code>category</code> - Filter by category</div>
                            <div><code>tracking_only</code> - Show only inventory-tracked items</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Update Stock */}
                    <div className="border-l-4 border-orange-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">POST</Badge>
                        <code className="text-sm">/api/v1/inventory/bulk-update</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Bulk update stock levels</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        <pre><code>{`{
  "reason": "Weekly inventory sync",
  "updates": [
    {
      "productId": 123,
      "stockQuantity": 50,
      "lowStockThreshold": 5
    },
    {
      "productId": 124,
      "variantId": 456,
      "stockQuantity": 25
    }
  ]
}`}</code></pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Orders API
                    </CardTitle>
                    <CardDescription>
                      Access and manage order data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* List Orders */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">GET</Badge>
                        <code className="text-sm">/api/v1/orders</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">List orders with filtering and pagination</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Query Parameters:</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div><code>status</code> - Filter by status (placed, confirmed, shipped, delivered, cancelled)</div>
                            <div><code>customer_name</code> - Search by customer name</div>
                            <div><code>date_from</code> - Start date (ISO format)</div>
                            <div><code>date_to</code> - End date (ISO format)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Update Order */}
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">PUT</Badge>
                        <code className="text-sm">/api/v1/orders/{`{id}`}</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Update order status and details</p>
                      
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        <pre><code>{`{
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890",
  "statusNote": "Package dispatched via UPS"
}`}</code></pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>
                      Receive real-time notifications for order events
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Available Events</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                          <code className="text-green-700 dark:text-green-300">order.created</code>
                          <p className="text-sm text-muted-foreground mt-1">New order placed</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                          <code className="text-blue-700 dark:text-blue-300">order.updated</code>
                          <p className="text-sm text-muted-foreground mt-1">Order details changed</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                          <code className="text-purple-700 dark:text-purple-300">order.shipped</code>
                          <p className="text-sm text-muted-foreground mt-1">Order shipped</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-md">
                          <code className="text-orange-700 dark:text-orange-300">order.delivered</code>
                          <p className="text-sm text-muted-foreground mt-1">Order delivered</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                          <code className="text-red-700 dark:text-red-300">order.cancelled</code>
                          <p className="text-sm text-muted-foreground mt-1">Order cancelled</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Webhook Payload</h3>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                        <pre><code>{`{
  "id": "webhook_12345",
  "event": "order.shipped",
  "created": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": 12345,
    "status": "shipped",
    "previous_status": "confirmed",
    "customer_name": "John Doe",
    "tracking_token": "track_abc123",
    "tracking_number": "1Z999AA1234567890",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Security</h3>
                      <p className="text-muted-foreground mb-3">
                        All webhook payloads are signed with HMAC-SHA256. Verify the signature using the 
                        <code className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">X-Webhook-Signature</code> header.
                      </p>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        <pre><code>{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}</code></pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Retry Logic</h3>
                      <p className="text-muted-foreground mb-2">
                        Failed webhooks are automatically retried with exponential backoff:
                      </p>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div>• Retry 1: After 2 minutes</div>
                        <div>• Retry 2: After 4 minutes</div>
                        <div>• Retry 3: After 8 minutes</div>
                        <div>• Maximum 3 retries per webhook</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Feeds Tab */}
            <TabsContent value="feeds">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Product Feeds
                    </CardTitle>
                    <CardDescription>
                      Export your products for marketplace integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* JSON Feed */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Code className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold">JSON Feed</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Facebook Catalog compatible JSON format
                        </p>
                        <div className="bg-gray-900 text-gray-100 p-2 rounded text-xs mb-3">
                          <code>/api/v1/feed/products.json?store=STORE_SLUG&key=API_KEY</code>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/api/v1/feed/products.json?store=demo&key=demo" className="gap-2">
                            <Download className="h-3 w-3" />
                            Example
                          </a>
                        </Button>
                      </div>

                      {/* XML Feed */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold">XML Feed</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Google Shopping compatible RSS format
                        </p>
                        <div className="bg-gray-900 text-gray-100 p-2 rounded text-xs mb-3">
                          <code>/api/v1/feed/products.xml?store=STORE_SLUG&key=API_KEY</code>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/api/v1/feed/products.xml?store=demo&key=demo" className="gap-2">
                            <Download className="h-3 w-3" />
                            Example
                          </a>
                        </Button>
                      </div>

                      {/* CSV Feed */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold">CSV Feed</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Spreadsheet-friendly CSV format
                        </p>
                        <div className="bg-gray-900 text-gray-100 p-2 rounded text-xs mb-3">
                          <code>/api/v1/feed/products.csv?store=STORE_SLUG&key=API_KEY</code>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href="/api/v1/feed/products.csv?store=demo&key=demo" className="gap-2">
                            <Download className="h-3 w-3" />
                            Example
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">CSV Format Options</h3>
                      <p className="text-muted-foreground mb-3">
                        The CSV feed supports different format options via the <code>format</code> parameter:
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                          <div className="font-semibold text-blue-800 dark:text-blue-200">Standard</div>
                          <div className="text-sm text-muted-foreground">Comprehensive product data</div>
                          <code className="text-xs">format=standard</code>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                          <div className="font-semibold text-green-800 dark:text-green-200">Google</div>
                          <div className="text-sm text-muted-foreground">Google Shopping format</div>
                          <code className="text-xs">format=google</code>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                          <div className="font-semibold text-purple-800 dark:text-purple-200">Facebook</div>
                          <div className="text-sm text-muted-foreground">Facebook Catalog format</div>
                          <code className="text-xs">format=facebook</code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Support Section */}
          <div className="mt-16 text-center">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
                <p className="text-muted-foreground mb-6">
                  Our developer support team is here to help you integrate successfully.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <a href="mailto:dev-support@myshop.com">Contact Support</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/api-keys">Manage API Keys</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}