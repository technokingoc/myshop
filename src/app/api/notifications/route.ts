import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications, orders } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const isCustomer = url.searchParams.get("customer") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const unreadOnly = url.searchParams.get("unread") === "true";

    const db = getDb();
    let filters: any[] = [];

    if (isCustomer) {
      // Handle customer notifications
      const customerSession = await getCustomerSession();
      const customerId = customerSession?.customerId;
      
      if (!customerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      filters = [eq(notifications.customerId, Number(customerId))];
    } else {
      // Handle seller notifications
      const session = await getSessionFromCookie();
      const sellerId = session?.sellerId;
      
      if (!sellerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      filters = [eq(notifications.sellerId, Number(sellerId))];
    }

    if (unreadOnly) {
      filters.push(eq(notifications.read, false));
    }

    // Try to get all fields, fallback to basic fields if new columns don't exist yet
    let rows;
    try {
      rows = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          orderId: notifications.orderId,
          read: notifications.read,
          metadata: notifications.metadata,
          actionUrl: notifications.actionUrl,
          priority: notifications.priority,
          notificationChannel: notifications.notificationChannel,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(and(...filters))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (dbError) {
      // Fallback for when new columns don't exist yet
      console.warn("Using basic notification fields (enhanced columns not available yet)");
      rows = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          orderId: notifications.orderId,
          read: notifications.read,
          metadata: notifications.metadata,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(and(...filters))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
      
      // Add default values for missing fields
      rows = rows.map(row => ({
        ...row,
        actionUrl: "",
        priority: 1,
        notificationChannel: "in_app",
      }));
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const sellerId = session?.sellerId;
    
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, message, orderId, customerId, metadata, actionUrl, priority, notificationChannel } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    
    // Try with new fields first, fallback to basic fields
    let notification;
    try {
      [notification] = await db
        .insert(notifications)
        .values({
          sellerId: Number(sellerId),
          customerId: customerId ? Number(customerId) : null,
          type,
          title,
          message,
          orderId: orderId ? Number(orderId) : null,
          metadata: metadata || {},
          actionUrl: actionUrl || "",
          priority: priority || 1,
          notificationChannel: notificationChannel || "in_app",
        })
        .returning();
    } catch (dbError) {
      // Fallback for when new columns don't exist yet
      console.warn("Creating notification with basic fields (enhanced columns not available yet)");
      [notification] = await db
        .insert(notifications)
        .values({
          sellerId: Number(sellerId),
          customerId: customerId ? Number(customerId) : null,
          type,
          title,
          message,
          orderId: orderId ? Number(orderId) : null,
          metadata: metadata || {},
        })
        .returning();
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, read } = body;

    if (!Array.isArray(ids) || typeof read !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Check both session types
    const sellerSession = await getSessionFromCookie();
    const customerSession = await getCustomerSession();
    
    if (!sellerSession?.sellerId && !customerSession?.customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Build where clause based on user type
    let whereClause;
    if (sellerSession?.sellerId) {
      whereClause = and(
        eq(notifications.sellerId, Number(sellerSession.sellerId)),
        // @ts-ignore - drizzle should handle this
        notifications.id.in(ids.map(id => Number(id)))
      );
    } else if (customerSession?.customerId) {
      whereClause = and(
        eq(notifications.customerId, Number(customerSession.customerId)),
        // @ts-ignore - drizzle should handle this
        notifications.id.in(ids.map(id => Number(id)))
      );
    }

    if (whereClause) {
      await db
        .update(notifications)
        .set({ read })
        .where(whereClause);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}