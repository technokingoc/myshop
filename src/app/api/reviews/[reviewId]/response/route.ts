import { NextRequest, NextResponse } from "next/server";
import { sellerResponses, customerReviews, users, stores } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret";

async function getSellerFromToken(): Promise<{ id: number; sellerId: number } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verify(token, AUTH_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    return {
      id: decoded.userId,
      sellerId: decoded.userId, // In the unified schema, user ID is the seller ID
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const seller = await getSellerFromToken();
    if (!seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 });
    }

    const db = getDb();

    // Verify the review exists and belongs to a product from this seller
    const [review] = await db
      .select({
        reviewId: customerReviews.id,
        productSellerId: customerReviews.sellerId,
      })
      .from(customerReviews)
      .where(eq(customerReviews.id, reviewId))
      .limit(1);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.productSellerId !== seller.sellerId) {
      return NextResponse.json({ error: "Not authorized for this review" }, { status: 403 });
    }

    // Check if seller already responded to this review
    const [existingResponse] = await db
      .select()
      .from(sellerResponses)
      .where(
        and(
          eq(sellerResponses.reviewId, reviewId),
          eq(sellerResponses.sellerId, seller.sellerId)
        )
      )
      .limit(1);

    if (existingResponse) {
      return NextResponse.json({ error: "You have already responded to this review" }, { status: 409 });
    }

    // Create the seller response
    const [newResponse] = await db
      .insert(sellerResponses)
      .values({
        reviewId,
        sellerId: seller.sellerId,
        content: content.trim(),
        status: "published", // Auto-publish for now, can add moderation later
      })
      .returning();

    // TODO: Send notification to customer about seller response
    // await notifyCustomerOfSellerResponse(reviewId, seller.sellerId);

    return NextResponse.json({
      success: true,
      response: newResponse,
    });
  } catch (error) {
    console.error("Error creating seller response:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const db = getDb();

    // Get seller response for this review
    const [response] = await db
      .select({
        id: sellerResponses.id,
        content: sellerResponses.content,
        status: sellerResponses.status,
        createdAt: sellerResponses.createdAt,
        updatedAt: sellerResponses.updatedAt,
        sellerName: users.name,
        storeVerified: stores.verificationStatus,
      })
      .from(sellerResponses)
      .leftJoin(users, eq(sellerResponses.sellerId, users.id))
      .leftJoin(stores, eq(sellerResponses.sellerId, stores.userId))
      .where(eq(sellerResponses.reviewId, reviewId))
      .limit(1);

    if (!response) {
      return NextResponse.json({ response: null });
    }

    // Only return published responses to public
    if (response.status !== 'published') {
      return NextResponse.json({ response: null });
    }

    return NextResponse.json({
      response: {
        id: response.id,
        content: response.content,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        sellerName: response.sellerName,
        storeVerified: response.storeVerified === 'verified',
      },
    });
  } catch (error) {
    console.error("Error fetching seller response:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const seller = await getSellerFromToken();
    if (!seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, status } = await request.json();
    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);

    if (content && content.length > 500) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 });
    }

    const db = getDb();

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (status && ['published', 'pending', 'hidden'].includes(status)) {
      updateData.status = status;
    }

    // Update the seller response
    const [updatedResponse] = await db
      .update(sellerResponses)
      .set(updateData)
      .where(
        and(
          eq(sellerResponses.reviewId, reviewId),
          eq(sellerResponses.sellerId, seller.sellerId)
        )
      )
      .returning();

    if (!updatedResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      response: updatedResponse,
    });
  } catch (error) {
    console.error("Error updating seller response:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const seller = await getSellerFromToken();
    if (!seller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.reviewId);

    const db = getDb();

    // Delete the seller response
    const [deletedResponse] = await db
      .delete(sellerResponses)
      .where(
        and(
          eq(sellerResponses.reviewId, reviewId),
          eq(sellerResponses.sellerId, seller.sellerId)
        )
      )
      .returning();

    if (!deletedResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Response deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller response:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}