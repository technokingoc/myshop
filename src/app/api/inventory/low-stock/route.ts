import { NextRequest, NextResponse } from "next/server";
import { getLowStockProducts } from "@/lib/inventory-service";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: "No seller ID found" }, { status: 400 });
    }

    const lowStockProducts = await getLowStockProducts(sellerId);
    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error("Get low stock products API error:", error);
    return NextResponse.json(
      { error: "Failed to get low stock products" },
      { status: 500 }
    );
  }
}