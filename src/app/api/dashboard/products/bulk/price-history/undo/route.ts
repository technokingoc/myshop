import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, platformSettings } from "@/lib/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Get the price history record
    const historyResult = await db
      .select({
        key: platformSettings.key,
        value: platformSettings.value
      })
      .from(platformSettings)
      .where(eq(platformSettings.key, `price_history_${jobId}`))
      .limit(1);

    if (historyResult.length === 0) {
      return NextResponse.json(
        { error: "Price history not found" },
        { status: 404 }
      );
    }

    const historyData = JSON.parse(historyResult[0].value || '{}');

    // Verify this belongs to the current seller
    if (historyData.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Unauthorized to undo this operation" },
        { status: 403 }
      );
    }

    // Check if within undo window (24 hours)
    const createdAt = new Date(historyData.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: "Undo window expired (24 hours maximum)" },
        { status: 400 }
      );
    }

    if (!historyData.canUndo) {
      return NextResponse.json(
        { error: "This price change cannot be undone" },
        { status: 400 }
      );
    }

    // Verify all products still belong to this seller
    const productIds = historyData.updates.map((u: any) => u.id);
    const currentProducts = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.sellerId, sellerId),
        inArray(catalogItems.id, productIds)
      ));

    const currentProductIds = currentProducts.map(p => p.id);
    const missingProducts = productIds.filter((id: number) => !currentProductIds.includes(id));
    
    if (missingProducts.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot undo: ${missingProducts.length} products no longer exist or don't belong to you`,
          missingProducts
        },
        { status: 400 }
      );
    }

    // Revert prices
    const revertedCount = await revertPrices(historyData.updates);

    // Mark as undone
    await db.execute(sql`
      UPDATE platform_settings 
      SET value = ${JSON.stringify({
        ...historyData,
        canUndo: false,
        undoneAt: new Date().toISOString(),
        undoneBy: sellerId
      })}
      WHERE key = ${`price_history_${jobId}`}
    `);

    return NextResponse.json({
      success: true,
      reverted: revertedCount,
      message: `Successfully reverted prices for ${revertedCount} products`
    });

  } catch (error) {
    console.error("Failed to undo price changes:", error);
    return NextResponse.json(
      { error: "Failed to undo price changes" },
      { status: 500 }
    );
  }
}

async function revertPrices(updates: Array<{ id: number; oldPrice: string; newPrice: string }>) {
  let revertedCount = 0;

  for (const update of updates) {
    try {
      await db
        .update(catalogItems)
        .set({ 
          price: update.oldPrice
        })
        .where(eq(catalogItems.id, update.id));
      
      revertedCount++;
    } catch (error) {
      console.error(`Failed to revert price for product ${update.id}:`, error);
      // Continue with other products even if one fails
    }
  }

  return revertedCount;
}