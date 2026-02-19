import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";
import { checkLimit } from "@/lib/plans";
import { notifyLowStock, notifyOutOfStock } from "@/lib/notification-service";

function isDbUnavailable(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return text.includes("connect") || text.includes("timeout") || text.includes("econn") || text.includes("database");
}

function handleApiError(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" },
      { status: 503 },
    );
  }

  if (isDbUnavailable(error)) {
    return NextResponse.json({ error: "Database is unavailable", errorCode: "DB_UNAVAILABLE" }, { status: 503 });
  }

  return NextResponse.json({ error: "Database request failed", errorCode: "REQUEST_FAILED" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sellerId = req.nextUrl.searchParams.get("sellerId");
    const sellerSlug = req.nextUrl.searchParams.get("sellerSlug");

    if (sellerSlug) {
      const [seller] = await withRetry(() => db.select().from(sellers).where(eq(sellers.slug, sellerSlug)), 3);
      if (!seller) return NextResponse.json([]);
      const rows = await withRetry(() => db.select().from(catalogItems).where(eq(catalogItems.sellerId, seller.id)), 3);
      return NextResponse.json(rows);
    }

    if (sellerId) {
      const rows = await withRetry(() => db.select().from(catalogItems).where(eq(catalogItems.sellerId, Number(sellerId))), 3);
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "sellerId or sellerSlug required" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { 
      sellerId, name, type, price, status, imageUrl, shortDescription, category, imageUrls, 
      compareAtPrice, stockQuantity, trackInventory, lowStockThreshold, hasVariants 
    } = body;

    if (!sellerId || !name) {
      return NextResponse.json({ error: "sellerId and name required" }, { status: 400 });
    }

    // Enforce product limit based on seller plan
    const [seller] = await withRetry(
      () => db.select({ plan: sellers.plan }).from(sellers).where(eq(sellers.id, Number(sellerId))),
      3,
    );
    const [productCount] = await withRetry(
      () =>
        db
          .select({ count: sql<number>`count(*)` })
          .from(catalogItems)
          .where(eq(catalogItems.sellerId, Number(sellerId))),
      3,
    );
    const limitCheck = checkLimit(seller?.plan, "products", Number(productCount?.count ?? 0));
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Product limit reached",
          errorCode: "PLAN_LIMIT_REACHED",
          limit: limitCheck.limit,
          current: limitCheck.current,
          plan: seller?.plan || "free",
        },
        { status: 403 },
      );
    }

    const [row] = await withRetry(
      () =>
        db
          .insert(catalogItems)
          .values({
            sellerId: Number(sellerId),
            name,
            type: type || "Product",
            price: String(price || "0"),
            status: status || "Draft",
            imageUrl: imageUrl || "",
            imageUrls: imageUrls ? (typeof imageUrls === "string" ? imageUrls : JSON.stringify(imageUrls)) : "",
            shortDescription: shortDescription || "",
            category: category || "",
            compareAtPrice: compareAtPrice ? String(compareAtPrice) : "0",
            stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : -1,
            trackInventory: trackInventory || false,
            lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
            hasVariants: hasVariants || false,
          })
          .returning(),
      3,
    );

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const setObj: Record<string, unknown> = {};
    if (updates.name !== undefined) setObj.name = updates.name;
    if (updates.type !== undefined) setObj.type = updates.type;
    if (updates.price !== undefined) setObj.price = String(updates.price);
    if (updates.status !== undefined) setObj.status = updates.status;
    if (updates.imageUrl !== undefined) setObj.imageUrl = updates.imageUrl;
    if (updates.shortDescription !== undefined) setObj.shortDescription = updates.shortDescription;
    if (updates.category !== undefined) setObj.category = updates.category;
    if (updates.imageUrls !== undefined) setObj.imageUrls = typeof updates.imageUrls === "string" ? updates.imageUrls : JSON.stringify(updates.imageUrls);
    if (updates.compareAtPrice !== undefined) setObj.compareAtPrice = String(updates.compareAtPrice);
    if (updates.stockQuantity !== undefined) setObj.stockQuantity = Number(updates.stockQuantity);
    if (updates.trackInventory !== undefined) setObj.trackInventory = updates.trackInventory;
    if (updates.lowStockThreshold !== undefined) setObj.lowStockThreshold = Number(updates.lowStockThreshold);
    if (updates.hasVariants !== undefined) setObj.hasVariants = updates.hasVariants;

    const [row] = await withRetry(
      () => db.update(catalogItems).set(setObj).where(eq(catalogItems.id, Number(id))).returning(),
      3,
    );

    // Check for low stock notifications if stock quantity was updated
    if (updates.stockQuantity !== undefined && row.trackInventory) {
      const currentStock = Number(updates.stockQuantity);
      const threshold = row.lowStockThreshold;
      
      try {
        if (currentStock === 0) {
          await notifyOutOfStock(row.id, row.sellerId);
        } else if (currentStock <= threshold) {
          await notifyLowStock(row.id, row.sellerId, currentStock, threshold);
        }
      } catch (error) {
        // Don't fail the update if notifications fail
        console.error("Failed to send stock notifications:", error);
      }
    }

    return NextResponse.json(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await withRetry(() => db.delete(catalogItems).where(eq(catalogItems.id, Number(id))), 3);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
