import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPaymentStatus } from "@/lib/dev-store";

function parseOrderId(token: string) {
  const match = token.match(/^(ORD|MS)-?(\d+)$/i);
  return match ? Number(match[2]) : 0;
}

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const orderId = parseOrderId(token);
  if (!orderId) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        itemName: catalogItems.name,
        sellerName: sellers.name,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(eq(orders.id, orderId));

    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const payment = await getPaymentStatus(orderId);

    return NextResponse.json({
      token,
      orderId,
      orderStatus: row.status,
      paymentStatus: payment?.status || "pending",
      createdAt: row.createdAt,
      itemName: row.itemName || "-",
      sellerName: row.sellerName || "MyShop seller",
      customerName: row.customerName,
    });
  } catch {
    return NextResponse.json({ error: "Could not load tracking info" }, { status: 503 });
  }
}
