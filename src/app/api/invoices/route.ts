import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, you'd get seller ID from session/auth
    const sellerId = 1; // This should come from authentication
    
    const db = getDb();
    
    // Get seller info to check if they have a paid plan
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
    
    // Mock invoice data - in a real app, this would come from a payment provider or database
    const mockInvoices = currentPlan === "free" ? [] : [
      {
        id: "inv_1",
        number: "INV-2024-001",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: currentPlan === "pro" ? 19 : 49,
        currency: "USD",
        status: "paid" as const,
        description: `MyShop ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`,
        downloadUrl: "/api/invoices/inv_1/download",
        viewUrl: "/api/invoices/inv_1/view",
      },
      {
        id: "inv_2",
        number: "INV-2024-002",
        date: new Date().toISOString(),
        amount: currentPlan === "pro" ? 19 : 49,
        currency: "USD",
        status: "pending" as const,
        description: `MyShop ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`,
        downloadUrl: "/api/invoices/inv_2/download",
        viewUrl: "/api/invoices/inv_2/view",
      },
    ];
    
    return Response.json({ 
      invoices: mockInvoices,
      total: mockInvoices.length,
      plan: currentPlan
    });
  } catch (error) {
    console.error("Invoices API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}