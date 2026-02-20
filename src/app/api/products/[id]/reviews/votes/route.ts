import { NextRequest, NextResponse } from "next/server";
import { reviewVotes, customerReviews } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ votes: {} });
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reviewIds = searchParams.get('reviewIds')?.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (!reviewIds || reviewIds.length === 0) {
      return NextResponse.json({ votes: {} });
    }

    const db = getDb();

    // Get user's votes for the requested reviews
    const userVotes = await db
      .select({
        reviewId: reviewVotes.reviewId,
        voteType: reviewVotes.voteType,
      })
      .from(reviewVotes)
      .innerJoin(customerReviews, eq(reviewVotes.reviewId, customerReviews.id))
      .where(
        and(
          eq(reviewVotes.customerId, session.customerId),
          eq(customerReviews.catalogItemId, productId),
          inArray(reviewVotes.reviewId, reviewIds)
        )
      );

    // Convert to object format for easier lookup
    const votes: Record<number, string> = {};
    userVotes.forEach(vote => {
      votes[vote.reviewId] = vote.voteType;
    });

    return NextResponse.json({ votes });
  } catch (error) {
    console.error("Error fetching user votes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}