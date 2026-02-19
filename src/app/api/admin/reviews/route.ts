import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { customerReviews, catalogItems, sellers, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const result = await db
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
      sellerName: sellers.name,
    })
    .from(customerReviews)
    .leftJoin(users, eq(customerReviews.customerId, users.id))
    .leftJoin(catalogItems, eq(customerReviews.catalogItemId, catalogItems.id))
    .leftJoin(sellers, eq(customerReviews.sellerId, sellers.id))
    .orderBy(desc(customerReviews.createdAt));

  return NextResponse.json({ reviews: result });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await request.json();
  const { reviewId, status } = data;

  if (!reviewId || !status || !['published', 'pending', 'hidden'].includes(status)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const db = getDb();

  try {
    await db
      .update(customerReviews)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(customerReviews.id, reviewId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating review status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
