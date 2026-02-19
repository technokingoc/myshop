import { NextRequest, NextResponse } from "next/server";
import { customerReviews, catalogItems, users } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // all, published, pending, hidden
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = getDb();
    
    // Build query conditions
    let conditions = [eq(customerReviews.sellerId, session.sellerId)];
    
    if (status !== 'all') {
      conditions.push(eq(customerReviews.status, status));
    }

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
        updatedAt: customerReviews.updatedAt,
        customerName: users.name,
        productName: catalogItems.name,
        productId: catalogItems.id,
        productImageUrl: catalogItems.imageUrl,
      })
      .from(customerReviews)
      .leftJoin(users, eq(customerReviews.customerId, users.id))
      .leftJoin(catalogItems, eq(customerReviews.catalogItemId, catalogItems.id))
      .where(and(...conditions))
      .orderBy(desc(customerReviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary stats
    const stats = await db
      .select({
        total: customerReviews.id,
        status: customerReviews.status,
      })
      .from(customerReviews)
      .where(eq(customerReviews.sellerId, session.sellerId));

    const summary = {
      total: stats.length,
      published: stats.filter(s => s.status === 'published').length,
      pending: stats.filter(s => s.status === 'pending').length,
      hidden: stats.filter(s => s.status === 'hidden').length,
    };

    return NextResponse.json({
      reviews,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: reviews.length === limit,
      }
    });
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { reviewId, status } = data;

    if (!reviewId || !status || !['published', 'pending', 'hidden'].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const db = getDb();

    // Verify the review belongs to this seller
    const [existingReview] = await db
      .select({ id: customerReviews.id })
      .from(customerReviews)
      .where(
        and(
          eq(customerReviews.id, reviewId),
          eq(customerReviews.sellerId, session.sellerId)
        )
      );

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Update review status
    const [updatedReview] = await db
      .update(customerReviews)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(customerReviews.id, reviewId))
      .returning();

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}