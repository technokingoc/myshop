// @ts-nocheck
import { getDb } from "./db";
import { customerReviews, storeRatings, stores, sellerResponses } from "./schema";
import { eq, sql, desc, and } from "drizzle-orm";

export interface StoreRatingData {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  verifiedReviewsCount: number;
  withPhotosCount: number;
  responseRate: number;
  ratingTrend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

/**
 * Calculate store rating aggregate for a seller
 */
export async function calculateStoreRating(sellerId: number): Promise<StoreRatingData> {
  const db = getDb();

  try {
    // Get all published reviews for this seller
    const reviews = await db
      .select({
        id: customerReviews.id,
        rating: customerReviews.rating,
        verified: customerReviews.verified,
        imageUrls: customerReviews.imageUrls,
        createdAt: customerReviews.createdAt,
        hasResponse: sql<boolean>`CASE WHEN ${sellerResponses.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(customerReviews)
      .leftJoin(sellerResponses, eq(customerReviews.id, sellerResponses.reviewId))
      .where(
        and(
          eq(customerReviews.sellerId, sellerId),
          eq(customerReviews.status, "published")
        )
      )
      .orderBy(desc(customerReviews.createdAt));

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedReviewsCount: 0,
        withPhotosCount: 0,
        responseRate: 0,
        ratingTrend: 'stable',
        trendPercentage: 0,
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / totalReviews;

    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating]++;
      }
    });

    // Count verified reviews
    const verifiedReviewsCount = reviews.filter(r => r.verified).length;

    // Count reviews with photos
    const withPhotosCount = reviews.filter(r => 
      r.imageUrls && r.imageUrls.trim().length > 0
    ).length;

    // Calculate response rate
    const reviewsWithResponses = reviews.filter(r => r.hasResponse).length;
    const responseRate = (reviewsWithResponses / totalReviews) * 100;

    // Calculate trend (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentReviews = reviews.filter(r => 
      new Date(r.createdAt!) >= thirtyDaysAgo
    );
    const previousReviews = reviews.filter(r => {
      const reviewDate = new Date(r.createdAt!);
      return reviewDate >= sixtyDaysAgo && reviewDate < thirtyDaysAgo;
    });

    let ratingTrend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (recentReviews.length > 0 && previousReviews.length > 0) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / recentReviews.length;
      const previousAvg = previousReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / previousReviews.length;

      const change = ((recentAvg - previousAvg) / previousAvg) * 100;
      trendPercentage = Math.abs(change);

      if (change > 5) ratingTrend = 'improving';
      else if (change < -5) ratingTrend = 'declining';
    }

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      verifiedReviewsCount,
      withPhotosCount,
      responseRate: Math.round(responseRate * 100) / 100,
      ratingTrend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
    };

  } catch (error) {
    console.error('Error calculating store rating:', error);
    throw error;
  }
}

/**
 * Update store rating aggregate in database
 */
export async function updateStoreRatingAggregate(sellerId: number, storeId?: number): Promise<void> {
  const db = getDb();

  try {
    const ratingData = await calculateStoreRating(sellerId);

    // Check if aggregate already exists
    const [existingAggregate] = await db
      .select()
      .from(storeRatings)
      .where(eq(storeRatings.sellerId, sellerId))
      .limit(1);

    if (existingAggregate) {
      // Update existing aggregate
      await db
        .update(storeRatings)
        .set({
          totalReviews: ratingData.totalReviews,
          averageRating: ratingData.averageRating.toString(),
          rating5Count: ratingData.ratingDistribution[5],
          rating4Count: ratingData.ratingDistribution[4],
          rating3Count: ratingData.ratingDistribution[3],
          rating2Count: ratingData.ratingDistribution[2],
          rating1Count: ratingData.ratingDistribution[1],
          verifiedReviewsCount: ratingData.verifiedReviewsCount,
          withPhotosCount: ratingData.withPhotosCount,
          responseRate: ratingData.responseRate.toString(),
          ratingTrend: ratingData.ratingTrend,
          trendPercentage: ratingData.trendPercentage.toString(),
          lastCalculated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storeRatings.sellerId, sellerId));
    } else {
      // Create new aggregate
      await db
        .insert(storeRatings)
        .values({
          sellerId,
          storeId,
          totalReviews: ratingData.totalReviews,
          averageRating: ratingData.averageRating.toString(),
          rating5Count: ratingData.ratingDistribution[5],
          rating4Count: ratingData.ratingDistribution[4],
          rating3Count: ratingData.ratingDistribution[3],
          rating2Count: ratingData.ratingDistribution[2],
          rating1Count: ratingData.ratingDistribution[1],
          verifiedReviewsCount: ratingData.verifiedReviewsCount,
          withPhotosCount: ratingData.withPhotosCount,
          responseRate: ratingData.responseRate.toString(),
          ratingTrend: ratingData.ratingTrend,
          trendPercentage: ratingData.trendPercentage.toString(),
          lastCalculated: new Date(),
        });
    }
  } catch (error) {
    console.error('Error updating store rating aggregate:', error);
    throw error;
  }
}

/**
 * Get store rating aggregate
 */
export async function getStoreRating(sellerId: number): Promise<StoreRatingData | null> {
  const db = getDb();

  try {
    const [aggregate] = await db
      .select()
      .from(storeRatings)
      .where(eq(storeRatings.sellerId, sellerId))
      .limit(1);

    if (!aggregate) {
      return null;
    }

    return {
      totalReviews: aggregate.totalReviews ?? 0,
      averageRating: parseFloat(aggregate.averageRating ?? '0'),
      ratingDistribution: {
        5: aggregate.rating5Count ?? 0,
        4: aggregate.rating4Count ?? 0,
        3: aggregate.rating3Count ?? 0,
        2: aggregate.rating2Count ?? 0,
        1: aggregate.rating1Count ?? 0,
      },
      verifiedReviewsCount: aggregate.verifiedReviewsCount ?? 0,
      withPhotosCount: aggregate.withPhotosCount ?? 0,
      responseRate: parseFloat(aggregate.responseRate ?? '0'),
      ratingTrend: aggregate.ratingTrend as 'improving' | 'declining' | 'stable',
      trendPercentage: parseFloat(aggregate.trendPercentage ?? '0'),
    };
  } catch (error) {
    console.error('Error getting store rating:', error);
    return null;
  }
}

/**
 * Background job to update all store ratings
 */
export async function updateAllStoreRatings(): Promise<void> {
  const db = getDb();

  try {
    // Get all sellers who have reviews
    const sellersWithReviews = await db
      .select({
        sellerId: customerReviews.sellerId,
        storeId: stores.id,
      })
      .from(customerReviews)
      .leftJoin(stores, eq(customerReviews.sellerId, stores.userId))
      .where(eq(customerReviews.status, "published"))
      .groupBy(customerReviews.sellerId, stores.id);

    // Update each seller's rating aggregate
    for (const seller of sellersWithReviews) {
      if (seller.sellerId) {
        try {
          await updateStoreRatingAggregate(seller.sellerId, seller.storeId || undefined);
        } catch (error) {
          console.error(`Error updating rating for seller ${seller.sellerId}:`, error);
          // Continue with other sellers even if one fails
        }
      }
    }

    console.log(`Updated ratings for ${sellersWithReviews.length} stores`);
  } catch (error) {
    console.error('Error in updateAllStoreRatings:', error);
    throw error;
  }
}

/**
 * Trigger rating update when a review is added/updated
 */
export async function handleReviewUpdate(sellerId: number): Promise<void> {
  try {
    // Get store ID for this seller
    const db = getDb();
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.userId, sellerId))
      .limit(1);

    await updateStoreRatingAggregate(sellerId, store?.id);
  } catch (error) {
    console.error('Error handling review update:', error);
    // Don't throw - this is a background operation
  }
}