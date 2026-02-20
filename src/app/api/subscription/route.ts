import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, orders } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you'd get seller ID from session/auth
    // For now, we'll get it from the slug or session
    const sellerId = 1; // This should come from authentication
    
    const db = getDb();
    
    // Get seller info to get current plan
    const seller = await db
      .select({
        plan: sellers.plan,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);
      
    if (seller.length === 0) {
      return Response.json({ error: "Seller not found" }, { status: 404 });
    }
    
    const currentPlan = seller[0].plan || "free";
    
    // Get usage metrics
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count products
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .where(eq(catalogItems.sellerId, sellerId));
    
    // Count orders this month
    const orderCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          gte(orders.createdAt, firstOfMonth)
        )
      );
    
    // Mock subscription data - in a real app, this would come from a payment provider
    const subscriptionData = {
      currentPlan: currentPlan as "free" | "pro" | "business",
      status: "active" as const,
      nextBillingDate: currentPlan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      gracePeriodEnds: null,
      usage: {
        products: {
          current: productCount[0]?.count || 0,
          limit: currentPlan === "free" ? 10 : currentPlan === "pro" ? 100 : -1,
        },
        orders: {
          current: orderCount[0]?.count || 0,
          limit: currentPlan === "free" ? 50 : -1,
        },
      },
      paymentMethod: currentPlan === "free" ? null : {
        type: "Visa",
        last4: "4242",
      },
      invoices: currentPlan === "free" ? [] : [
        {
          id: "inv_1",
          amount: currentPlan === "pro" ? 19 : 49,
          status: "paid" as const,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: "/api/invoices/inv_1/download",
        },
      ],
    };
    
    return Response.json(subscriptionData);
  } catch (error) {
    console.error("Subscription API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}