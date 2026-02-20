import crypto from "crypto";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);

interface WebhookEvent {
  type: string;
  data: Record<string, any>;
  storeId: number;
  orderId?: number;
  sellerId?: number;
}

interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  maxRetries: number;
  timeoutSeconds: number;
}

export class WebhookService {
  /**
   * Fire webhooks for a specific event
   */
  static async fireWebhooks(event: WebhookEvent): Promise<void> {
    try {
      console.log(`🔗 Firing webhooks for event: ${event.type}`, { storeId: event.storeId });

      // Find active webhooks for this store and event type
      const webhooks = await sql`
        SELECT id, name, url, events, secret, is_active, max_retries, timeout_seconds
        FROM webhooks
        WHERE (store_id = ${event.storeId} OR seller_id = ${event.sellerId || 0})
          AND is_active = true
          AND (${event.type} = ANY(events) OR '*' = ANY(events))
      `;

      if (!webhooks.length) {
        console.log(`📭 No active webhooks found for event ${event.type} in store ${event.storeId}`);
        return;
      }

      console.log(`📤 Found ${webhooks.length} webhook(s) to deliver`);

      // Fire each webhook
      for (const webhook of webhooks) {
        await this.deliverWebhook({
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret,
          isActive: webhook.is_active,
          maxRetries: webhook.max_retries,
          timeoutSeconds: webhook.timeout_seconds
        }, event);
      }

    } catch (error) {
      console.error("❌ Error firing webhooks:", error);
    }
  }

  /**
   * Deliver a single webhook
   */
  private static async deliverWebhook(webhook: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    try {
      console.log(`📨 Delivering webhook ${webhook.name} (${webhook.id}) to ${webhook.url}`);

      // Build payload
      const payload = {
        id: crypto.randomUUID(),
        event: event.type,
        created: new Date().toISOString(),
        data: event.data
      };

      const payloadString = JSON.stringify(payload);
      
      // Generate HMAC signature for security
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(payloadString)
        .digest("hex");

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "User-Agent": "MyShop-Webhooks/1.0",
        "X-Webhook-Event": event.type,
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Id": webhook.id.toString()
      };

      // Log delivery attempt
      const deliveryResult = await sql`
        INSERT INTO webhook_deliveries (
          webhook_id, event_type, event_data, url, http_method, 
          headers, body, status, created_at
        ) 
        VALUES (
          ${webhook.id}, ${event.type}, ${JSON.stringify(event.data)}, 
          ${webhook.url}, 'POST', ${JSON.stringify(headers)}, 
          ${payloadString}, 'pending', NOW()
        )
        RETURNING id
      `;

      const deliveryId = deliveryResult[0]?.id;

      try {
        // Make HTTP request
        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: payloadString,
          signal: AbortSignal.timeout(webhook.timeoutSeconds * 1000)
        });

        const responseBody = await response.text();
        
        // Update delivery log with response
        await sql`
          UPDATE webhook_deliveries
          SET 
            response_status = ${response.status},
            response_body = ${responseBody.substring(0, 10000)}, -- Limit response body size
            response_headers = ${JSON.stringify(Object.fromEntries(response.headers.entries()))},
            status = ${response.ok ? 'success' : 'failure'},
            delivered_at = NOW()
          WHERE id = ${deliveryId}
        `;

