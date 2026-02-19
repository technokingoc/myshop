import { getDb } from "./db";
import { notifications, users, stores, orders, catalogItems, customerReviews, productVariants } from "./schema";
import { eq, and, or, lt, sql } from "drizzle-orm";
import { emitEvent } from "./events";
import { 
  sendOrderConfirmation, 
  sendNewOrderAlert, 
  sendOrderStatusUpdate, 
  sendLowStockAlert,
  sendOutOfStockAlert,
  sendNewReviewAlert 
} from "./email-service";

export type NotificationType = 
  | "order:new" 
  | "order:status" 
  | "order:cancelled" 
  | "order:refunded"
  | "inventory:low_stock"
  | "inventory:out_of_stock"
  | "review:new"
  | "review:helpful";

export type NotificationPreferences = {
  email: {
    orderUpdates: boolean;
    inventoryAlerts: boolean;
    reviewAlerts: boolean;
    promotionalEmails: boolean;
  };
  inApp: {
    orderUpdates: boolean;
    inventoryAlerts: boolean;
    reviewAlerts: boolean;
    systemUpdates: boolean;
  };
  emailFrequency: "instant" | "daily" | "weekly";
};

export const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    orderUpdates: true,
    inventoryAlerts: true,
    reviewAlerts: true,
    promotionalEmails: false,
  },
  inApp: {
    orderUpdates: true,
    inventoryAlerts: true,
    reviewAlerts: true,
    systemUpdates: true,
  },
  emailFrequency: "instant",
};

