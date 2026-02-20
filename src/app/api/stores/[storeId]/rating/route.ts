import { NextRequest, NextResponse } from "next/server";
import { getStoreRating, calculateStoreRating } from "@/lib/store-rating-service";
import { stores } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const storeId = parseInt(resolvedParams.storeId);

    if (isNaN(storeId)) {
      return NextResponse.json({ error: "Invalid store ID" }, { status: 400 });
    }

    const db = getDb();

    // Get store and seller info
    const [store] = await db
      .select({
        id: stores.id,
        sellerId: stores.userId,
        name: stores.name,
        slug: stores.slug,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Try to get cached rating aggregate first
    let ratingData = await getStoreRating(store.sellerId);

    // If no cached data or data is old (more than 24 hours), recalculate
    if (!ratingData) {
      ratingData = await calculateStoreRating(store.sellerId);
    }

    return NextResponse.json({
      storeId,
      storeName: store.name,
      storeSlug: store.slug,
      rating: ratingData,
    });
  } catch (error) {
    console.error("Error fetching store rating:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const storeId = parseInt(resolvedParams.storeId);

    if (isNaN(storeId)) {
      return NextResponse.json({ error: "Invalid store ID" }, { status: 400 });
    }

    const db = getDb();

    // Get store and seller info
    const [store] = await db
      .select({
        id: stores.id,
        sellerId: stores.userId,
        name: stores.name,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Force recalculation of rating
    const ratingData = await calculateStoreRating(store.sellerId);

    return NextResponse.json({
      message: "Store rating recalculated successfully",
      storeId,
      storeName: store.name,
      rating: ratingData,
    });
  } catch (error) {
    console.error("Error recalculating store rating:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}