        // Update webhook stats
        if (response.ok) {
          await sql`
            UPDATE webhooks
            SET 
              success_count = success_count + 1,
              last_delivery_at = NOW(),
              last_delivery_status = 'success'
            WHERE id = ${webhook.id}
          `;
          console.log(`✅ Webhook delivered successfully: ${response.status}`);
        } else {
          await sql`
            UPDATE webhooks
            SET 
              failure_count = failure_count + 1,
              last_delivery_at = NOW(),
              last_delivery_status = 'failure'
            WHERE id = ${webhook.id}
          `;
          
          // Schedule retry if needed
          if (webhook.maxRetries > 0) {
            await this.scheduleRetry(deliveryId, 1, webhook.maxRetries);
          }
          
          console.log(`❌ Webhook delivery failed: ${response.status} ${response.statusText}`);
        }

      } catch (fetchError: any) {
        console.error(`❌ Webhook delivery error:`, fetchError);
        
        // Update delivery log with error
        await sql`
          UPDATE webhook_deliveries
          SET 
            status = 'failure',
            response_body = ${fetchError.message || 'Network error'},
            delivered_at = NOW()
          WHERE id = ${deliveryId}
        `;

        // Update webhook stats
        await sql`
          UPDATE webhooks
          SET 
            failure_count = failure_count + 1,
            last_delivery_at = NOW(),
            last_delivery_status = 'failure'
          WHERE id = ${webhook.id}
        `;
        
        // Schedule retry if needed
        if (webhook.maxRetries > 0) {
          await this.scheduleRetry(deliveryId, 1, webhook.maxRetries);
        }
      }

    } catch (error) {
      console.error(`❌ Error delivering webhook ${webhook.id}:`, error);
    }
  }

  /**
   * Schedule webhook retry
   */
  private static async scheduleRetry(deliveryId: number, retryCount: number, maxRetries: number): Promise<void> {
    if (retryCount > maxRetries) {
      console.log(`🚫 Max retries exceeded for delivery ${deliveryId}`);
      return;
    }

    // Exponential backoff: 2^retryCount minutes
    const delayMinutes = Math.pow(2, retryCount);
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    await sql`
      UPDATE webhook_deliveries
      SET 
        status = 'retry',
        retry_count = ${retryCount},
        next_retry_at = ${nextRetryAt.toISOString()}
      WHERE id = ${deliveryId}
    `;

    console.log(`⏰ Scheduled retry ${retryCount}/${maxRetries} for delivery ${deliveryId} at ${nextRetryAt.toISOString()}`);
  }

  /**
   * Process webhook retries (call this from a cron job)
   */
  static async processRetries(): Promise<void> {
    try {
      console.log("🔄 Processing webhook retries...");

      const retries = await sql`
        SELECT wd.*, w.url, w.secret, w.max_retries, w.timeout_seconds
        FROM webhook_deliveries wd
        JOIN webhooks w ON wd.webhook_id = w.id
        WHERE wd.status = 'retry' 
          AND wd.next_retry_at <= NOW()
          AND w.is_active = true
        ORDER BY wd.next_retry_at
        LIMIT 100
      `;

      console.log(`📨 Found ${retries.length} webhooks to retry`);

      for (const retry of retries) {
        try {
          // Re-attempt delivery
          const signature = crypto
            .createHmac("sha256", retry.secret)
            .update(retry.body)
            .digest("hex");

          const headers = {
            ...retry.headers,
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Retry": retry.retry_count.toString()
          };

          const response = await fetch(retry.url, {
            method: retry.http_method,
            headers,
            body: retry.body,
            signal: AbortSignal.timeout(retry.timeout_seconds * 1000)
          });

          const responseBody = await response.text();

          if (response.ok) {
            // Success - update delivery and webhook stats
            await sql`
              UPDATE webhook_deliveries
              SET 
                response_status = ${response.status},
                response_body = ${responseBody.substring(0, 10000)},
                response_headers = ${JSON.stringify(Object.fromEntries(response.headers.entries()))},
                status = 'success',
                delivered_at = NOW()
              WHERE id = ${retry.id}
            `;

            await sql`
              UPDATE webhooks
              SET 
                success_count = success_count + 1,
                last_delivery_at = NOW(),
                last_delivery_status = 'success'
              WHERE id = ${retry.webhook_id}
            `;

            console.log(`✅ Retry successful for delivery ${retry.id}`);
          } else {
            // Failed again
            if (retry.retry_count < retry.max_retries) {
              // Schedule another retry
              await this.scheduleRetry(retry.id, retry.retry_count + 1, retry.max_retries);
            } else {
              // Max retries exceeded
              await sql`
                UPDATE webhook_deliveries
                SET status = 'failure'
                WHERE id = ${retry.id}
              `;
            }
          }

        } catch (error) {
          console.error(`❌ Retry failed for delivery ${retry.id}:`, error);
          
          if (retry.retry_count < retry.max_retries) {
            await this.scheduleRetry(retry.id, retry.retry_count + 1, retry.max_retries);
          } else {
            await sql`
              UPDATE webhook_deliveries
              SET status = 'failure'
              WHERE id = ${retry.id}
            `;
          }
        }
      }

    } catch (error) {
      console.error("❌ Error processing webhook retries:", error);
    }
  }
}

// Export webhook event types
export const WEBHOOK_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded'
} as const;

// Legacy compatibility
export const OrderEvents = WEBHOOK_EVENTS;

/**
 * Send order webhook notification
 */
export async function sendOrderWebhook(
  userId: number,
  eventType: string,
  orderData: Record<string, any>
): Promise<void> {
  try {
    // Get seller/store ID from user
    const storeResult = await sql`
      SELECT s.id as store_id, sel.id as seller_id
      FROM stores s 
      LEFT JOIN sellers sel ON s.user_id = sel.id OR sel.user_id = ${userId}
      WHERE s.user_id = ${userId}
      LIMIT 1
    `;

    if (!storeResult.length) {
      console.log(`📭 No store found for user ${userId}, skipping webhook`);
      return;
    }

    const { store_id, seller_id } = storeResult[0];

    // Fire webhooks
    await WebhookService.fireWebhooks({
      type: eventType,
      data: orderData,
      storeId: store_id,
      sellerId: seller_id,
      orderId: orderData.order_id
    });

  } catch (error) {
    console.error("❌ Error sending order webhook:", error);
  }
}