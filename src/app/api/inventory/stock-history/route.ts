import { NextRequest, NextResponse } from "next/server";
import { getStockHistory } from "@/lib/inventory-service";
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const history = await getStockHistory({
      sellerId,
      productId: productId ? parseInt(productId) : undefined,
      variantId: variantId ? parseInt(variantId) : undefined,
      limit,
      offset,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Stock history API error:", error);
    return NextResponse.json(
      { error: "Failed to get stock history" },
      { status: 500 }
    );
  }
}