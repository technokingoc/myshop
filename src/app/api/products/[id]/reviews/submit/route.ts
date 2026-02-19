import { NextRequest, NextResponse } from "next/server";
import { customerReviews, catalogItems } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";
import { notifyNewReview } from "@/lib/notification-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const data = await request.json();
    const { rating, title, content, imageUrls, orderId } = data;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Validate content
    if (!content?.trim()) {
      return NextResponse.json({ error: "Review content is required" }, { status: 400 });
    }

    const db = getDb();

    // Check if product exists
    const [product] = await db
      .select({
        id: catalogItems.id,
        sellerId: catalogItems.sellerId,
      })
      .from(catalogItems)
      .where(eq(catalogItems.id, productId));

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if customer already reviewed this item
    const existingReview = await db
      .select()
      .from(customerReviews)
      .where(
        and(
          eq(customerReviews.customerId, session.customerId),
          eq(customerReviews.catalogItemId, productId)
        )
      );

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Reviews start as pending and require seller approval for moderation
    const status = "pending";

    const [newReview] = await db
      .insert(customerReviews)
      .values({
        customerId: session.customerId,
        catalogItemId: productId,
        sellerId: product.sellerId,
        orderId: orderId || null,
        rating,
        title: title?.trim() || "",
        content: content.trim(),
        imageUrls: imageUrls || "",
        verified: false, // TODO: Check if this is from a verified purchase
        status,
      })
      .returning();

    // Notify seller about the new review
    await notifyNewReview(newReview.id, product.sellerId);

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}