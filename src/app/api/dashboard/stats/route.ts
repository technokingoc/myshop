import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, catalogItems, sellers } from "@/lib/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;

    const [statsResult] = await db
      .select({
        orderCount: sql<number>`count(*)`.as("order_count"),
        revenue: sql<string>`coalesce(sum(ci.price), 0)`.as("revenue"),
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.sellerId, sellerId));

    const [productResult] = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
        published: sql<number>`count(*) filter (where ${catalogItems.status} = 'Published')`.as("published"),
      })
      .from(catalogItems)
      .where(eq(catalogItems.sellerId, sellerId));

    const recentOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
        message: orders.message,
        itemId: orders.itemId,
        status: orders.status,
        createdAt: orders.createdAt,
        itemName: catalogItems.name,
        itemPrice: catalogItems.price,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.sellerId, sellerId))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // Get seller details for plan + onboarding
    const [sellerRow] = await db
      .select({
        plan: sellers.plan,
        logoUrl: sellers.logoUrl,
        bannerUrl: sellers.bannerUrl,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId));

    return NextResponse.json({
      orderCount: Number(statsResult?.orderCount ?? 0),
      revenue: parseFloat(String(statsResult?.revenue ?? "0")),
      productCount: Number(productResult?.total ?? 0),
      publishedCount: Number(productResult?.published ?? 0),
      storeViews: 0, // placeholder
      plan: sellerRow?.plan || "free",
      hasLogo: Boolean(sellerRow?.logoUrl),
      hasBanner: Boolean(sellerRow?.bannerUrl),
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
