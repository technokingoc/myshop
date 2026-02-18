import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email-service";

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

    // Fetch item name for email
    let itemName = "";
    if (row.itemId) {
      const [item] = await db.select({ name: catalogItems.name }).from(catalogItems).where(eq(catalogItems.id, row.itemId));
      if (item) itemName = item.name;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const orderDetails = {
      ref: `ORD-${row.id}`,
      customerName,
      items: itemName || undefined,
      trackUrl: `${baseUrl}/track/ORD-${row.id}`,
    };

    // Send confirmation to customer if contact is email
    if (customerContact.includes("@")) {
      await sendOrderConfirmation(customerContact, orderDetails).catch(() => {});
    }

    // Send alert to seller if they have email and notifications enabled
    if (seller.email) {
      await sendNewOrderAlert(seller.email, orderDetails).catch(() => {});
    }

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
