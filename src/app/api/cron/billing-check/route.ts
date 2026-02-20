import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { UsageMeteringService } from '@/lib/usage-metering';
import { getDb } from '@/lib/db';
import { subscriptions } from '@/lib/schema';
import { and, lte, eq, isNotNull } from 'drizzle-orm';

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// Run this daily to check billing status, usage limits, and grace periods
export async function GET(request: NextRequest) {
  try {
    // Verify cron job authentication (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CRON_SECRET;
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily billing check...');
    
    const db = getDb();
    const subscriptionService = new SubscriptionService();
    const usageMeteringService = new UsageMeteringService();
    
    const results = {
      usageChecked: 0,
      gracePeriodsChecked: 0,
      gracePeriodsExpired: 0,
      errors: [] as string[],
    };

    // 1. Run usage metering for all sellers
    try {
      await usageMeteringService.runPeriodicUsageCheck();
      console.log('✓ Usage metering completed');
      
      // Count how many sellers we checked
      const allUsage = await usageMeteringService.getAllSellersUsage();
      results.usageChecked = allUsage.length;
    } catch (error) {
      const errorMsg = `Usage metering failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 2. Check for expired grace periods
    try {
      const now = new Date();
      
      // Find subscriptions with expired grace periods
      const expiredGracePeriods = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'past_due'),
            isNotNull(subscriptions.gracePeriodEnd),
            lte(subscriptions.gracePeriodEnd, now)
          )
        );

      results.gracePeriodsChecked = expiredGracePeriods.length;

      for (const subscription of expiredGracePeriods) {
        try {
          console.log(`Grace period expired for seller ${subscription.sellerId}, downgrading to free plan...`);
          await subscriptionService.endGracePeriod(subscription.sellerId);
          results.gracePeriodsExpired++;
        } catch (error) {
          const errorMsg = `Failed to handle expired grace period for seller ${subscription.sellerId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      if (expiredGracePeriods.length > 0) {
        console.log(`✓ Processed ${results.gracePeriodsExpired}/${expiredGracePeriods.length} expired grace periods`);
      } else {
        console.log('✓ No expired grace periods found');
      }
    } catch (error) {
      const errorMsg = `Grace period check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 3. Check for upcoming renewals and send reminders (optional)
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const upcomingRenewals = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.status, 'active'),
            lte(subscriptions.currentPeriodEnd, threeDaysFromNow),
            isNotNull(subscriptions.currentPeriodEnd)
          )
        );

      // TODO: Send renewal reminder notifications
      if (upcomingRenewals.length > 0) {
        console.log(`Found ${upcomingRenewals.length} subscriptions renewing in the next 3 days`);
      }
    } catch (error) {
      const errorMsg = `Renewal reminder check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    // 4. Clean up old usage records (keep last 12 months)
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      // In a production system, you might want to archive rather than delete
      // For now, we'll keep this commented out to preserve data
      // const deleted = await db
      //   .delete(usageRecords)
      //   .where(lte(usageRecords.createdAt, twelveMonthsAgo));

      console.log('✓ Usage records cleanup completed (archival only)');
    } catch (error) {
      const errorMsg = `Usage records cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    console.log('Daily billing check completed', results);

    return Response.json({
      success: true,
      message: 'Daily billing check completed',
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Critical error in billing check:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}