async function createNotification(params: {
  sellerId?: number | null;
  customerId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: number | null;
  metadata?: Record<string, any>;
}) {
  const db = getDb();
  
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        sellerId: params.sellerId,
        customerId: params.customerId,
        type: params.type,
        title: params.title,
        message: params.message,
        orderId: params.orderId,
        metadata: params.metadata || {},
      })
      .returning();

    // Emit event for real-time updates
    if (params.sellerId) {
      emitEvent({
        type: params.type,
        sellerId: params.sellerId,
        message: params.message,
        payload: {
          notificationId: notification.id,
          orderId: params.orderId,
        },
      });
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function notifyOrderPlaced(orderId: number, sellerId: number, customerId?: number | null) {
  const db = getDb();
  
  try {
    // Get order details with seller info
    const [orderResult] = await db
      .select({
        order: orders,
        seller: stores,
        sellerUser: users,
      })
      .from(orders)
      .leftJoin(stores, eq(orders.sellerId, stores.userId))
      .leftJoin(users, eq(stores.userId, users.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult) return;

    const { order, seller, sellerUser } = orderResult;
    
    // Create in-app notification for seller
    await createNotification({
      sellerId,
      type: "order:new",
      title: "New Order Received",
      message: `Order ORD-${orderId} from ${order.customerName}`,
      orderId,
      metadata: {
        customerName: order.customerName,
        amount: "0", // You might want to calculate this from order items
      },
    });

    // Send email notifications if preferences allow
    if (sellerUser && seller?.emailNotifications) {
      await sendNewOrderAlert(
        sellerUser.email,
        {
          ref: `ORD-${orderId}`,
          customerName: order.customerName,
          sellerName: seller.name,
        },
        "en"
      );
    }

    // Send confirmation email to customer if we have their email
    if (customerId) {
      const [customer] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, customerId))
        .limit(1);

      if (customer) {
        await sendOrderConfirmation(
          customer.email,
          {
            ref: `ORD-${orderId}`,
            customerName: customer.name,
            sellerName: seller?.name || "Store",
            trackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.trackingToken}`,
          },
          "en"
        );
      }
    }

  } catch (error) {
    console.error("Failed to notify order placed:", error);
  }
}

export async function notifyOrderStatusChanged(
  orderId: number, 
  newStatus: string, 
  sellerId: number, 
  customerId?: number | null
) {
  const db = getDb();
  
  try {
    const [orderResult] = await db
      .select({
        order: orders,
        seller: stores,
      })
      .from(orders)
      .leftJoin(stores, eq(orders.sellerId, stores.userId))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult) return;

    const { order, seller } = orderResult;
    const statusLabels: Record<string, string> = {
      confirmed: "confirmed",
      processing: "being processed",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
      refunded: "refunded",
    };

    const statusMessage = statusLabels[newStatus] || newStatus;
    
    // Create notification for customer if they have an account
    if (customerId) {
      await createNotification({
        customerId,
        type: "order:status",
        title: `Order ORD-${orderId} Update`,
        message: `Your order is now ${statusMessage}`,
        orderId,
        metadata: {
          status: newStatus,
          sellerName: seller?.name,
        },
      });

      // Send email notification to customer
      const [customer] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, customerId))
        .limit(1);

      if (customer) {
        await sendOrderStatusUpdate(
          customer.email,
          `ORD-${orderId}`,
          newStatus,
          "en",
          `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.trackingToken}`
        );
      }
    }

  } catch (error) {
    console.error("Failed to notify order status change:", error);
  }
}

export async function notifyLowStock(productId: number, sellerId: number, currentStock: number, threshold: number) {
  const db = getDb();
  
  try {
    const [productResult] = await db
      .select({
        product: catalogItems,
        store: stores,
        user: users,
      })
      .from(catalogItems)
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .leftJoin(users, eq(stores.userId, users.id))
      .where(eq(catalogItems.id, productId))
      .limit(1);

    if (!productResult) return;

    const { product, store, user } = productResult;

    await createNotification({
      sellerId,
      type: "inventory:low_stock",
      title: "Low Stock Alert",
      message: `${product.name} is running low (${currentStock} left)`,
      metadata: {
        productId,
        productName: product.name,
        currentStock,
        threshold,
      },
    });

    // Send email notification if enabled
    if (user && store?.emailNotifications) {
      await sendLowStockAlert(
        user.email,
        product.name,
        currentStock,
        threshold,
        "en"
      );
    }

  } catch (error) {
    console.error("Failed to notify low stock:", error);
  }
}

export async function notifyOutOfStock(productId: number, sellerId: number) {
  const db = getDb();
  
  try {
    const [productResult] = await db
      .select({
        product: catalogItems,
        store: stores,
        user: users,
      })
      .from(catalogItems)
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .leftJoin(users, eq(stores.userId, users.id))
      .where(eq(catalogItems.id, productId))
      .limit(1);

    if (!productResult) return;

    const { product, store, user } = productResult;

    await createNotification({
      sellerId,
      type: "inventory:out_of_stock",
      title: "Out of Stock Alert",
      message: `${product.name} is now out of stock`,
      metadata: {
        productId,
        productName: product.name,
      },
    });

    // Send email notification if enabled
    if (user && store?.emailNotifications) {
      await sendOutOfStockAlert(
        user.email,
        product.name,
        "en"
      );
    }

  } catch (error) {
    console.error("Failed to notify out of stock:", error);
  }
}

export async function notifyNewReview(reviewId: number, sellerId: number) {
  const db = getDb();
  
  try {
    const [reviewResult] = await db
      .select({
        review: customerReviews,
        product: catalogItems,
        customer: users,
        store: stores,
        sellerUser: users,
      })
      .from(customerReviews)
      .leftJoin(catalogItems, eq(customerReviews.catalogItemId, catalogItems.id))
      .leftJoin(users, eq(customerReviews.customerId, users.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .leftJoin(users, eq(stores.userId, users.id))
      .where(eq(customerReviews.id, reviewId))
      .limit(1);

    if (!reviewResult) return;

    const { review, product, customer, store, sellerUser } = reviewResult;
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    await createNotification({
      sellerId,
      type: "review:new",
      title: "New Product Review",
      message: `${customer?.name || "A customer"} reviewed ${product?.name}: ${stars}`,
      metadata: {
        reviewId,
        productId: review.catalogItemId,
        productName: product?.name,
        rating: review.rating,
        customerName: customer?.name,
      },
    });

    // Send email notification if enabled
    if (sellerUser && store?.emailNotifications && product) {
      await sendNewReviewAlert(
        sellerUser.email,
        product.name,
        customer?.name || "A customer",
        review.rating,
        review.content,
        "en"
      );
    }

  } catch (error) {
    console.error("Failed to notify new review:", error);
  }
}

export async function getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
  const db = getDb();
  
  try {
    const [store] = await db
      .select({
        emailNotifications: stores.emailNotifications,
      })
      .from(stores)
      .where(eq(stores.userId, userId))
      .limit(1);

    if (!store) return defaultNotificationPreferences;

    // For now, return default with email preferences from store
    return {
      ...defaultNotificationPreferences,
      email: {
        ...defaultNotificationPreferences.email,
        orderUpdates: store.emailNotifications,
        inventoryAlerts: store.emailNotifications,
        reviewAlerts: store.emailNotifications,
      },
    };
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    return defaultNotificationPreferences;
  }
}

export async function updateNotificationPreferences(userId: number, preferences: Partial<NotificationPreferences>) {
  const db = getDb();
  
  try {
    // For now, just update the general email notifications setting in stores
    if (preferences.email?.orderUpdates !== undefined) {
      await db
        .update(stores)
        .set({ 
          emailNotifications: preferences.email.orderUpdates,
          updatedAt: new Date(),
        })
        .where(eq(stores.userId, userId));
    }

    return true;
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return false;
  }
}

// Background task to check for low stock
export async function checkLowStock() {
  const db = getDb();
  
  try {
    // Check main products
    const lowStockProducts = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        sellerId: catalogItems.sellerId,
        stockQuantity: catalogItems.stockQuantity,
        lowStockThreshold: catalogItems.lowStockThreshold,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.trackInventory, true),
          eq(catalogItems.status, "Published"),
          or(
            and(
              sql`${catalogItems.stockQuantity} <= ${catalogItems.lowStockThreshold}`,
              sql`${catalogItems.stockQuantity} > 0`
            ),
            eq(catalogItems.stockQuantity, 0)
          )
        )
      );

    for (const product of lowStockProducts) {
      if (product.stockQuantity === 0) {
        await notifyOutOfStock(product.id, product.sellerId);
      } else {
        await notifyLowStock(
          product.id, 
          product.sellerId, 
          product.stockQuantity, 
          product.lowStockThreshold
        );
      }
    }

    // Check product variants
    const lowStockVariants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        name: productVariants.name,
        stockQuantity: productVariants.stockQuantity,
        lowStockThreshold: productVariants.lowStockThreshold,
        product: catalogItems,
      })
      .from(productVariants)
      .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
      .where(
        and(
          eq(productVariants.active, true),
          eq(catalogItems.status, "Published"),
          or(
            and(
              sql`${productVariants.stockQuantity} <= ${productVariants.lowStockThreshold}`,
              sql`${productVariants.stockQuantity} > 0`
            ),
            eq(productVariants.stockQuantity, 0)
          )
        )
      );

    for (const variant of lowStockVariants) {
      if (variant.stockQuantity === 0) {
        await notifyOutOfStock(variant.productId, variant.product?.sellerId || 0);
      } else {
        await notifyLowStock(
          variant.productId,
          variant.product?.sellerId || 0,
          variant.stockQuantity,
          variant.lowStockThreshold
        );
      }
    }

  } catch (error) {
    console.error("Failed to check low stock:", error);
  }
}