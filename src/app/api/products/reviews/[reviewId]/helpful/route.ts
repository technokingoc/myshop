import { NextRequest, NextResponse } from "next/server";
import { customerReviews, reviewVotes } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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

    const data = await request.json().catch(() => ({}));
    const voteType = data.voteType || 'helpful'; // default to helpful for backward compatibility

    if (!['helpful', 'unhelpful'].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    const db = getDb();

    // Check if review exists
    const [review] = await db
      .select({
        id: customerReviews.id,
        helpful: customerReviews.helpful,
        unhelpful: customerReviews.unhelpful,
        customerId: customerReviews.customerId,
      })
      .from(customerReviews)
      .where(eq(customerReviews.id, reviewId));

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Prevent users from voting on their own reviews
    if (review.customerId === session.customerId) {
      return NextResponse.json({ error: "Cannot vote on your own review" }, { status: 400 });
    }

    // Check if user already voted on this review
    const existingVote = await db
      .select()
      .from(reviewVotes)
      .where(
        and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.customerId, session.customerId)
        )
      );

    if (existingVote.length > 0) {
      const currentVote = existingVote[0];
      
      if (currentVote.voteType === voteType) {
        // User is trying to vote the same way again - remove their vote
        await db
          .delete(reviewVotes)
          .where(
            and(
              eq(reviewVotes.reviewId, reviewId),
              eq(reviewVotes.customerId, session.customerId)
            )
          );

        // Decrement the appropriate counter
        const updateField = voteType === 'helpful' 
          ? { helpful: Math.max(0, (review.helpful || 0) - 1) }
          : { unhelpful: Math.max(0, (review.unhelpful || 0) - 1) };

        const [updatedReview] = await db
          .update(customerReviews)
          .set(updateField)
          .where(eq(customerReviews.id, reviewId))
          .returning();

        return NextResponse.json({
          success: true,
          action: 'removed',
          helpful: updatedReview.helpful,
          unhelpful: updatedReview.unhelpful,
        });
      } else {
        // User is switching their vote - update the vote type and counters
        await db
          .update(reviewVotes)
          .set({ voteType })
          .where(
            and(
              eq(reviewVotes.reviewId, reviewId),
              eq(reviewVotes.customerId, session.customerId)
            )
          );

        // Update counters: decrement old type, increment new type
        const newHelpful = voteType === 'helpful' 
          ? (review.helpful || 0) + 1 
          : Math.max(0, (review.helpful || 0) - 1);
        
        const newUnhelpful = voteType === 'unhelpful' 
          ? (review.unhelpful || 0) + 1 
          : Math.max(0, (review.unhelpful || 0) - 1);

        const [updatedReview] = await db
          .update(customerReviews)
          .set({ 
            helpful: newHelpful,
            unhelpful: newUnhelpful
          })
          .where(eq(customerReviews.id, reviewId))
          .returning();

        return NextResponse.json({
          success: true,
          action: 'switched',
          helpful: updatedReview.helpful,
          unhelpful: updatedReview.unhelpful,
        });
      }
    } else {
      // New vote - add to tracking table and increment counter
      await db
        .insert(reviewVotes)
        .values({
          reviewId,
          customerId: session.customerId,
          voteType,
        });

      // Increment the appropriate counter
      const updateField = voteType === 'helpful' 
        ? { helpful: (review.helpful || 0) + 1 }
        : { unhelpful: (review.unhelpful || 0) + 1 };

      const [updatedReview] = await db
        .update(customerReviews)
        .set(updateField)
        .where(eq(customerReviews.id, reviewId))
        .returning();

      return NextResponse.json({
        success: true,
        action: 'added',
        helpful: updatedReview.helpful,
        unhelpful: updatedReview.unhelpful,
      });
    }
  } catch (error) {
    console.error("Error processing review vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}