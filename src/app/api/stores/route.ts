import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, comments } from "@/lib/schema";
import { eq, sql, ilike, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const sort = searchParams.get("sort") || "recent";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getDb();

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [];
    if (search) {
      conditions.push(ilike(sellers.name, `%${search}%`));
    }
    if (location) {
      conditions.push(eq(sellers.city, location));
    }
    // Exclude admin accounts from public listing
    conditions.push(sql`${sellers.role} != 'admin'`);

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    // Subquery for product count
    const productCountSq = db
      .select({
        sellerId: catalogItems.sellerId,
        count: sql<number>`count(*)`.as("product_count"),
      })
      .from(catalogItems)
      .where(eq(catalogItems.status, "Published"))
      .groupBy(catalogItems.sellerId)
      .as("pc");

    // Subquery for average rating
    const avgRatingSq = db
      .select({
        sellerId: comments.sellerId,
        avgRating: sql<number>`ROUND(AVG(${comments.rating})::numeric, 1)`.as("avg_rating"),
        reviewCount: sql<number>`count(*)`.as("review_count"),
      })
      .from(comments)
      .where(sql`${comments.rating} IS NOT NULL`)
      .groupBy(comments.sellerId)
      .as("ar");

    let orderBy;
    switch (sort) {
      case "popular":
        orderBy = desc(sql`COALESCE(${productCountSq.count}, 0)`);
        break;
      case "rating":
        orderBy = desc(sql`COALESCE(${avgRatingSq.avgRating}, 0)`);
        break;
      default:
        orderBy = desc(sellers.createdAt);
    }

    const query = db
      .select({
        id: sellers.id,
        slug: sellers.slug,
        name: sellers.name,
        description: sellers.description,
        city: sellers.city,
        logoUrl: sellers.logoUrl,
        bannerUrl: sellers.bannerUrl,
        businessType: sellers.businessType,
        createdAt: sellers.createdAt,
        productCount: sql<number>`COALESCE(${productCountSq.count}, 0)`,
        avgRating: sql<number>`COALESCE(${avgRatingSq.avgRating}, 0)`,
        reviewCount: sql<number>`COALESCE(${avgRatingSq.reviewCount}, 0)`,
      })
      .from(sellers)
      .leftJoin(productCountSq, eq(sellers.id, productCountSq.sellerId))
      .leftJoin(avgRatingSq, eq(sellers.id, avgRatingSq.sellerId))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const baseWhere = where ? [where] : [];
    if (category) {
      baseWhere.push(sql`EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.seller_id = ${sellers.id} AND ci.status = 'Published' AND ci.category = ${category})`);
    }

    const rows = baseWhere.length > 0
      ? await query.where(sql`${sql.join(baseWhere, sql` AND `)}`)
      : await query;

    return NextResponse.json({
      stores: rows,
    });
  } catch (error) {
    console.error("Stores API error:", error);
    return NextResponse.json({ error: "Failed to load stores" }, { status: 500 });
  }
}
