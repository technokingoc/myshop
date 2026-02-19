import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications, orders } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const sellerId = session?.sellerId;
    
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const unreadOnly = url.searchParams.get("unread") === "true";

    const db = getDb();
    
    const filters = [eq(notifications.sellerId, Number(sellerId))];
    if (unreadOnly) {
      filters.push(eq(notifications.read, false));
    }

    const rows = await db
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
    const { type, title, message, orderId, customerId, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    
    const [notification] = await db
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

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const sellerId = session?.sellerId;
    
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, read } = body;

    if (!Array.isArray(ids) || typeof read !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const db = getDb();
    
    await db
      .update(notifications)
      .set({ read })
      .where(and(
        eq(notifications.sellerId, Number(sellerId)),
        // @ts-ignore - drizzle should handle this
        notifications.id.in(ids.map(id => Number(id)))
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}