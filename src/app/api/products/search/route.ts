import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, comments } from "@/lib/schema";
import { eq, sql, ilike, and, gte, lte, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "recent";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getDb();

    const conditions: ReturnType<typeof eq>[] = [
      eq(catalogItems.status, "Published"),
      sql`${sellers.role} != 'admin'`,
    ];

    if (q) {
      conditions.push(
        sql`(${ilike(catalogItems.name, `%${q}%`)} OR ${ilike(catalogItems.shortDescription, `%${q}%`)})`
      );
    }
    if (category) {
      conditions.push(eq(catalogItems.category, category));
    }
    if (minPrice) {
      conditions.push(gte(catalogItems.price, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(catalogItems.price, maxPrice));
    }

    const where = sql`${sql.join(conditions, sql` AND `)}`;

    // Subquery for seller avg rating
    const avgRatingSq = db
      .select({
        sellerId: comments.sellerId,
        avgRating: sql<number>`ROUND(AVG(${comments.rating})::numeric, 1)`.as("avg_rating"),
      })
      .from(comments)
      .where(sql`${comments.rating} IS NOT NULL`)
      .groupBy(comments.sellerId)
      .as("ar");

    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = asc(catalogItems.price);
        break;
      case "price_desc":
        orderBy = desc(catalogItems.price);
        break;
      case "popular":
        orderBy = desc(catalogItems.id);
        break;
      default:
        orderBy = desc(catalogItems.createdAt);
    }

    const rows = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        imageUrl: catalogItems.imageUrl,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        createdAt: catalogItems.createdAt,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
        sellerCity: sellers.city,
        sellerCurrency: sellers.currency,
        sellerRating: sql<number>`COALESCE(${avgRatingSq.avgRating}, 0)`,
      })
      .from(catalogItems)
      .innerJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(avgRatingSq, eq(sellers.id, avgRatingSq.sellerId))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get product categories
    const cats = await db
      .selectDistinct({ category: catalogItems.category })
      .from(catalogItems)
      .innerJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(and(eq(catalogItems.status, "Published"), sql`${sellers.role} != 'admin'`));

    return NextResponse.json({
      products: rows,
      categories: cats.map((c) => c.category).filter(Boolean),
      total: rows.length,
    });
  } catch (error) {
    console.error("Products search API error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
