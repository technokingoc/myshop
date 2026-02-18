import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        message: orders.message,
        createdAt: orders.createdAt,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
        itemName: catalogItems.name,
        itemPrice: catalogItems.price,
      })
      .from(orders)
      .innerJoin(sellers, eq(orders.sellerId, sellers.id))
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.customerId, session.customerId))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Customer orders error:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
