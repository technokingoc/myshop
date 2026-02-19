import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { catalogItems, comments, sellers, stores } from "@/lib/schema";
import { sql, eq, or } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  try {
    // Get flagged products
    let flaggedProducts = [];
    try {
      flaggedProducts = await db
        .select({
          id: catalogItems.id,
          type: sql<string>`'product'`,
          title: catalogItems.name,
          content: catalogItems.shortDescription,
          authorName: sellers.name,
          authorEmail: sellers.email,
          moderationStatus: sql<string>`COALESCE(${catalogItems.moderationStatus}, 'approved')`,
          flaggedReason: sql<string>`COALESCE(${catalogItems.flaggedReason}, '')`,
          flaggedBy: catalogItems.flaggedBy,
          flaggedAt: catalogItems.flaggedAt,
          reviewedBy: catalogItems.reviewedBy,
          reviewedAt: catalogItems.reviewedAt,
          createdAt: catalogItems.createdAt,
          storeName: sellers.name,
        })
        .from(catalogItems)
        .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
        .where(sql`COALESCE(${catalogItems.moderationStatus}, 'approved') != 'approved'`);
    } catch (error) {
      // If moderation columns don't exist, return empty array
      console.log("Product moderation columns don't exist yet");
    }

    // Get flagged reviews
    let flaggedReviews = [];
    try {
      flaggedReviews = await db
        .select({
          id: comments.id,
          type: sql<string>`'review'`,
          title: sql<string>`CONCAT('Review for ', ci.name)`,
          content: comments.content,
          authorName: comments.authorName,
          authorEmail: comments.authorEmail,
          moderationStatus: sql<string>`COALESCE(${comments.moderationStatus}, 'approved')`,
          flaggedReason: sql<string>`COALESCE(${comments.flaggedReason}, '')`,
          flaggedBy: comments.flaggedBy,
          flaggedAt: comments.flaggedAt,
          reviewedBy: comments.reviewedBy,
          reviewedAt: comments.reviewedAt,
          createdAt: comments.createdAt,
          productName: sql<string>`ci.name`,
          storeName: sql<string>`s.name`,
          rating: comments.rating,
        })
        .from(comments)
        .leftJoin(catalogItems, eq(comments.catalogItemId, catalogItems.id))
        .leftJoin(sellers, eq(comments.sellerId, sellers.id))
        .where(sql`COALESCE(${comments.moderationStatus}, 'approved') != 'approved'`);
    } catch (error) {
      // If moderation columns don't exist, return empty array
      console.log("Review moderation columns don't exist yet");
    }

    // Combine and sort by flagged date
    const allItems = [...flaggedProducts, ...flaggedReviews]
      .sort((a, b) => {
        const dateA = a.flaggedAt || a.createdAt;
        const dateB = b.flaggedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

    return NextResponse.json({ items: allItems });

  } catch (error) {
    console.error("Moderation API error:", error);
    
    // Fallback: return some sample data or empty array
    return NextResponse.json({ 
      items: [],
      note: "Moderation features require database migration to add moderation columns"
    });
  }
}