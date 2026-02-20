import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, Plus, Settings, BarChart3, Activity, Clock, 
  Shield, AlertTriangle, CheckCircle, Copy, Trash2,
  Eye, EyeOff, RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Keys & Integration - MyShop Dashboard",
  description: "Manage API keys, monitor usage, and configure integrations for your MyShop store.",
};

export default function ApiKeysPage() {
  // This would normally come from server data
  const apiKeys = [
    {
      id: 1,
      name: "Inventory Sync",
      keyPrefix: "mk_live_abc123...",
      permissions: ["products:read", "products:write", "inventory:read", "inventory:write"],
      rateLimitPerDay: 10000,
      dailyUsageCount: 2847,
      usageCount: 156789,
      lastUsedAt: "2024-02-20T08:45:00Z",
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      expiresAt: null
    },
    {
      id: 2,
      name: "Order Webhooks",
      keyPrefix: "mk_live_def456...",
      permissions: ["orders:read", "webhooks:manage"],
      rateLimitPerDay: 5000,
      dailyUsageCount: 89,
      usageCount: 4532,
      lastUsedAt: "2024-02-20T09:12:00Z",
      isActive: true,
      createdAt: "2024-02-01T14:30:00Z",
      expiresAt: "2025-02-01T14:30:00Z"
    },
    {
      id: 3,
      name: "Analytics Dashboard",
      keyPrefix: "mk_test_ghi789...",
      permissions: ["products:read", "orders:read"],
      rateLimitPerDay: 1000,
      dailyUsageCount: 0,
      usageCount: 23,
      lastUsedAt: "2024-02-18T16:20:00Z",
      isActive: false,
      createdAt: "2024-02-10T11:15:00Z",
      expiresAt: null
    }
  ];

  const webhookStats = {
    totalEndpoints: 3,
    activeEndpoints: 2,
    deliveredToday: 127,
    failedToday: 2,
    successRate: 98.4
  };

  const usageStats = {
    requestsToday: 2936,
    dailyLimit: 16000,
    requestsThisMonth: 89432,
    topEndpoint: "/api/v1/products",
    peakHour: "14:00-15:00"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys & Integration</h1>
          <p className="text-muted-foreground mt-1">
            Manage API access, monitor usage, and configure webhooks for your store
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/developers" className="gap-2">
              <Settings className="h-4 w-4" />
              Documentation
            </Link>
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
                <p className="text-xs text-green-600">
                  {apiKeys.filter(k => k.isActive).length} active
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests Today</p>
                <p className="text-2xl font-bold">{usageStats.requestsToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  of {usageStats.dailyLimit.toLocaleString()} limit
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Webhook Success</p>
                <p className="text-2xl font-bold">{webhookStats.successRate}%</p>
                <p className="text-xs text-green-600">
                  {webhookStats.deliveredToday} delivered today
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Usage</p>
                <p className="text-2xl font-bold">{usageStats.peakHour}</p>
                <p className="text-xs text-muted-foreground">
                  Top: {usageStats.topEndpoint}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage authentication keys for API access
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div 
                    key={apiKey.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{apiKey.name}</h3>
                          <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                            {apiKey.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {apiKey.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                            {apiKey.keyPrefix}
                          </code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <p className="text-sm font-medium mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Usage</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(apiKey.dailyUsageCount / apiKey.rateLimitPerDay) * 100}
                            className="flex-1"
                          />
                          <span className="text-xs font-medium">
                            {apiKey.dailyUsageCount.toLocaleString()} / {apiKey.rateLimitPerDay.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                        <p className="text-lg font-semibold">{apiKey.usageCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Used</p>
                        <p className="text-lg font-semibold">
                          {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Usage Chart Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily API Usage
                </CardTitle>
                <CardDescription>
                  Requests over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  [Usage Chart Would Go Here]
                </div>
              </CardContent>
            </Card>

            {/* Top Endpoints Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Top Endpoints
                </CardTitle>
                <CardDescription>
                  Most frequently accessed endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { endpoint: "/api/v1/products", requests: 1247, percentage: 42.5 },
                    { endpoint: "/api/v1/inventory", requests: 892, percentage: 30.4 },
                    { endpoint: "/api/v1/orders", requests: 534, percentage: 18.2 },
                    { endpoint: "/api/v1/feed/products.json", requests: 263, percentage: 8.9 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <code className="text-sm">{item.endpoint}</code>
                          <span className="text-sm text-muted-foreground">
                            {item.requests.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Limiting Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rate Limiting Status
              </CardTitle>
              <CardDescription>
                Current rate limit consumption across all API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {apiKeys.filter(k => k.isActive).map((apiKey) => (
                  <div key={apiKey.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <div className="flex items-center gap-1">
                        {(apiKey.dailyUsageCount / apiKey.rateLimitPerDay) > 0.9 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress 
                        value={(apiKey.dailyUsageCount / apiKey.rateLimitPerDay) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{apiKey.dailyUsageCount.toLocaleString()}</span>
                        <span>{apiKey.rateLimitPerDay.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhook Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Webhook Status
                </CardTitle>
                <CardDescription>
                  Real-time webhook delivery metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {webhookStats.deliveredToday}
                    </div>
                    <div className="text-sm text-muted-foreground">Delivered Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {webhookStats.failedToday}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed Today</div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium">{webhookStats.successRate}%</span>
                  </div>
                  <Progress value={webhookStats.successRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Deliveries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Deliveries
                </CardTitle>
                <CardDescription>
                  Last 5 webhook delivery attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { event: "order.shipped", status: "success", time: "2 min ago" },
                    { event: "order.created", status: "success", time: "5 min ago" },
                    { event: "order.updated", status: "failed", time: "8 min ago" },
                    { event: "order.delivered", status: "success", time: "12 min ago" },
                    { event: "order.created", status: "success", time: "15 min ago" }
                  ].map((delivery, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="flex items-center gap-3">
                        {delivery.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <code className="text-sm">{delivery.event}</code>
                      </div>
                      <span className="text-xs text-muted-foreground">{delivery.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Endpoints */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>
                    Configure endpoints to receive real-time notifications
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Endpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Order Processing System",
                    url: "https://api.mystore.com/webhooks/orders",
                    events: ["order.created", "order.updated", "order.shipped"],
                    status: "active",
                    lastDelivery: "2024-02-20T09:12:00Z",
                    successRate: 99.2
                  },
                  {
                    name: "Analytics Dashboard",
                    url: "https://analytics.mystore.com/webhook",
                    events: ["order.delivered", "order.cancelled"],
                    status: "active",
                    lastDelivery: "2024-02-20T08:45:00Z",
                    successRate: 97.8
                  },
                  {
                    name: "Email Notifications",
                    url: "https://notifications.mystore.com/hook",
                    events: ["*"],
                    status: "inactive",
                    lastDelivery: "2024-02-18T14:20:00Z",
                    successRate: 94.1
                  }
                ].map((webhook, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{webhook.name}</h4>
                          <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                            {webhook.status}
                          </Badge>
                        </div>
                        <code className="text-sm text-muted-foreground">{webhook.url}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Success Rate</span>
                        <div className="font-semibold">{webhook.successRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Delivery</span>
                        <div className="font-semibold">
                          {new Date(webhook.lastDelivery).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Events</span>
                        <div className="font-semibold">{webhook.events.length}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}