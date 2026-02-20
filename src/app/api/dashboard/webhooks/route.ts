import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { getSessionFromCookie } from "@/lib/session";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

// Generate a secure webhook secret
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/dashboard/webhooks - List webhooks for current store
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch webhooks for the seller's store
    const webhooks = await sql`
      SELECT 
        id, name, url, events, is_active, success_count, failure_count,
        last_delivery_at, last_delivery_status, max_retries, timeout_seconds,
        notes, created_at, updated_at
      FROM webhooks
      WHERE seller_id = ${session.sellerId} OR store_id IN (
        SELECT id FROM stores WHERE user_id = ${session.sellerId}
      )
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: webhooks.map(webhook => ({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.is_active,
        successCount: webhook.success_count,
        failureCount: webhook.failure_count,
        lastDeliveryAt: webhook.last_delivery_at,
        lastDeliveryStatus: webhook.last_delivery_status,
        maxRetries: webhook.max_retries,
        timeoutSeconds: webhook.timeout_seconds,
        notes: webhook.notes,
        createdAt: webhook.created_at,
        updatedAt: webhook.updated_at
      }))
    });

  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: "Missing required fields: name, url, events" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = [
      "*",
      "order.created",
      "order.paid", 
      "order.confirmed",
      "order.shipped",
      "order.delivered",
      "order.cancelled",
      "order.refunded",
      "order.updated",
      "inventory.low_stock",
      "inventory.out_of_stock",
      "product.created",
      "product.updated"
    ];
    
    const hasInvalidEvents = body.events.some((event: string) => 
      !validEvents.includes(event)
    );
    
    if (hasInvalidEvents) {
      return NextResponse.json(
        { error: "Invalid events. Valid options: " + validEvents.join(", ") },
        { status: 400 }
      );
    }

    // Check if seller has a store
    const storeResult = await sql`
      SELECT id FROM stores WHERE user_id = ${session.sellerId}
      UNION
      SELECT id FROM sellers WHERE id = ${session.sellerId} -- Legacy support
      LIMIT 1
    `;
    
    if (!storeResult.length) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeId = storeResult[0].id;
    
    // Generate webhook secret
    const secret = generateWebhookSecret();
    
    // Create webhook record
    const newWebhook = await sql`
      INSERT INTO webhooks (
        store_id, seller_id, user_id, name, url, events, secret,
        max_retries, timeout_seconds, is_active, notes
      )
      VALUES (
        ${storeId}, ${session.sellerId}, ${session.sellerId}, ${body.name}, 
        ${body.url}, ${JSON.stringify(body.events)}, ${secret},
        ${body.maxRetries || 3}, ${body.timeoutSeconds || 30}, 
        true, ${body.notes || ""}
      )
      RETURNING id, name, url, events, max_retries, timeout_seconds, 
                is_active, notes, created_at, secret
    `;

    if (!newWebhook.length) {
      return NextResponse.json(
        { error: "Failed to create webhook" },
        { status: 500 }
      );
    }

    const webhookData = newWebhook[0];

    return NextResponse.json({
      success: true,
      data: {
        id: webhookData.id,
        name: webhookData.name,
        url: webhookData.url,
        events: webhookData.events,
        secret: webhookData.secret, // Only returned once on creation!
        maxRetries: webhookData.max_retries,
        timeoutSeconds: webhookData.timeout_seconds,
        isActive: webhookData.is_active,
        notes: webhookData.notes,
        createdAt: webhookData.created_at,
        successCount: 0,
        failureCount: 0
      },
      message: "Webhook created successfully. Make sure to save the secret - you won't be able to see it again!"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}