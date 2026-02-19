import { NextRequest, NextResponse } from "next/server";
import { customerReviews } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productIds = searchParams.get('productIds');
    
    if (!productIds) {
      return NextResponse.json({ error: "Product IDs are required" }, { status: 400 });
    }

    const ids = productIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return NextResponse.json({ error: "Valid product IDs are required" }, { status: 400 });
    }

    const db = getDb();
    
    // Get all reviews for the requested products
    const reviews = await db
      .select({
        catalogItemId: customerReviews.catalogItemId,
        rating: customerReviews.rating,
      })
      .from(customerReviews)
      .where(
        and(
          inArray(customerReviews.catalogItemId, ids),
          eq(customerReviews.status, "published")
        )
      );

    // Calculate averages and counts for each product
    const ratings = ids.reduce((acc, productId) => {
      const productReviews = reviews.filter(r => r.catalogItemId === productId);
      
      if (productReviews.length === 0) {
        acc[productId] = { average: 0, count: 0 };
        return acc;
      }

      const total = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const average = Math.round((total / productReviews.length) * 10) / 10;
      
      acc[productId] = {
        average,
        count: productReviews.length
      };
      
      return acc;
    }, {} as Record<number, { average: number; count: number }>);

    return NextResponse.json(ratings);
  } catch (error) {
    console.error("Error fetching product ratings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}