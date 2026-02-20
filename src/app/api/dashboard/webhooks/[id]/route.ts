import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionFromCookie } from "@/lib/session";
import crypto from "crypto";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

// GET /api/dashboard/webhooks/[id] - Get webhook details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const webhookId = parseInt(params.id);
    
    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    // Fetch webhook details
    const webhook = await sql`
      SELECT 
        id, name, url, events, is_active, success_count, failure_count,
        last_delivery_at, last_delivery_status, max_retries, timeout_seconds,
        notes, created_at, updated_at
      FROM webhooks
      WHERE id = ${webhookId} AND (
        seller_id = ${session.sellerId} OR store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        )
      )
    `;

    if (!webhook.length) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const webhookData = webhook[0];

    // Get recent deliveries
    const recentDeliveries = await sql`
      SELECT 
        id, event_type, status, response_status, delivered_at, 
        created_at, retry_count
      FROM webhook_deliveries
      WHERE webhook_id = ${webhookId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: webhookData.id,
        name: webhookData.name,
        url: webhookData.url,
        events: webhookData.events,
        isActive: webhookData.is_active,
        successCount: webhookData.success_count,
        failureCount: webhookData.failure_count,
        lastDeliveryAt: webhookData.last_delivery_at,
        lastDeliveryStatus: webhookData.last_delivery_status,
        maxRetries: webhookData.max_retries,
        timeoutSeconds: webhookData.timeout_seconds,
        notes: webhookData.notes,
        createdAt: webhookData.created_at,
        updatedAt: webhookData.updated_at,
        recentDeliveries: recentDeliveries.map(delivery => ({
          id: delivery.id,
          eventType: delivery.event_type,
          status: delivery.status,
          responseStatus: delivery.response_status,
          deliveredAt: delivery.delivered_at,
          createdAt: delivery.created_at,
          retryCount: delivery.retry_count
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching webhook details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/webhooks/[id] - Update webhook
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const webhookId = parseInt(params.id);
    
    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate URL format if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    // Validate events if provided
    if (body.events) {
      if (!Array.isArray(body.events)) {
        return NextResponse.json(
          { error: "Events must be an array" },
          { status: 400 }
        );
      }

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
    }

    // Build update fields
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.url !== undefined) updateFields.url = body.url;
    if (body.events !== undefined) updateFields.events = JSON.stringify(body.events);
    if (body.isActive !== undefined) updateFields.is_active = body.isActive;
    if (body.maxRetries !== undefined) updateFields.max_retries = body.maxRetries;
    if (body.timeoutSeconds !== undefined) updateFields.timeout_seconds = body.timeoutSeconds;
    if (body.notes !== undefined) updateFields.notes = body.notes;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.updated_at = new Date();

    // Update webhook
    const fieldKeys = Object.keys(updateFields);
    const fieldValues = Object.values(updateFields);
    const setClause = fieldKeys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const result = await sql.query(
      `UPDATE webhooks 
       SET ${setClause}
       WHERE id = $1 AND (
         seller_id = $${fieldKeys.length + 2} OR store_id IN (
           SELECT id FROM stores WHERE user_id = $${fieldKeys.length + 2}
         )
       )
       RETURNING id, name, url, events, is_active, max_retries, timeout_seconds, notes`,
      [webhookId, ...fieldValues, session.sellerId]
    );

    if (!result.length) {
      return NextResponse.json(
        { error: "Webhook not found or update failed" },
        { status: 404 }
      );
    }

    const updatedWebhook = result[0];

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWebhook.id,
        name: updatedWebhook.name,
        url: updatedWebhook.url,
        events: updatedWebhook.events,
        isActive: updatedWebhook.is_active,
        maxRetries: updatedWebhook.max_retries,
        timeoutSeconds: updatedWebhook.timeout_seconds,
        notes: updatedWebhook.notes
      },
      message: "Webhook updated successfully"
    });

  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/webhooks/[id] - Delete webhook
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const webhookId = parseInt(params.id);
    
    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    // Delete webhook (cascade will handle deliveries)
    const result = await sql`
      DELETE FROM webhooks
      WHERE id = ${webhookId} AND (
        seller_id = ${session.sellerId} OR store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        )
      )
      RETURNING id, name
    `;

    if (!result.length) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Webhook "${result[0].name}" deleted successfully`
    });

  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/webhooks/[id] - Test webhook
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromCookie(request);
    
    if (!session?.sellerId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const webhookId = parseInt(params.id);
    
    if (isNaN(webhookId)) {
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 400 }
      );
    }

    // Get webhook details
    const webhook = await sql`
      SELECT id, name, url, secret, timeout_seconds
      FROM webhooks
      WHERE id = ${webhookId} AND (
        seller_id = ${session.sellerId} OR store_id IN (
          SELECT id FROM stores WHERE user_id = ${session.sellerId}
        )
      )
    `;

    if (!webhook.length) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const webhookData = webhook[0];

    // Create test payload
    const testPayload = {
      id: crypto.randomUUID(),
      event: "webhook.test",
      created: new Date().toISOString(),
      data: {
        message: "This is a test webhook from MyShop",
        webhook_id: webhookId,
        webhook_name: webhookData.name,
        timestamp: new Date().toISOString()
      }
    };

    const payloadString = JSON.stringify(testPayload);
    
    // Generate HMAC signature
    const signature = crypto
      .createHmac("sha256", webhookData.secret)
      .update(payloadString)
      .digest("hex");

    // Test the webhook
    try {
      const response = await fetch(webhookData.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "MyShop-Webhooks/1.0",
          "X-Webhook-Event": "webhook.test",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Id": webhookId.toString()
        },
        body: payloadString,
        signal: AbortSignal.timeout(webhookData.timeout_seconds * 1000)
      });

      const responseBody = await response.text();

      // Log test delivery
      await sql`
        INSERT INTO webhook_deliveries (
          webhook_id, event_type, event_data, url, http_method, 
          headers, body, response_status, response_body, response_headers,
          status, delivered_at
        ) 
        VALUES (
          ${webhookId}, 'webhook.test', ${JSON.stringify(testPayload.data)}, 
          ${webhookData.url}, 'POST', 
          ${JSON.stringify({
            "Content-Type": "application/json",
            "X-Webhook-Event": "webhook.test",
            "X-Webhook-Signature": `sha256=${signature}`
          })},
          ${payloadString}, ${response.status}, ${responseBody.substring(0, 10000)},
          ${JSON.stringify(Object.fromEntries(response.headers.entries()))},
          ${response.ok ? 'success' : 'failure'}, NOW()
        )
      `;

      return NextResponse.json({
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseBody.substring(0, 1000), // Limit response body
        message: response.ok 
          ? "Webhook test successful!" 
          : `Webhook test failed with status ${response.status}`
      });

    } catch (fetchError: any) {
      // Log test delivery failure
      await sql`
        INSERT INTO webhook_deliveries (
          webhook_id, event_type, event_data, url, http_method, 
          headers, body, response_body, status, delivered_at
        ) 
        VALUES (
          ${webhookId}, 'webhook.test', ${JSON.stringify(testPayload.data)}, 
          ${webhookData.url}, 'POST', 
          ${JSON.stringify({
            "Content-Type": "application/json",
            "X-Webhook-Event": "webhook.test"
          })},
          ${payloadString}, ${fetchError.message || 'Network error'}, 
          'failure', NOW()
        )
      `;

      return NextResponse.json({
        success: false,
        error: fetchError.message || 'Network error',
        message: "Webhook test failed due to network or server error"
      });
    }

  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}