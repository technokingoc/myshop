import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, catalogItems, sellers, customers, users } from "@/lib/schema";
import { eq, and, desc, asc, gte, lte, ilike, sql } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";
import { sendOrderWebhook, WEBHOOK_EVENTS } from "@/lib/webhook-service";

// GET /api/v1/orders - List orders
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.ORDERS_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;
    
    const status = searchParams.get("status");
    const customerName = searchParams.get("customer_name");
    const customerContact = searchParams.get("customer_contact");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    const db = getDb();
    
    // Build conditions
    const conditions: any[] = [];
    
    // Filter by seller
    if (auth.sellerId) {
      conditions.push(eq(orders.sellerId, auth.sellerId));
    }
    
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    
    if (customerName) {
      conditions.push(ilike(orders.customerName, `%${customerName}%`));
    }
    
    if (customerContact) {
      conditions.push(ilike(orders.customerContact, `%${customerContact}%`));
    }
    
    if (dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    }
    
    if (dateTo) {
      conditions.push(lte(orders.createdAt, new Date(dateTo)));
    }

    // Determine sort order
    const orderBy = sortOrder === "asc" ? asc : desc;
    let sortColumn;
    switch (sortBy) {
      case "customer_name":
        sortColumn = orderBy(orders.customerName);
        break;
      case "status":
        sortColumn = orderBy(orders.status);
        break;
      default:
        sortColumn = orderBy(orders.createdAt);
    }

    // Get orders
    const ordersQuery = db
      .select({
        id: orders.id,
        sellerId: orders.sellerId,
        itemId: orders.itemId,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
        message: orders.message,
        status: orders.status,
        notes: orders.notes,
        statusHistory: orders.statusHistory,
        couponCode: orders.couponCode,
        discountAmount: orders.discountAmount,
        customerId: orders.customerId,
        trackingToken: orders.trackingToken,
        cancelReason: orders.cancelReason,
        refundReason: orders.refundReason,
        refundAmount: orders.refundAmount,
        shippingMethodId: orders.shippingMethodId,
        shippingCost: orders.shippingCost,
        shippingAddress: orders.shippingAddress,
        estimatedDelivery: orders.estimatedDelivery,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        // Join with product info
        productName: catalogItems.name,
        productPrice: catalogItems.price,
        productImage: catalogItems.imageUrl,
        // Join with seller info
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortColumn)
      .limit(limit)
      .offset(offset);

    const ordersList = await ordersQuery;

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: ordersList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/v1/orders - Create order (usually from webhook/external system)
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.ORDERS_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    const {
      itemId,
      customerName,
      customerContact,
      message = "",
      status = "placed",
      notes = "",
      couponCode = "",
      discountAmount = "0",
      customerId = null,
      shippingMethodId = null,
      shippingCost = "0",
      shippingAddress = null,
      estimatedDelivery = null,
      trackingNumber = "",
    } = body;

    // Validate required fields
    if (!customerName || !customerContact) {
      return NextResponse.json(
        { error: "Customer name and contact are required" },
        { status: 400 }
      );
    }

    // Validate itemId if provided
    if (itemId) {
      const db = getDb();
      const product = await db
        .select({ id: catalogItems.id })
        .from(catalogItems)
        .where(and(
          eq(catalogItems.id, itemId),
          eq(catalogItems.sellerId, auth.sellerId)
        ))
        .limit(1);

      if (!product.length) {
        return NextResponse.json(
          { error: "Product not found or not owned by seller" },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    
    // Generate tracking token
    const trackingToken = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create status history
    const statusHistory = [{
      status,
      at: new Date().toISOString(),
      note: "Order created via API"
    }];

    // Create order
    const orderResult = await db.insert(orders).values({
      sellerId: auth.sellerId,
      itemId,
      customerName,
      customerContact,
      message,
      status,
      notes,
      statusHistory,
      couponCode,
      discountAmount: discountAmount.toString(),
      customerId,
      trackingToken,
      shippingMethodId,
      shippingCost: shippingCost.toString(),
      shippingAddress,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      trackingNumber,
    }).returning({
      id: orders.id,
      customerName: orders.customerName,
      status: orders.status,
      trackingToken: orders.trackingToken,
      createdAt: orders.createdAt,
    });

    const order = orderResult[0];

    // Send webhook notification
    try {
      await sendOrderWebhook(auth.userId!, WEBHOOK_EVENTS.ORDER_CREATED, {
        order_id: order.id,
        status: order.status,
        customer_name: order.customerName,
        tracking_token: order.trackingToken,
        created_at: order.createdAt,
      });
    } catch (webhookError) {
      console.error("Failed to send webhook:", webhookError);
      // Don't fail the order creation if webhook fails
    }

    return NextResponse.json({
      data: order,
      message: "Order created successfully"
    }, { status: 201 });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}