import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentFilters, users, stores } from "@/lib/schema";
import { eq, desc, and, or, sql, isNull } from "drizzle-orm";

// GET /api/admin/moderation/filters - Get content filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, parseInt((session as any).user.id)))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const filterType = searchParams.get("filterType");
    const enabled = searchParams.get("enabled");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    
    if (storeId === "global") {
      conditions.push(isNull(contentFilters.storeId));
    } else if (storeId && storeId !== "all") {
      conditions.push(eq(contentFilters.storeId, parseInt(storeId)));
    }
    
    if (filterType && filterType !== "all") {
      conditions.push(eq(contentFilters.filterType, filterType));
    }
    
    if (enabled !== null && enabled !== "all") {
      conditions.push(eq(contentFilters.enabled, enabled === "true"));
    }

    // Get filters with store info
    const filters = await db
      .select({
        id: contentFilters.id,
        storeId: contentFilters.storeId,
        name: contentFilters.name,
        enabled: contentFilters.enabled,
        filterType: contentFilters.filterType,
        patterns: contentFilters.patterns,
        caseSensitive: contentFilters.caseSensitive,
        wholeWordsOnly: contentFilters.wholeWordsOnly,
        action: contentFilters.action,
        replacement: contentFilters.replacement,
        severity: contentFilters.severity,
        matchCount: contentFilters.matchCount,
        lastMatch: contentFilters.lastMatch,
        createdAt: contentFilters.createdAt,
        updatedAt: contentFilters.updatedAt,
        
        // Store info (null for global filters)
        storeName: stores.name,
        storeSlug: stores.slug,
      })
      .from(contentFilters)
      .leftJoin(stores, eq(contentFilters.storeId, stores.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contentFilters.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentFilters)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = totalCountResult[0]?.count || 0;

    // Get filter statistics
    const stats = await db
      .select({
        filterType: contentFilters.filterType,
        count: sql<number>`count(*)`,
        activeCount: sql<number>`count(case when enabled = true then 1 end)`,
        totalMatches: sql<number>`sum(match_count)`,
      })
      .from(contentFilters)
      .groupBy(contentFilters.filterType);

    return NextResponse.json({
      filters,
      statistics: stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Error fetching content filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch content filters" },
      { status: 500 }
    );
  }
}

// POST /api/admin/moderation/filters - Create content filter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, parseInt((session as any).user.id)))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      storeId = null,
      name,
      enabled = true,
      filterType,
      patterns = [],
      caseSensitive = false,
      wholeWordsOnly = false,
      action = "flag",
      replacement = "[FILTERED]",
      severity = "medium",
    } = body;

    // Validate required fields
    if (!name || !filterType || !patterns || patterns.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, filterType, patterns" },
        { status: 400 }
      );
    }

    // Validate filter type
    const validFilterTypes = ["phone", "email", "url", "keyword", "regex"];
    if (!validFilterTypes.includes(filterType)) {
      return NextResponse.json(
        { error: "Invalid filterType. Must be one of: " + validFilterTypes.join(", ") },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ["flag", "block", "replace", "warn"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: " + validActions.join(", ") },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["low", "medium", "high"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: "Invalid severity. Must be one of: " + validSeverities.join(", ") },
        { status: 400 }
      );
    }

    // Test regex patterns if filterType is regex
    if (filterType === "regex") {
      for (const pattern of patterns) {
        try {
          new RegExp(pattern);
        } catch (error) {
          return NextResponse.json(
            { error: `Invalid regex pattern: ${pattern}` },
            { status: 400 }
          );
        }
      }
    }

    // Create filter
    const newFilter = await db
      .insert(contentFilters)
      .values({
        storeId: storeId ? parseInt(storeId) : null,
        name: name.trim(),
        enabled,
        filterType,
        patterns: patterns as any,
        caseSensitive,
        wholeWordsOnly,
        action,
        replacement: replacement.trim(),
        severity,
        matchCount: 0,
      } as any)
      .returning({
        id: contentFilters.id,
        name: contentFilters.name,
        filterType: contentFilters.filterType,
        enabled: contentFilters.enabled,
      });

    return NextResponse.json({
      message: "Content filter created successfully",
      filter: newFilter[0],
    });

  } catch (error) {
    console.error("Error creating content filter:", error);
    return NextResponse.json(
      { error: "Failed to create content filter" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/moderation/filters - Update content filter
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, parseInt((session as any).user.id)))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Filter ID is required" }, { status: 400 });
    }

    // Check if filter exists
    const existingFilter = await db
      .select({ id: contentFilters.id })
      .from(contentFilters)
      .where(eq(contentFilters.id, parseInt(id)))
      .limit(1);

    if (existingFilter.length === 0) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    // Validate patterns if provided
    if (updateData.patterns && updateData.filterType === "regex") {
      for (const pattern of updateData.patterns) {
        try {
          new RegExp(pattern);
        } catch (error) {
          return NextResponse.json(
            { error: `Invalid regex pattern: ${pattern}` },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateValues: any = {
      updatedAt: sql`NOW()`,
    };

    // Only update provided fields
    if (updateData.name !== undefined) updateValues.name = updateData.name.trim();
    if (updateData.enabled !== undefined) updateValues.enabled = updateData.enabled;
    if (updateData.patterns !== undefined) updateValues.patterns = JSON.stringify(updateData.patterns);
    if (updateData.caseSensitive !== undefined) updateValues.caseSensitive = updateData.caseSensitive;
    if (updateData.wholeWordsOnly !== undefined) updateValues.wholeWordsOnly = updateData.wholeWordsOnly;
    if (updateData.action !== undefined) updateValues.action = updateData.action;
    if (updateData.replacement !== undefined) updateValues.replacement = updateData.replacement.trim();
    if (updateData.severity !== undefined) updateValues.severity = updateData.severity;

    // Update filter
    await db
      .update(contentFilters)
      .set(updateValues)
      .where(eq(contentFilters.id, parseInt(id)));

    return NextResponse.json({
      message: "Content filter updated successfully",
    });

  } catch (error) {
    console.error("Error updating content filter:", error);
    return NextResponse.json(
      { error: "Failed to update content filter" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/moderation/filters - Delete content filter
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, parseInt((session as any).user.id)))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Filter ID is required" }, { status: 400 });
    }

    // Check if filter exists
    const existingFilter = await db
      .select({ id: contentFilters.id, name: contentFilters.name })
      .from(contentFilters)
      .where(eq(contentFilters.id, parseInt(id)))
      .limit(1);

    if (existingFilter.length === 0) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    // Delete filter
    await db
      .delete(contentFilters)
      .where(eq(contentFilters.id, parseInt(id)));

    return NextResponse.json({
      message: `Content filter "${existingFilter[0].name}" deleted successfully`,
    });

  } catch (error) {
    console.error("Error deleting content filter:", error);
    return NextResponse.json(
      { error: "Failed to delete content filter" },
      { status: 500 }
    );
  }
}