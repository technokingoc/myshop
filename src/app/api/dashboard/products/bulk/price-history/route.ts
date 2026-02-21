import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceHistory, bulkJobs, catalogItems } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

interface PriceHistoryEntry {
  id: string;
  jobId: string;
  productId: number;
  productName?: string;
  oldPrice: string;
  newPrice: string;
  changeType: 'percentage' | 'fixed' | 'set';
  changeAction: string;
  changeValue: string;
  canUndo: boolean;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get price history with job and product details
    const historyRecords = await db
      .select({
        historyId: priceHistory.id,
        jobId: priceHistory.jobId,
        productId: priceHistory.productId,
        productName: catalogItems.name,
        oldPrice: priceHistory.oldPrice,
        newPrice: priceHistory.newPrice,
        changeType: priceHistory.changeType,
        changeAction: priceHistory.changeAction,
        changeValue: priceHistory.changeValue,
        canUndo: priceHistory.canUndo,
        undoneAt: priceHistory.undoneAt,
        createdAt: priceHistory.createdAt,
        jobType: bulkJobs.jobType,
        jobStatus: bulkJobs.status
      })
      .from(priceHistory)
      .leftJoin(catalogItems, eq(priceHistory.productId, catalogItems.id))
      .leftJoin(bulkJobs, eq(priceHistory.jobId, bulkJobs.id))
      .where(eq(priceHistory.sellerId, sellerId))
      .orderBy(desc(priceHistory.createdAt))
      .limit(100);

    const historyEntries: PriceHistoryEntry[] = historyRecords.map(record => {
      const canUndo = record.canUndo && 
                      !record.undoneAt && 
                      isWithinUndoWindow(record.createdAt.toISOString());

      return {
        id: `${record.jobId}_${record.productId}`,
        jobId: record.jobId || '',
        productId: record.productId,
        productName: record.productName || 'Unknown Product',
        oldPrice: record.oldPrice,
        newPrice: record.newPrice,
        changeType: record.changeType as 'percentage' | 'fixed' | 'set',
        changeAction: record.changeAction,
        changeValue: record.changeValue,
        canUndo,
        createdAt: record.createdAt.toISOString()
      };
    });

    // Group by job for better display
    const groupedHistory = groupHistoryByJob(historyEntries);

    return NextResponse.json({
      history: groupedHistory.slice(0, 20) // Limit to last 20 jobs
    });

  } catch (error) {
    console.error("Failed to fetch price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}

function isWithinUndoWindow(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff <= 24; // 24 hour undo window
}

function groupHistoryByJob(entries: PriceHistoryEntry[]) {
  const jobGroups = new Map<string, {
    jobId: string;
    changeType: string;
    changeAction: string;
    changeValue: string;
    productCount: number;
    canUndo: boolean;
    createdAt: string;
    products: PriceHistoryEntry[];
  }>();

  for (const entry of entries) {
    if (!jobGroups.has(entry.jobId)) {
      jobGroups.set(entry.jobId, {
        jobId: entry.jobId,
        changeType: entry.changeType,
        changeAction: entry.changeAction,
        changeValue: entry.changeValue,
        productCount: 0,
        canUndo: entry.canUndo,
        createdAt: entry.createdAt,
        products: []
      });
    }

    const group = jobGroups.get(entry.jobId)!;
    group.products.push(entry);
    group.productCount = group.products.length;
    
    // Update canUndo to false if any product can't be undone
    if (!entry.canUndo) {
      group.canUndo = false;
    }
  }

  return Array.from(jobGroups.values());
}