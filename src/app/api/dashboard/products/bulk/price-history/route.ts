import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { like, desc } from "drizzle-orm";
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

    // Get all price history records for this seller
    const historyRecords = await db
      .select({
        key: platformSettings.key,
        value: platformSettings.value,
        updatedAt: platformSettings.updatedAt
      })
      .from(platformSettings)
      .where(like(platformSettings.key, 'price_history_%'))
      .orderBy(desc(platformSettings.updatedAt));

    const historyEntries: PriceHistoryEntry[] = [];

    for (const record of historyRecords) {
      try {
        const historyData = JSON.parse(record.value || '{}');
        
        // Filter records for this seller
        if (historyData.sellerId === sellerId) {
          const jobId = historyData.jobId;
          const createdAt = historyData.createdAt;
          const canUndo = historyData.canUndo && isWithinUndoWindow(createdAt);
          
          // Create entries for each product in this job
          for (const update of historyData.updates || []) {
            historyEntries.push({
              id: `${jobId}_${update.id}`,
              jobId,
              productId: update.id,
              productName: update.productName,
              oldPrice: update.oldPrice,
              newPrice: update.newPrice,
              changeType: historyData.changeType || 'fixed',
              changeAction: historyData.changeAction || 'set',
              changeValue: historyData.changeValue || '0',
              canUndo,
              createdAt
            });
          }
        }
      } catch (error) {
        console.error('Error parsing price history data:', error);
      }
    }

    // Sort by creation date, newest first
    historyEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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