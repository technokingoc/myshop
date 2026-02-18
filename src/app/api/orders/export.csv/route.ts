import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, catalogItems } from "@/lib/schema";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { isMissingTableError } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";

function escapeCsv(value: unknown) {
  const safe = String(value ?? "").replaceAll('"', '""');
  return `"${safe}"`;
}

function dbErrorResponse(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json({ error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" }, { status: 503 });
  }

  return NextResponse.json({ error: "Database unavailable for CSV export", errorCode: "DB_UNAVAILABLE" }, { status: 503 });
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sellerId = req.nextUrl.searchParams.get("sellerId");
    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");

    if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

    const filters = [eq(orders.sellerId, Number(sellerId))];
    if (status && ["new", "contacted", "completed"].includes(status)) filters.push(eq(orders.status, status));
    if (q) {
      filters.push(or(ilike(orders.customerName, `%${q}%`), ilike(orders.customerContact, `%${q}%`), ilike(orders.message, `%${q}%`))!);
    }
    if (from) filters.push(gte(orders.createdAt, new Date(`${from}T00:00:00`)));
    if (to) filters.push(lte(orders.createdAt, new Date(`${to}T23:59:59`)));

    const rows = await withRetry(
      () =>
        db
          .select({
            id: orders.id,
            customerName: orders.customerName,
            customerContact: orders.customerContact,
            status: orders.status,
            createdAt: orders.createdAt,
            message: orders.message,
            itemName: catalogItems.name,
            itemType: catalogItems.type,
            itemPrice: catalogItems.price,
          })
          .from(orders)
          .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
          .where(and(...filters))
          .orderBy(desc(orders.createdAt)),
      3,
    );

    const headers = ["id", "customerName", "customerContact", "status", "createdAt", "message", "itemName", "itemType", "itemPrice"];
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.customerName,
          row.customerContact,
          row.status,
          row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
          row.message,
          row.itemName,
          row.itemType,
          row.itemPrice,
        ]
          .map(escapeCsv)
          .join(","),
      ),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=orders-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
