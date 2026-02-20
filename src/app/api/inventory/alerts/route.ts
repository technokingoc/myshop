import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants, notifications } from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Get inventory-related notifications that are unread and recent
    const inventoryNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        metadata: notifications.metadata,
        read: notifications.read,
        createdAt: notifications.createdAt,
        priority: notifications.priority,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.sellerId, sellerId),
          eq(notifications.read, false),
          inArray(notifications.type, ["inventory:low_stock", "inventory:out_of_stock"])
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    // Transform notifications into alert format
    const alerts = inventoryNotifications.map((notification) => {
      const metadata = notification.metadata as any || {};
      
      // Determine alert type and severity
      let type: 'low_stock' | 'out_of_stock' | 'restock_due' = 'low_stock';
      let severity: 'high' | 'medium' | 'low' = 'medium';
      
      if (notification.type === 'inventory:out_of_stock') {
        type = 'out_of_stock';
        severity = 'high';
      } else if (notification.type === 'inventory:low_stock') {
        type = 'low_stock';
        severity = notification.priority === 3 ? 'high' : 
                   notification.priority === 2 ? 'medium' : 'low';
      }

      return {
        id: notification.id,
        type,
        productId: metadata.productId || 0,
        variantId: metadata.variantId || null,
        productName: metadata.productName || 'Unknown Product',
        variantName: metadata.variantName || null,
        currentStock: metadata.currentStock || 0,
        threshold: metadata.threshold || 5,
        severity,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
        status: 'active' as const, // Since we're only fetching unread notifications
      };
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });

  } catch (error) {
    console.error("Failed to get inventory alerts:", error);
    return NextResponse.json(
      { error: "Failed to get inventory alerts" },
      { status: 500 }
    );
  }
}