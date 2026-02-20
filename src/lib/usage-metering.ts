import { getDb } from './db';
import {
  subscriptions,
  usageRecords,
  sellers,
  catalogItems,
  orders,
  notifications,
} from './schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { PLANS, checkLimit, type PlanId } from './plans';
import { SubscriptionService } from './subscription-service';

export interface UsageMetrics {
  sellerId: number;
  products: number;
  orders: number;
  storageUsedMB: number;
  plan: PlanId;
  limits: {
    products: number;
    orders: number;
    storage: number;
  };
  warnings: {
    products: boolean;
    orders: boolean;
    storage: boolean;
  };
}

export class UsageMeteringService {
  private db = getDb();
  private subscriptionService = new SubscriptionService();

  // Get current usage for all active sellers
  async getAllSellersUsage(): Promise<UsageMetrics[]> {
    try {
      const allSellers = await this.db
        .select({
          id: sellers.id,
          plan: sellers.plan,
        })
        .from(sellers);

      const usageMetrics: UsageMetrics[] = [];

      for (const seller of allSellers) {
        const usage = await this.getSellerUsage(seller.id);
        usageMetrics.push(usage);
      }

      return usageMetrics;
    } catch (error) {
      console.error('Error getting all sellers usage:', error);
      throw error;
    }
  }

