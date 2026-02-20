// @ts-nocheck
import { getDb } from "./db";
import { reviewRequests, orders, users, stores, catalogItems } from "./schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendReviewRequestEmail } from "./email-service";

export interface ReviewRequestData {
  orderId: number;
  sellerId: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  delayDays: number;
  orderItems: Array<{
    productId: number;
    productName: string;
    productImage?: string;
  }>;
}

/**
 * Schedule a review request email after order delivery
 */
export async function scheduleReviewRequest(
  orderId: number,
  sellerId: number,
  customerId: number,
  delayDays: number = 3
): Promise<void> {
  const db = getDb();

  try {
    // Get order and customer details
    const [orderData] = await db
      .select({
        orderId: orders.id,
        customerName: orders.customerName,
        sellerId: orders.sellerId,
        // Get customer email from users table if they have an account
        customerEmail: users.email,
        // Fallback to contact info if no user account
        customerContact: orders.customerContact,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData) {
      console.error(`Order ${orderId} not found for review request scheduling`);
      return;
    }

    // Extract email from customer contact if no user email
    let customerEmail = orderData.customerEmail;
    if (!customerEmail && orderData.customerContact) {
      // Try to extract email from contact info (could be phone or email)
      const emailMatch = orderData.customerContact.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      if (emailMatch) {
        customerEmail = emailMatch[0];
      }
    }

    if (!customerEmail) {
      console.log(`No email found for order ${orderId}, skipping review request`);
      return;
    }

    // Calculate scheduled time
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + delayDays);

    // Get order items for the email (simplified - you might want to get actual order items)
    const orderItems: Array<{ productId: number; productName: string; productImage?: string }> = [];
    
    // For now, we'll leave this empty and populate it when sending
    // In a full implementation, you'd have an order_items table

    // Check if request already exists
    const [existing] = await db
      .select()
      .from(reviewRequests)
      .where(eq(reviewRequests.orderId, orderId))
      .limit(1);

    if (existing) {
      // Update existing request
      await db
        .update(reviewRequests)
        .set({
          scheduledAt,
          delayDays,
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(reviewRequests.orderId, orderId));
    } else {
      // Create new request
      await db
        .insert(reviewRequests)
        .values({
          orderId,
          sellerId,
          customerId,
          status: 'pending',
          delayDays,
          scheduledAt,
          customerEmail,
          customerName: orderData.customerName,
          orderItems,
        });
    }

    console.log(`Review request scheduled for order ${orderId} at ${scheduledAt.toISOString()}`);
  } catch (error) {
    console.error('Error scheduling review request:', error);
    throw error;
  }
}

/**
 * Process pending review requests (to be called by cron job)
 */
export async function processPendingReviewRequests(): Promise<void> {
  const db = getDb();

  try {
    // Get all pending requests that are due
    const pendingRequests = await db
      .select({
        id: reviewRequests.id,
        orderId: reviewRequests.orderId,
        sellerId: reviewRequests.sellerId,
        customerId: reviewRequests.customerId,
        customerEmail: reviewRequests.customerEmail,
        customerName: reviewRequests.customerName,
        orderItems: reviewRequests.orderItems,
        scheduledAt: reviewRequests.scheduledAt,
        // Store details
        storeName: stores.name,
        storeSlug: stores.slug,
        // Order details
        orderRef: sql<string>`'ORD-' || ${orders.id}`,
      })
      .from(reviewRequests)
      .leftJoin(stores, eq(reviewRequests.sellerId, stores.userId))
      .leftJoin(orders, eq(reviewRequests.orderId, orders.id))
      .where(
        and(
          eq(reviewRequests.status, 'pending'),
          lte(reviewRequests.scheduledAt, new Date())
        )
      );

    console.log(`Processing ${pendingRequests.length} pending review requests`);

    for (const request of pendingRequests) {
      try {
        // Get order items if not already stored
        let orderItems = request.orderItems || [];
        
        if (!orderItems || orderItems.length === 0) {
          // In a full implementation, you'd query order_items table here
          // For now, we'll create a placeholder
          orderItems = [{
            productId: 0,
            productName: "Your recent purchase",
            productImage: undefined,
          }];
        }

        // Send review request email
        await sendReviewRequestEmail(
          request.customerEmail,
          {
            customerName: request.customerName,
            storeName: request.storeName || "Store",
            orderRef: request.orderRef || `ORD-${request.orderId}`,
            orderItems,
            reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/stores/${request.storeSlug || request.sellerId}/reviews/write?order=${request.orderId}`,
          },
          "en" // You might want to detect customer language
        );

        // Mark as sent
        await db
          .update(reviewRequests)
          .set({
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(reviewRequests.id, request.id));

        console.log(`Review request sent for order ${request.orderId}`);

      } catch (error) {
        console.error(`Error sending review request for order ${request.orderId}:`, error);
        // Continue with other requests even if one fails
      }
    }

  } catch (error) {
    console.error('Error processing review requests:', error);
    throw error;
  }
}

/**
 * Mark review request as responded when customer leaves a review
 */
export async function markReviewRequestResponded(orderId: number, customerId: number): Promise<void> {
  const db = getDb();

  try {
    await db
      .update(reviewRequests)
      .set({
        status: 'responded',
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reviewRequests.orderId, orderId),
          eq(reviewRequests.customerId, customerId),
          eq(reviewRequests.status, 'sent')
        )
      );
  } catch (error) {
    console.error('Error marking review request as responded:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Get review request statistics for a seller
 */
export async function getReviewRequestStats(sellerId: number): Promise<{
  totalSent: number;
  totalResponded: number;
  responseRate: number;
  pending: number;
}> {
  const db = getDb();

  try {
    const [stats] = await db
      .select({
        totalSent: sql<number>`COUNT(CASE WHEN ${reviewRequests.status} = 'sent' THEN 1 END)`,
        totalResponded: sql<number>`COUNT(CASE WHEN ${reviewRequests.status} = 'responded' THEN 1 END)`,
        pending: sql<number>`COUNT(CASE WHEN ${reviewRequests.status} = 'pending' THEN 1 END)`,
      })
      .from(reviewRequests)
      .where(eq(reviewRequests.sellerId, sellerId));

    const totalSent = stats?.totalSent || 0;
    const totalResponded = stats?.totalResponded || 0;
    const responseRate = totalSent > 0 ? (totalResponded / totalSent) * 100 : 0;

    return {
      totalSent,
      totalResponded,
      responseRate: Math.round(responseRate * 10) / 10,
      pending: stats?.pending || 0,
    };

  } catch (error) {
    console.error('Error getting review request stats:', error);
    return {
      totalSent: 0,
      totalResponded: 0,
      responseRate: 0,
      pending: 0,
    };
  }
}

/**
 * Cancel pending review requests (e.g., if order is cancelled/refunded)
 */
export async function cancelReviewRequest(orderId: number): Promise<void> {
  const db = getDb();

  try {
    await db
      .update(reviewRequests)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reviewRequests.orderId, orderId),
          eq(reviewRequests.status, 'pending')
        )
      );
  } catch (error) {
    console.error('Error cancelling review request:', error);
    // Don't throw - this is not critical
  }
}