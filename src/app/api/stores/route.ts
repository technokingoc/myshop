import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, comments, stores } from "@/lib/schema";
import { eq, sql, ilike, desc, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const sort = searchParams.get("sort") || "recent";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    
    // Location-based parameters for distance calculations
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
    const maxDistance = searchParams.get("maxDistance") ? parseInt(searchParams.get("maxDistance")!) : null;

    const db = getDb();

    // Build conditions for both legacy sellers and new stores
    const conditions: any[] = [];
    if (search) {
      conditions.push(or(
        ilike(sellers.name, `%${search}%`),
        ilike(stores.name, `%${search}%`)
      ));
    }
    if (location) {
      conditions.push(or(
        eq(sellers.city, location),
        eq(stores.city, location)
      ));
    }
    // Exclude admin accounts from public listing
    conditions.push(sql`COALESCE(${sellers.role}, 'seller') != 'admin'`);

    const where = conditions.length > 0
      ? sql.join(conditions, sql` AND `)
      : undefined;

    // Subquery for product count
    const productCountSq = db
      .select({
        sellerId: catalogItems.sellerId,
        count: sql<number>`count(*)`.as("product_count"),
      })
      .from(catalogItems)
      .where(eq(catalogItems.status, "Active"))
      .groupBy(catalogItems.sellerId)
      .as("pc");

    // Subquery for average rating (legacy comments table)
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

    // Build the main query to handle both legacy sellers and new stores
    const selectFields = {
      id: sql<number>`COALESCE(${stores.id}, ${sellers.id})`,
      slug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
      name: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
      description: sql<string>`COALESCE(${stores.description}, ${sellers.description})`,
      city: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
      country: sql<string>`COALESCE(${stores.country}, ${sellers.country})`,
      logoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
      bannerUrl: sql<string>`COALESCE(${stores.bannerUrl}, ${sellers.bannerUrl})`,
      businessType: sql<string>`COALESCE(${stores.businessType}, ${sellers.businessType})`,
      createdAt: sql<string>`COALESCE(${stores.createdAt}, ${sellers.createdAt})`,
      productCount: sql<number>`COALESCE(${productCountSq.count}, 0)`,
      avgRating: sql<number>`COALESCE(${avgRatingSq.avgRating}, 0)`,
      reviewCount: sql<number>`COALESCE(${avgRatingSq.reviewCount}, 0)`,
      // Distance calculation (placeholder coordinates for now - will need actual lat/lng columns)
      ...(lat !== null && lng !== null ? {
        distance: sql<number>`
          CASE 
            WHEN ${stores.city} IS NOT NULL OR ${sellers.city} IS NOT NULL THEN
              ROUND(
                111.111 * DEGREES(
                  ACOS(
                    LEAST(1.0, COS(RADIANS(${lat})) * COS(RADIANS(COALESCE(${lat}, ${lat}))) * 
                    COS(RADIANS(COALESCE(${lng}, ${lng})) - RADIANS(${lng})) + 
                    SIN(RADIANS(${lat})) * SIN(RADIANS(COALESCE(${lat}, ${lat}))))
                  )
                )::numeric, 1
              )
            ELSE NULL
          END
        `.as("distance")
      } : {})
    };

    let orderBy;
    switch (sort) {
      case "popular":
        orderBy = desc(sql`COALESCE(${productCountSq.count}, 0)`);
        break;
      case "rating":
        orderBy = desc(sql`COALESCE(${avgRatingSq.avgRating}, 0)`);
        break;
      case "distance":
        if (lat !== null && lng !== null) {
          orderBy = sql`distance ASC NULLS LAST`;
        } else {
          orderBy = desc(sql`COALESCE(${stores.createdAt}, ${sellers.createdAt})`);
        }
        break;
      default:
        orderBy = desc(sql`COALESCE(${stores.createdAt}, ${sellers.createdAt})`);
    }

    const query = db
      .select(selectFields)
      .from(sellers)
      .fullJoin(stores, eq(sellers.id, stores.userId))
      .leftJoin(productCountSq, sql`${productCountSq.sellerId} = COALESCE(${stores.userId}, ${sellers.id})`)
      .leftJoin(avgRatingSq, sql`${avgRatingSq.sellerId} = COALESCE(${sellers.id}, ${stores.userId})`)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const baseWhere: any[] = where ? [where] : [];
    
    // Filter by category if specified
    if (category) {
      baseWhere.push(sql`EXISTS (
        SELECT 1 FROM catalog_items ci 
        WHERE ci.seller_id = COALESCE(${sellers.id}, ${stores.userId}) 
        AND ci.status = 'Active' 
        AND ci.category = ${category}
      )`);
    }
    
    // Filter by maximum distance if coordinates provided
    if (lat !== null && lng !== null && maxDistance !== null) {
      baseWhere.push(sql`
        111.111 * DEGREES(
          ACOS(
            LEAST(1.0, COS(RADIANS(${lat})) * COS(RADIANS(COALESCE(${lat}, ${lat}))) * 
            COS(RADIANS(COALESCE(${lng}, ${lng})) - RADIANS(${lng})) + 
            SIN(RADIANS(${lat})) * SIN(RADIANS(COALESCE(${lat}, ${lat}))))
          )
        ) <= ${maxDistance}
      `);
    }
    
    // Ensure we only return stores that actually exist (not null from the join)
    baseWhere.push(sql`(${stores.id} IS NOT NULL OR ${sellers.id} IS NOT NULL)`);

    const rows = baseWhere.length > 0
      ? await query.where(sql.join(baseWhere, sql` AND `))
      : await query;

    // Format the response with additional metadata
    const formattedStores = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description || "",
      city: row.city || "",
      country: row.country || "",
      logoUrl: row.logoUrl || "",
      bannerUrl: row.bannerUrl || "",
      businessType: row.businessType || "",
      createdAt: row.createdAt,
      productCount: row.productCount,
      avgRating: row.avgRating,
      reviewCount: row.reviewCount,
      ...(lat !== null && lng !== null && 'distance' in row ? {
        distance: row.distance,
        distanceUnit: "km"
      } : {})
    }));

    return NextResponse.json({
      stores: formattedStores,
      pagination: {
        limit,
        offset,
        total: formattedStores.length, // Note: This is an approximation
      },
      filters: {
        search,
        category,
        location,
        sort,
        ...(lat !== null && lng !== null ? {
          coordinates: { lat, lng },
          maxDistance,
          distanceSort: sort === "distance"
        } : {})
      }
    });
  } catch (error) {
    console.error("Stores API error:", error);
    return NextResponse.json({ error: "Failed to load stores" }, { status: 500 });
  }
}
