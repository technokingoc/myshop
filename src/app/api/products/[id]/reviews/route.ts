import { NextRequest, NextResponse } from "next/server";
import { customerReviews, catalogItems, users } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'recent'; // recent, helpful, rating_high, rating_low
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const db = getDb();
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    // Determine order clause based on sort parameter
    let orderByClause;
    switch (sort) {
      case 'helpful':
        orderByClause = [desc(customerReviews.helpful), desc(customerReviews.createdAt)];
        break;
      case 'rating_high':
        orderByClause = [desc(customerReviews.rating), desc(customerReviews.createdAt)];
        break;
      case 'rating_low':
        orderByClause = [asc(customerReviews.rating), desc(customerReviews.createdAt)];
        break;
      case 'recent':
      default:
        orderByClause = [desc(customerReviews.createdAt)];
        break;
    }

    // Get reviews with customer info
    const reviews = await db
      .select({
        id: customerReviews.id,
        rating: customerReviews.rating,
        title: customerReviews.title,
        content: customerReviews.content,
        imageUrls: customerReviews.imageUrls,
        helpful: customerReviews.helpful,
        verified: customerReviews.verified,
        status: customerReviews.status,
        createdAt: customerReviews.createdAt,
        customerName: users.name,
      })
      .from(customerReviews)
      .leftJoin(users, eq(customerReviews.customerId, users.id))
      .where(
        and(
          eq(customerReviews.catalogItemId, productId),
          eq(customerReviews.status, "published")
        )
      )
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    // Get product info for context
    const [product] = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
      })
      .from(catalogItems)
      .where(eq(catalogItems.id, productId));

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate rating summary
    const allReviews = await db
      .select({
        rating: customerReviews.rating,
      })
      .from(customerReviews)
      .where(
        and(
          eq(customerReviews.catalogItemId, productId),
          eq(customerReviews.status, "published")
        )
      );

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    allReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
        totalRating += review.rating;
      }
    });

    const avgRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;

    return NextResponse.json({
      reviews,
      product,
      summary: {
        total: allReviews.length,
        average: Math.round(avgRating * 10) / 10,
        distribution: ratingCounts,
      },
      pagination: {
        limit,
        offset,
        hasMore: reviews.length === limit,
      }
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}