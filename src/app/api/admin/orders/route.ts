import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const result = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      customerContact: orders.customerContact,
      message: orders.message,
      status: orders.status,
      createdAt: orders.createdAt,
      sellerId: orders.sellerId,
      sellerName: sellers.name,
      sellerSlug: sellers.slug,
      itemId: orders.itemId,
      itemName: catalogItems.name,
      itemPrice: catalogItems.price,
    })
    .from(orders)
    .leftJoin(sellers, sql`${orders.sellerId} = ${sellers.id}`)
    .leftJoin(catalogItems, sql`${orders.itemId} = ${catalogItems.id}`)
    .orderBy(sql`${orders.createdAt} DESC`);

  return NextResponse.json({ orders: result });
}