  // Get usage for a specific seller
  async getSellerUsage(sellerId: number): Promise<UsageMetrics> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get seller and plan info
      const seller = await this.db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1);

      if (seller.length === 0) {
        throw new Error(`Seller ${sellerId} not found`);
      }

      const plan = PLANS[seller[0].plan as PlanId] || PLANS.free;

      // Count total products
      const productCount = await this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(catalogItems)
        .where(eq(catalogItems.sellerId, sellerId));

      // Count orders this month
      const orderCount = await this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(
          and(
            eq(orders.sellerId, sellerId),
            gte(orders.createdAt, monthStart)
          )
        );

      // Calculate storage usage (simplified - would use actual file sizes in production)
      const storageUsed = Math.floor(Math.random() * 100); // Mock data for now

      const metrics: UsageMetrics = {
        sellerId,
        products: productCount[0]?.count || 0,
        orders: orderCount[0]?.count || 0,
        storageUsedMB: storageUsed,
        plan: seller[0].plan as PlanId,
        limits: {
          products: plan.limits.products,
          orders: plan.limits.ordersPerMonth,
          storage: -1, // TODO: Add storage limits to plans
        },
        warnings: {
          products: false,
          orders: false,
          storage: false,
        },
      };

      // Check if approaching limits (80% threshold)
      if (plan.limits.products > 0) {
        metrics.warnings.products = (metrics.products / plan.limits.products) >= 0.8;
      }
      if (plan.limits.ordersPerMonth > 0) {
        metrics.warnings.orders = (metrics.orders / plan.limits.ordersPerMonth) >= 0.8;
      }

      return metrics;
    } catch (error) {
      console.error('Error getting seller usage:', error);
      throw error;
    }
  }

  // Record usage for billing period and check for limit warnings
  async recordUsageAndCheckLimits(sellerId: number): Promise<void> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Get subscription
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.sellerId, sellerId))
        .limit(1);

      const subscriptionId = subscription.length > 0 ? subscription[0].id : null;

      // Get current usage
      const usage = await this.getSellerUsage(sellerId);

      // Check if usage record exists for this period
      const existingRecord = await this.db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.sellerId, sellerId),
            eq(usageRecords.periodStart, monthStart),
            eq(usageRecords.periodEnd, monthEnd)
          )
        )
        .limit(1);

      const limitExceeded = 
        (usage.limits.products > 0 && usage.products > usage.limits.products) ||
        (usage.limits.orders > 0 && usage.orders > usage.limits.orders);

      if (existingRecord.length > 0) {
        // Update existing record
        await this.db
          .update(usageRecords)
          .set({
            productsUsed: usage.products,
            ordersProcessed: usage.orders,
            storageUsedMB: usage.storageUsedMB,
            limitExceeded,
            updatedAt: new Date(),
          })
          .where(eq(usageRecords.id, existingRecord[0].id));
      } else {
        // Create new record
        await this.db
          .insert(usageRecords)
          .values({
            sellerId,
            subscriptionId,
            periodStart: monthStart,
            periodEnd: monthEnd,
            productsUsed: usage.products,
            ordersProcessed: usage.orders,
            storageUsedMB: usage.storageUsedMB,
            productsLimit: usage.limits.products,
            ordersLimit: usage.limits.orders,
            storageLimitMB: usage.limits.storage,
            limitExceeded,
          });
      }

      // Send warnings if approaching limits
      await this.sendUsageWarnings(sellerId, usage);

      // Handle limit exceeded scenarios
      if (limitExceeded) {
        await this.handleLimitsExceeded(sellerId, usage);
      }
    } catch (error) {
      console.error('Error recording usage and checking limits:', error);
      throw error;
    }
  }

  // Send warnings when approaching usage limits
  async sendUsageWarnings(sellerId: number, usage: UsageMetrics): Promise<void> {
    try {
      const warnings: string[] = [];
      let shouldSendNotification = false;

      // Check products warning (80% threshold)
      if (usage.warnings.products && usage.limits.products > 0) {
        const percentage = Math.round((usage.products / usage.limits.products) * 100);
        warnings.push(`Products: ${usage.products}/${usage.limits.products} (${percentage}%)`);
        shouldSendNotification = true;
      }

      // Check orders warning (80% threshold)
      if (usage.warnings.orders && usage.limits.orders > 0) {
        const percentage = Math.round((usage.orders / usage.limits.orders) * 100);
        warnings.push(`Orders: ${usage.orders}/${usage.limits.orders} (${percentage}%)`);
        shouldSendNotification = true;
      }

      // Check if we've already sent warnings recently (avoid spam)
      if (shouldSendNotification) {
        const recentWarnings = await this.db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.sellerId, sellerId),
              eq(notifications.type, 'usage_warning'),
              gte(notifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
            )
          )
          .limit(1);

        if (recentWarnings.length === 0) {
          // Send warning notification
          await this.db.insert(notifications).values({
            sellerId,
            type: 'usage_warning',
            title: 'Approaching Plan Limits',
            message: `You're approaching your plan limits:\n${warnings.join('\n')}\n\nConsider upgrading your plan to avoid service interruption.`,
            actionUrl: '/dashboard/subscription',
            priority: 2, // Medium priority
            notificationChannel: 'both', // In-app and email
          });
        }
      }
    } catch (error) {
      console.error('Error sending usage warnings:', error);
    }
  }

  // Handle when limits are exceeded
  async handleLimitsExceeded(sellerId: number, usage: UsageMetrics): Promise<void> {
    try {
      const limitations: string[] = [];

      // Products limit exceeded
      if (usage.limits.products > 0 && usage.products > usage.limits.products) {
        limitations.push(`Products: ${usage.products}/${usage.limits.products} (exceeded)`);
      }

      // Orders limit exceeded
      if (usage.limits.orders > 0 && usage.orders > usage.limits.orders) {
        limitations.push(`Orders: ${usage.orders}/${usage.limits.orders} (exceeded)`);
      }

      if (limitations.length > 0) {
        // Send limit exceeded notification
        await this.db.insert(notifications).values({
          sellerId,
          type: 'limit_exceeded',
          title: 'Plan Limits Exceeded',
          message: `You've exceeded your plan limits:\n${limitations.join('\n')}\n\nSome features may be restricted. Please upgrade your plan to continue using all features.`,
          actionUrl: '/pricing',
          priority: 3, // High priority
          notificationChannel: 'both',
        });

        // TODO: Implement actual restrictions
        // For example, prevent creating new products or orders
        // This would be handled in the respective API endpoints
      }
    } catch (error) {
      console.error('Error handling limits exceeded:', error);
    }
  }

  // Check if seller is allowed to perform an action based on limits
  async canPerformAction(
    sellerId: number,
    action: 'create_product' | 'process_order'
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const usage = await this.getSellerUsage(sellerId);

      switch (action) {
        case 'create_product':
          if (usage.limits.products > 0 && usage.products >= usage.limits.products) {
            return {
              allowed: false,
              reason: `Product limit reached (${usage.products}/${usage.limits.products}). Please upgrade your plan.`,
            };
          }
          break;

        case 'process_order':
          if (usage.limits.orders > 0 && usage.orders >= usage.limits.orders) {
            return {
              allowed: false,
              reason: `Monthly order limit reached (${usage.orders}/${usage.limits.orders}). Please upgrade your plan.`,
            };
          }
          break;

        default:
          return { allowed: true };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking action permission:', error);
      return { allowed: true }; // Fail open to avoid breaking functionality
    }
  }

  // Run periodic usage checks (called by cron job)
  async runPeriodicUsageCheck(): Promise<void> {
    try {
      console.log('Starting periodic usage check...');
      
      const allUsage = await this.getAllSellersUsage();
      
      for (const usage of allUsage) {
        await this.recordUsageAndCheckLimits(usage.sellerId);
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Completed usage check for ${allUsage.length} sellers`);
    } catch (error) {
      console.error('Error in periodic usage check:', error);
      throw error;
    }
  }

  // Get usage history for a seller
  async getUsageHistory(
    sellerId: number,
    months = 6
  ): Promise<Array<{
    month: string;
    products: number;
    orders: number;
    storage: number;
    limitExceeded: boolean;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const records = await this.db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.sellerId, sellerId),
            gte(usageRecords.periodStart, startDate),
            lte(usageRecords.periodEnd, endDate)
          )
        )
        .orderBy(desc(usageRecords.periodStart));

      return records.map(record => ({
        month: record.periodStart.toISOString().substring(0, 7), // YYYY-MM format
        products: record.productsUsed || 0,
        orders: record.ordersProcessed || 0,
        storage: record.storageUsedMB || 0,
        limitExceeded: record.limitExceeded || false,
      }));
    } catch (error) {
      console.error('Error getting usage history:', error);
      throw error;
    }
  }
}