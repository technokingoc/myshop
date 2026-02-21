import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, priceHistory, bulkJobs } from "@/lib/schema";
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

    // Get the price history records for this job
    const historyRecords = await db
      .select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.jobId, jobId),
        eq(priceHistory.sellerId, sellerId)
      ));

    if (historyRecords.length === 0) {
      return NextResponse.json(
        { error: "Price history not found" },
        { status: 404 }
      );
    }

    // Check if any record is already undone
    const alreadyUndone = historyRecords.some(record => record.undoneAt);
    if (alreadyUndone) {
      return NextResponse.json(
        { error: "This price change has already been undone" },
        { status: 400 }
      );
    }

    // Check if within undo window (24 hours) for the first record
    const firstRecord = historyRecords[0];
    const createdAt = firstRecord.createdAt;
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: "Undo window expired (24 hours maximum)" },
        { status: 400 }
      );
    }

    if (!firstRecord.canUndo) {
      return NextResponse.json(
        { error: "This price change cannot be undone" },
        { status: 400 }
      );
    }

    // Verify all products still belong to this seller
    const productIds = historyRecords.map(record => record.productId);
    const currentProducts = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.sellerId, sellerId),
        inArray(catalogItems.id, productIds)
      ));

    const currentProductIds = currentProducts.map(p => p.id);
    const missingProducts = productIds.filter(id => !currentProductIds.includes(id));
    
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
    const revertedCount = await revertPricesFromHistory(historyRecords);

    // Mark all records as undone
    await db
      .update(priceHistory)
      .set({
        undoneAt: new Date(),
        undoneBy: sellerId
      })
      .where(and(
        eq(priceHistory.jobId, jobId),
        eq(priceHistory.sellerId, sellerId)
      ));

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

async function revertPricesFromHistory(historyRecords: any[]) {
  let revertedCount = 0;

  for (const record of historyRecords) {
    try {
      await db
        .update(catalogItems)
        .set({ 
          price: record.oldPrice
        })
        .where(eq(catalogItems.id, record.productId));
      
      revertedCount++;
    } catch (error) {
      console.error(`Failed to revert price for product ${record.productId}:`, error);
      // Continue with other products even if one fails
    }
  }

  return revertedCount;
}