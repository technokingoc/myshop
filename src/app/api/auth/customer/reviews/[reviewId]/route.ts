import { NextRequest, NextResponse } from "next/server";
import { customerReviews } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const db = getDb();

    // Check if review exists and belongs to the customer
    const [review] = await db
      .select()
      .from(customerReviews)
      .where(
        and(
          eq(customerReviews.id, reviewId),
          eq(customerReviews.customerId, session.customerId)
        )
      );

    if (!review) {
      return NextResponse.json({ error: "Review not found or not authorized" }, { status: 404 });
    }

    // Delete the review
    await db
      .delete(customerReviews)
      .where(eq(customerReviews.id, reviewId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const data = await request.json();
    const { rating, title, content, imageUrls } = data;

    // Validate data
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Review content is required" }, { status: 400 });
    }

    const db = getDb();

    // Check if review exists and belongs to the customer
    const [review] = await db
      .select()
      .from(customerReviews)
      .where(
        and(
          eq(customerReviews.id, reviewId),
          eq(customerReviews.customerId, session.customerId)
        )
      );

    if (!review) {
      return NextResponse.json({ error: "Review not found or not authorized" }, { status: 404 });
    }

    // Update the review
    const [updatedReview] = await db
      .update(customerReviews)
      .set({
        rating,
        title: title?.trim() || "",
        content: content.trim(),
        imageUrls: imageUrls || "",
        updatedAt: new Date(),
        status: "pending", // Re-moderate edited reviews
      })
      .where(eq(customerReviews.id, reviewId))
      .returning();

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}