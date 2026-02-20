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
        statusHistory: orders.statusHistory,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        itemName: catalogItems.name,
        itemPrice: catalogItems.price,
        sellerName: sellers.name,
        sellerSocialLinks: sellers.socialLinks,
        sellerEmail: sellers.email,
        trackingNumber: orders.trackingNumber,
        estimatedDelivery: orders.estimatedDelivery,
        notes: orders.notes,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(eq(orders.id, orderId));

    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const payment = await getPaymentStatus(orderId);

    const socialLinks = (row.sellerSocialLinks || {}) as { whatsapp?: string };

    // Check if delivery has been confirmed (looking in notes for now)
    const deliveryConfirmed = row.notes?.includes('DELIVERY CONFIRMATION') || false;
    const deliveryConfirmedAt = deliveryConfirmed 
      ? row.statusHistory?.find(h => h.note?.includes('Delivery confirmed'))?.at || null
      : null;

    return NextResponse.json({
      token,
      orderId,
      orderStatus: row.status,
      paymentStatus: payment?.status || "pending",
      createdAt: row.createdAt,
      itemName: row.itemName || "-",
      itemPrice: row.itemPrice || null,
      sellerName: row.sellerName || "MyShop seller",
      sellerWhatsapp: socialLinks.whatsapp || null,
      sellerEmail: row.sellerEmail || null,
      customerName: row.customerName,
      statusHistory: row.statusHistory || [],
      trackingNumber: row.trackingNumber || null,
      trackingProvider: 'Correios de Moçambique', // Default for now
      trackingUrl: row.trackingNumber ? `https://www.correios.co.mz/track?code=${row.trackingNumber}` : null,
      estimatedDelivery: row.estimatedDelivery,
      deliveryConfirmed,
      deliveryConfirmedAt,
    });
  } catch {
    return NextResponse.json({ error: "Could not load tracking info" }, { status: 503 });
  }
}
