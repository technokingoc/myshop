import { NextRequest, NextResponse } from "next/server";
import { customerReviews } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function POST(
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

    // Check if review exists
    const [review] = await db
      .select({
        id: customerReviews.id,
        helpful: customerReviews.helpful,
        customerId: customerReviews.customerId,
      })
      .from(customerReviews)
      .where(eq(customerReviews.id, reviewId));

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Prevent users from marking their own reviews as helpful
    if (review.customerId === session.customerId) {
      return NextResponse.json({ error: "Cannot mark your own review as helpful" }, { status: 400 });
    }

    // TODO: Track which users have marked a review as helpful to prevent duplicates
    // For now, just increment the count
    const [updatedReview] = await db
      .update(customerReviews)
      .set({
        helpful: (review.helpful || 0) + 1,
      })
      .where(eq(customerReviews.id, reviewId))
      .returning();

    return NextResponse.json({
      success: true,
      helpful: updatedReview.helpful,
    });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}