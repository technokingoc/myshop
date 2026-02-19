import { NextRequest, NextResponse } from "next/server";
import { customerReviews, catalogItems, sellers, orders } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
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
        itemName: catalogItems.name,
        itemImageUrl: catalogItems.imageUrl,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
      })
      .from(customerReviews)
      .leftJoin(catalogItems, eq(customerReviews.catalogItemId, catalogItems.id))
      .leftJoin(sellers, eq(customerReviews.sellerId, sellers.id))
      .where(eq(customerReviews.customerId, session.customerId))
      .orderBy(desc(customerReviews.createdAt));

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const data = await request.json();
    const { catalogItemId, sellerId, orderId, rating, title, content, imageUrls } = data;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const db = getDb();
    
    // Check if customer already reviewed this item
    const existingReview = await db
      .select()
      .from(customerReviews)
      .where(
        eq(customerReviews.customerId, session.customerId) &&
        eq(customerReviews.catalogItemId, catalogItemId)
      );

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this item" }, { status: 400 });
    }

    // Check if this is a verified purchase
    let verified = false;
    if (orderId) {
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId) && eq(orders.customerId, session.customerId));
      verified = order.length > 0;
    }

    const [newReview] = await db
      .insert(customerReviews)
      .values({
        customerId: session.customerId,
        catalogItemId,
        sellerId,
        orderId: orderId || null,
        rating,
        title: title || "",
        content: content || "",
        imageUrls: imageUrls || "",
        verified,
        status: "published",
      })
      .returning();

    return NextResponse.json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}