import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const db = getDb();
    const body = await req.json();
    const { itemId, customerName, customerContact, message, quantity } = body;

    if (!customerName || !customerContact) {
      return NextResponse.json(
        { error: "customerName and customerContact are required" },
        { status: 400 }
      );
    }

    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.slug, slug));

    if (!seller) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const orderMessage = quantity && quantity > 1
      ? `Qty: ${quantity}. ${message || ""}`
      : message || "";

    const [row] = await db
      .insert(orders)
      .values({
        sellerId: seller.id,
        itemId: itemId ? Number(itemId) : null,
        customerName,
        customerContact,
        message: orderMessage,
        status: "new",
      })
      .returning();

    return NextResponse.json(
      {
        id: row.id,
        reference: `ORD-${row.id}`,
        status: row.status,
        createdAt: row.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Storefront order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
