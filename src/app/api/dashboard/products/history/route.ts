import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers, stores } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const type = searchParams.get("type"); // 'import' or 'export'

    // Create history tables if they don't exist
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS import_history (
          id SERIAL PRIMARY KEY,
          seller_id INTEGER NOT NULL,
          import_type VARCHAR(64) NOT NULL DEFAULT 'products',
          filename VARCHAR(256) NOT NULL,
          record_count INTEGER DEFAULT 0,
          created_count INTEGER DEFAULT 0,
          updated_count INTEGER DEFAULT 0,
          error_count INTEGER DEFAULT 0,
          errors_file_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS export_history (
          id SERIAL PRIMARY KEY,
          seller_id INTEGER NOT NULL,
          export_type VARCHAR(64) NOT NULL DEFAULT 'products',
          filename VARCHAR(256) NOT NULL,
          record_count INTEGER DEFAULT 0,
          include_variants BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
    } catch (createError) {
      console.warn("History tables might already exist:", createError);
    }

    let historyData = [];
    let totalCount = 0;

    if (!type || type === 'import') {
      // Get import history
      const importHistory = await db.execute(sql`
        SELECT 
          id,
          'import' as activity_type,
          import_type as operation_type,
          filename,
          record_count,
          created_count,
          updated_count,
          error_count,
          errors_file_url,
          created_at
        FROM import_history 
        WHERE seller_id = ${sellerId}
        ORDER BY created_at DESC
        LIMIT ${type === 'import' ? limit : Math.floor(limit / 2)}
        OFFSET ${type === 'import' ? offset : 0}
      `);

      historyData.push(...importHistory.rows);

      if (type === 'import') {
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as total FROM import_history WHERE seller_id = ${sellerId}
        `);
        totalCount = parseInt(countResult.rows[0]?.total || '0');
      }
    }

    if (!type || type === 'export') {
      // Get export history
      const exportHistory = await db.execute(sql`
        SELECT 
          id,
          'export' as activity_type,
          export_type as operation_type,
          filename,
          record_count,
          0 as created_count,
          0 as updated_count,
          0 as error_count,
          null as errors_file_url,
          include_variants,
          created_at
        FROM export_history 
        WHERE seller_id = ${sellerId}
        ORDER BY created_at DESC
        LIMIT ${type === 'export' ? limit : Math.floor(limit / 2)}
        OFFSET ${type === 'export' ? offset : 0}
      `);

      historyData.push(...exportHistory.rows);

      if (type === 'export') {
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as total FROM export_history WHERE seller_id = ${sellerId}
        `);
        totalCount = parseInt(countResult.rows[0]?.total || '0');
      }
    }

    if (!type) {
      // Get combined count
      const importCountResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM import_history WHERE seller_id = ${sellerId}
      `);
      const exportCountResult = await db.execute(sql`
        SELECT COUNT(*) as total FROM export_history WHERE seller_id = ${sellerId}
      `);
      totalCount = parseInt(importCountResult.rows[0]?.total || '0') + parseInt(exportCountResult.rows[0]?.total || '0');
    }

    // Sort combined results by created_at
    historyData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Format the results
    const formattedHistory = historyData.slice(0, limit).map((item: any) => ({
      id: item.id,
      activityType: item.activity_type,
      operationType: item.operation_type,
      filename: item.filename,
      recordCount: parseInt(item.record_count || '0'),
      createdCount: parseInt(item.created_count || '0'),
      updatedCount: parseInt(item.updated_count || '0'),
      errorCount: parseInt(item.error_count || '0'),
      errorsFileUrl: item.errors_file_url,
      includeVariants: item.include_variants || false,
      createdAt: item.created_at,
      status: item.error_count > 0 ? 'completed_with_errors' : 'completed',
    }));

    return NextResponse.json({
      history: formattedHistory,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}