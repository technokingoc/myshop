import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/docs - API Documentation for Integration Marketplace
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  
  const documentation = {
    name: "MyShop API",
    version: "1.0.0",
    description: "REST API for inventory sync, order management, and product feeds for MyShop marketplace integration",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://myshop-amber.vercel.app",
    
    authentication: {
      type: "API Key",
      description: "Include your API key in the X-API-Key header",
      header: "X-API-Key",
      example: "mk_1234567890abcdef...",
      howToGetKey: "Create an API key in your MyShop dashboard under Settings > API Keys"
    },

    rateLimiting: {
      default: "1000 requests per day per API key",
      headers: {
        remaining: "X-RateLimit-Remaining",
        reset: "X-RateLimit-Reset",
        limit: "X-RateLimit-Limit"
      }
    },

    endpoints: {
      inventory: {
        description: "Manage inventory levels and stock tracking",
        endpoints: [
          {
            method: "GET",
            path: "/api/v1/inventory",
            description: "List inventory with stock levels",
            parameters: {
              page: "Page number (default: 1)",
              limit: "Items per page (max: 100, default: 50)",
              low_stock: "Filter by low stock items (true/false)",
              out_of_stock: "Filter by out of stock items (true/false)",
              category: "Filter by product category",
              tracking_only: "Only show inventory-tracked products (true/false)",
              sort_by: "Sort field (name, stock_quantity, category, created_at)",
              sort_order: "Sort direction (asc, desc)"
            },
            permissions: ["inventory:read"],
            example_response: {
              data: [
                {
                  id: 123,
                  name: "Product Name",
                  category: "Electronics",
                  price: "99.99",
                  stockQuantity: 10,
                  lowStockThreshold: 5,
                  trackInventory: true,
                  hasVariants: false,
                  totalStock: 10,
                  lowStock: false,
                  outOfStock: false,
                  sellerId: 456,
                  sellerName: "Store Name"
                }
              ],
              pagination: {
                page: 1,
                limit: 50,
                total: 100,
                totalPages: 2,
                hasNext: true,
                hasPrev: false
              }
            }
          },
          {
            method: "POST",
            path: "/api/v1/inventory/bulk-update",
            description: "Bulk update stock levels",
            permissions: ["inventory:write"],
            body: {
              updates: [
                {
                  productId: 123,
                  variantId: null,
                  stockQuantity: 25,
                  lowStockThreshold: 5
                }
              ],
              reason: "Inventory sync from ERP system"
            },
            example_response: {
              message: "Bulk update completed",
              results: [],
              errors: [],
              summary: {
                total: 1,
                successful: 1,
                failed: 0
              }
            }
          }
        ]
      },
      
      orders: {
        description: "Retrieve and manage orders",
        endpoints: [
          {
            method: "GET",
            path: "/api/v1/orders",
            description: "List orders with filtering",
            parameters: {
              page: "Page number (default: 1)",
              limit: "Items per page (max: 100, default: 20)",
              status: "Filter by order status",
              customer_name: "Search by customer name",
              customer_contact: "Search by customer contact",
              date_from: "Start date (YYYY-MM-DD)",
              date_to: "End date (YYYY-MM-DD)",
              sort_by: "Sort field (created_at, customer_name, status)",
              sort_order: "Sort direction (asc, desc)"
            },
            permissions: ["orders:read"],
            example_response: {
              data: [
                {
                  id: "ord_123",
                  sellerId: 456,
                  customerName: "John Doe",
                  customerContact: "+258123456789",
                  status: "confirmed",
                  trackingToken: "track_123_abc",
                  createdAt: "2026-02-20T10:00:00Z",
                  productName: "Product Name",
                  productPrice: "99.99"
                }
              ]
            }
          },
          {
            method: "GET",
            path: "/api/v1/orders/{id}",
            description: "Get specific order details",
            permissions: ["orders:read"]
          },
          {
            method: "PUT",
            path: "/api/v1/orders/{id}",
            description: "Update order status (triggers webhooks)",
            permissions: ["orders:write"],
            body: {
              status: "shipped",
              notes: "Order shipped via FedEx",
              trackingNumber: "1234567890"
            }
          }
        ]
      },
      
      products: {
        description: "Product catalog management",
        endpoints: [
          {
            method: "GET",
            path: "/api/v1/products",
            description: "List products with filtering",
            parameters: {
              page: "Page number (default: 1)",
              limit: "Items per page (max: 100, default: 20)",
              status: "Filter by status (Draft, Published, etc.)",
              category: "Filter by category",
              name: "Search by product name",
              min_price: "Minimum price filter",
              max_price: "Maximum price filter",
              include_variants: "Include product variants (true/false)",
              sort_by: "Sort field (name, price, created_at)",
              sort_order: "Sort direction (asc, desc)"
            },
            permissions: ["products:read"]
          },
          {
            method: "POST",
            path: "/api/v1/products",
            description: "Create new product",
            permissions: ["products:write"],
            body: {
              name: "Product Name",
              price: "99.99",
              category: "Electronics",
              shortDescription: "Product description",
              stockQuantity: 100,
              trackInventory: true
            }
          },
          {
            method: "PUT",
            path: "/api/v1/products/{id}",
            description: "Update product",
            permissions: ["products:write"]
          }
        ]
      },
      
      feeds: {
        description: "Product data feeds for marketplaces",
        endpoints: [
          {
            method: "GET",
            path: "/api/v1/feed/products.json",
            description: "Facebook Catalog compatible JSON feed",
            parameters: {
              store: "Store slug (required)",
              key: "API key (required)"
            },
            authentication: "API key in query parameter",
            example_response: {
              version: "1.0",
              store: {
                name: "Store Name",
                slug: "store-slug",
                currency: "MZN"
              },
              generated_at: "2026-02-20T10:00:00Z",
              product_count: 100,
              data: [
                {
                  id: "123",
                  title: "Product Name",
                  description: "Product description",
                  availability: "in stock",
                  condition: "new",
                  price: "99.99 MZN",
                  link: "https://myshop.com/s/store-slug/products/123",
                  image_link: "https://myshop.com/product-image.jpg"
                }
              ]
            }
          },
          {
            method: "GET",
            path: "/api/v1/feed/products.xml",
            description: "Google Merchant Center compatible XML feed",
            parameters: {
              store: "Store slug (required)",
              key: "API key (required)"
            }
          }
        ]
      }
    },

    webhooks: {
      description: "Real-time notifications for order and inventory events",
      setup: {
        description: "Configure webhook endpoints in your MyShop dashboard",
        path: "Dashboard > Settings > Webhooks",
        authentication: "HMAC SHA-256 signature in X-Webhook-Signature header",
        retries: "Automatic retries with exponential backoff (max 3 attempts)"
      },
      events: [
        {
          event: "order.created",
          description: "New order placed",
          payload: {
            order_id: "ord_123",
            status: "placed",
            customer_name: "John Doe",
            tracking_token: "track_123_abc",
            created_at: "2026-02-20T10:00:00Z"
          }
        },
        {
          event: "order.confirmed",
          description: "Order confirmed by seller"
        },
        {
          event: "order.shipped",
          description: "Order marked as shipped"
        },
        {
          event: "order.delivered",
          description: "Order marked as delivered"
        },
        {
          event: "order.cancelled",
          description: "Order cancelled"
        },
        {
          event: "inventory.low_stock",
          description: "Product stock below threshold"
        },
        {
          event: "inventory.out_of_stock",
          description: "Product out of stock"
        }
      ],
      signature_verification: {
        description: "Verify webhook authenticity using HMAC signature",
        example_code: {
          node_js: `
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === \`sha256=\${computedSignature}\`;
}
          `.trim(),
          php: `
function verifyWebhook($payload, $signature, $secret) {
  $computed = 'sha256=' . hash_hmac('sha256', $payload, $secret);
  return hash_equals($signature, $computed);
}
          `.trim()
        }
      }
    },

    errors: {
      400: "Bad Request - Invalid parameters or missing required fields",
      401: "Unauthorized - Invalid or missing API key",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found - Resource does not exist",
      429: "Too Many Requests - Rate limit exceeded",
      500: "Internal Server Error - Server error occurred"
    },

    sdks: {
      description: "Official SDKs and libraries coming soon",
      planned: ["Node.js", "PHP", "Python", "Ruby"]
    },

    support: {
      documentation: `${process.env.NEXT_PUBLIC_BASE_URL || "https://myshop-amber.vercel.app"}/api/v1/docs`,
      github: "https://github.com/technokingoc/myshop",
      contact: "API support via GitHub issues"
    }
  };

  if (format === "html") {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyShop API Documentation</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2563eb; }
        h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        h3 { color: #374151; }
        code { background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9em; }
        pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        .endpoint { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
        .method { font-weight: bold; padding: 0.25rem 0.5rem; border-radius: 4px; color: white; }
        .get { background: #059669; }
        .post { background: #dc2626; }
        .put { background: #d97706; }
        .delete { background: #7c3aed; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <h1>MyShop API Documentation</h1>
    <p><strong>Version:</strong> ${documentation.version}</p>
    <p>${documentation.description}</p>
    
    <h2>Authentication</h2>
    <p>Include your API key in the <code>X-API-Key</code> header:</p>
    <pre>X-API-Key: mk_1234567890abcdef...</pre>
    <p>Create API keys in your MyShop dashboard under Settings → API Keys.</p>
    
    <h2>Rate Limiting</h2>
    <p>Default limit: ${documentation.rateLimiting.default}</p>
    
    <h2>Inventory API</h2>
    ${documentation.endpoints.inventory.endpoints.map(endpoint => `
        <div class="endpoint">
            <h3><span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span> ${endpoint.path}</h3>
            <p>${endpoint.description}</p>
            ${endpoint.parameters ? `
                <h4>Parameters:</h4>
                <ul>
                    ${Object.entries(endpoint.parameters).map(([key, desc]) => 
                        `<li><code>${key}</code>: ${desc}</li>`
                    ).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('')}
    
    <h2>Orders API</h2>
    ${documentation.endpoints.orders.endpoints.map(endpoint => `
        <div class="endpoint">
            <h3><span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span> ${endpoint.path}</h3>
            <p>${endpoint.description}</p>
        </div>
    `).join('')}
    
    <h2>Product Feeds</h2>
    <p>Export your product catalog for marketplace integration:</p>
    <ul>
        <li><strong>JSON Feed:</strong> <code>/api/v1/feed/products.json?store=your-slug&key=your-key</code></li>
        <li><strong>XML Feed:</strong> <code>/api/v1/feed/products.xml?store=your-slug&key=your-key</code></li>
    </ul>
    
    <h2>Webhooks</h2>
    <p>Set up webhook endpoints to receive real-time notifications:</p>
    <table>
        <thead>
            <tr><th>Event</th><th>Description</th></tr>
        </thead>
        <tbody>
            ${documentation.webhooks.events.map(event => 
                `<tr><td><code>${event.event}</code></td><td>${event.description}</td></tr>`
            ).join('')}
        </tbody>
    </table>
    
    <h2>Support</h2>
    <ul>
        <li><strong>Documentation:</strong> <a href="${documentation.support.documentation}">${documentation.support.documentation}</a></li>
        <li><strong>GitHub:</strong> <a href="${documentation.support.github}">${documentation.support.github}</a></li>
        <li><strong>Contact:</strong> ${documentation.support.contact}</li>
    </ul>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  // Default JSON response
  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}