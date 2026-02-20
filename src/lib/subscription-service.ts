import { getDb } from './db';
import {
  subscriptions,
  usageRecords,
  subscriptionInvoices,
  subscriptionInvoiceItems,
  subscriptionPaymentMethods,
  billingEvents,
  planChangeRequests,
  sellers,
  users,
  catalogItems,
  orders,
} from './schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { PLANS, type PlanId } from './plans';
import {
  stripe,
  STRIPE_PLANS,
  createOrRetrieveStripeCustomer,
  createStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  getPlanFromStripePrice,
  getStripePriceFromPlan,
} from './stripe';
import type Stripe from 'stripe';

export interface SubscriptionData {
  id: number;
  sellerId: number;
  plan: PlanId;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  gracePeriodEnd?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage: {
    products: { current: number; limit: number };
    orders: { current: number; limit: number };
    storage: { current: number; limit: number };
  };
  paymentMethod?: {
    type: string;
    brand: string;
    last4: string;
  };
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    date: Date;
    dueDate?: Date;
    pdfUrl?: string;
  }>;
}

export class SubscriptionService {
  private db = getDb();

  // Get subscription data for a seller
  async getSubscription(sellerId: number): Promise<SubscriptionData | null> {
    try {
      // Get subscription
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.sellerId, sellerId))
        .limit(1);

      if (subscription.length === 0) {
        return null;
      }

      const sub = subscription[0];
      const plan = PLANS[sub.plan as PlanId] || PLANS.free;

      // Get current usage
      const usage = await this.getCurrentUsage(sellerId);

      // Get payment method
      let paymentMethod = null;
      if (sub.stripeCustomerId) {
        const paymentMethods = await this.db
          .select()
          .from(subscriptionPaymentMethods)
          .where(
            and(
              eq(subscriptionPaymentMethods.sellerId, sellerId),
              eq(subscriptionPaymentMethods.isDefault, true),
              eq(subscriptionPaymentMethods.status, 'active')
            )
          )
          .limit(1);

        if (paymentMethods.length > 0) {
          const pm = paymentMethods[0];
          paymentMethod = {
            type: pm.type,
            brand: pm.brand || '',
            last4: pm.last4 || '',
          };
        }
      }

      // Get recent invoices
      const invoiceList = await this.db
        .select({
          id: subscriptionInvoices.id,
          invoiceNumber: subscriptionInvoices.invoiceNumber,
          total: subscriptionInvoices.total,
          status: subscriptionInvoices.status,
          invoiceDate: subscriptionInvoices.invoiceDate,
          dueDate: subscriptionInvoices.dueDate,
          pdfUrl: subscriptionInvoices.pdfUrl,
        })
        .from(subscriptionInvoices)
        .where(eq(subscriptionInvoices.sellerId, sellerId))
        .orderBy(desc(subscriptionInvoices.createdAt))
        .limit(10);

      return {
        id: sub.id,
        sellerId: sub.sellerId,
        plan: sub.plan as PlanId,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart || undefined,
        currentPeriodEnd: sub.currentPeriodEnd || undefined,
        gracePeriodEnd: sub.gracePeriodEnd || undefined,
        stripeCustomerId: sub.stripeCustomerId || undefined,
        stripeSubscriptionId: sub.stripeSubscriptionId || undefined,
        usage,
        paymentMethod: paymentMethod || undefined,
        invoices: invoiceList.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.total / 100, // Convert from cents
          status: inv.status,
          date: inv.invoiceDate,
          dueDate: inv.dueDate || undefined,
          pdfUrl: inv.pdfUrl || undefined,
        })),
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  // Get current usage for a seller
  async getCurrentUsage(sellerId: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get subscription to determine limits
    const subscription = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.sellerId, sellerId))
      .limit(1);

    const plan = subscription.length > 0 ? PLANS[subscription[0].plan as PlanId] : PLANS.free;

    // Count products
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

    // Calculate storage usage (mock for now - would calculate actual file sizes)
    const storageUsed = 0; // TODO: Implement actual storage calculation

    return {
      products: {
        current: productCount[0]?.count || 0,
        limit: plan.limits.products,
      },
      orders: {
        current: orderCount[0]?.count || 0,
        limit: plan.limits.ordersPerMonth,
      },
      storage: {
        current: storageUsed,
        limit: -1, // TODO: Add storage limits to plans
      },
    };
  }

  // Create a new subscription
  async createSubscription(
    sellerId: number,
    plan: PlanId,
    paymentMethodId?: string
  ): Promise<{ subscription: any; clientSecret?: string }> {
    try {
      // Get seller details
      const seller = await this.db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1);

      if (seller.length === 0) {
        throw new Error('Seller not found');
      }

      const sellerData = seller[0];
      const email = sellerData.email || '';
      const name = sellerData.name || '';

      if (plan === 'free') {
        // Create local subscription record for free plan
        const [newSub] = await this.db
          .insert(subscriptions)
          .values({
            sellerId,
            plan: 'free',
            status: 'active',
          })
          .returning();

        // Update seller's plan
        await this.db
          .update(sellers)
          .set({ plan: 'free', updatedAt: new Date() })
          .where(eq(sellers.id, sellerId));

        return { subscription: newSub };
      }

      // For paid plans, create Stripe customer and subscription
      const customer = await createOrRetrieveStripeCustomer(sellerId, email, name);
      
      const priceId = getStripePriceFromPlan(plan);
      if (!priceId) {
        throw new Error('Invalid plan for Stripe subscription');
      }

      const stripeSubscription = await createStripeSubscription(
        customer.id,
        priceId,
        sellerId,
        paymentMethodId
      ) as any;

      // Create local subscription record
      const [newSub] = await this.db
        .insert(subscriptions)
        .values({
          sellerId,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: priceId,
          plan,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        })
        .returning();

      // Update seller's plan
      await this.db
        .update(sellers)
        .set({ plan, updatedAt: new Date() })
        .where(eq(sellers.id, sellerId));

      // Log billing event
      await this.logBillingEvent(sellerId, newSub.id, 'subscription.created', {
        stripeSubscriptionId: stripeSubscription.id,
        plan,
      });

      let clientSecret = undefined;
      if (
        stripeSubscription.latest_invoice &&
        typeof stripeSubscription.latest_invoice === 'object' &&
        stripeSubscription.latest_invoice.payment_intent &&
        typeof stripeSubscription.latest_invoice.payment_intent === 'object'
      ) {
        clientSecret = stripeSubscription.latest_invoice.payment_intent.client_secret;
      }

      return { subscription: newSub, clientSecret };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Upgrade/downgrade subscription
  async changeSubscription(
    sellerId: number,
    newPlan: PlanId,
    effectiveImmediately = true
  ): Promise<any> {
    try {
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.sellerId, sellerId))
        .limit(1);

      if (subscription.length === 0) {
        throw new Error('No subscription found');
      }

      const currentSub = subscription[0];
      const oldPlan = currentSub.plan;

      // If changing to free, cancel Stripe subscription
      if (newPlan === 'free') {
        if (currentSub.stripeSubscriptionId) {
          await cancelStripeSubscription(currentSub.stripeSubscriptionId, !effectiveImmediately);
        }

        // Update local subscription
        await this.db
          .update(subscriptions)
          .set({
            plan: 'free',
            status: effectiveImmediately ? 'canceled' : 'active',
            cancelAtPeriodEnd: !effectiveImmediately,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, currentSub.id));

        // Update seller's plan
        await this.db
          .update(sellers)
          .set({ plan: newPlan, updatedAt: new Date() })
          .where(eq(sellers.id, sellerId));

        // Log the change
        await this.logPlanChange(sellerId, currentSub.id, oldPlan, newPlan, 'downgrade');

        return { success: true };
      }

      // For paid plan changes
      const newPriceId = getStripePriceFromPlan(newPlan);
      if (!newPriceId) {
        throw new Error('Invalid target plan');
      }

      let updatedStripeSubscription;
      
      if (currentSub.stripeSubscriptionId) {
        // Update existing Stripe subscription
        updatedStripeSubscription = await updateStripeSubscription(
          currentSub.stripeSubscriptionId,
          newPriceId,
          effectiveImmediately ? 'create_prorations' : 'none'
        ) as any;
      } else {
        // Create new Stripe subscription (upgrade from free)
        const seller = await this.db
          .select()
          .from(sellers)
          .where(eq(sellers.id, sellerId))
          .limit(1);

        if (seller.length === 0) {
          throw new Error('Seller not found');
        }

        const sellerData = seller[0];
        const customer = await createOrRetrieveStripeCustomer(
          sellerId,
          sellerData.email || '',
          sellerData.name || ''
        );

        updatedStripeSubscription = await createStripeSubscription(
          customer.id,
          newPriceId,
          sellerId
        ) as any;

        // Update local record with Stripe IDs
        await this.db
          .update(subscriptions)
          .set({
            stripeCustomerId: customer.id,
            stripeSubscriptionId: updatedStripeSubscription.id,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, currentSub.id));
      }

      // Update local subscription record
      await this.db
        .update(subscriptions)
        .set({
          plan: newPlan,
          stripePriceId: newPriceId,
          status: updatedStripeSubscription.status,
          currentPeriodStart: new Date(updatedStripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedStripeSubscription.current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSub.id));

      // Update seller's plan
      await this.db
        .update(sellers)
        .set({ plan: newPlan, updatedAt: new Date() })
        .where(eq(sellers.id, sellerId));

      // Log the change
      const changeType = this.getChangeType(oldPlan, newPlan);
      await this.logPlanChange(sellerId, currentSub.id, oldPlan, newPlan, changeType);

      return { success: true, stripeSubscription: updatedStripeSubscription };
    } catch (error) {
      console.error('Error changing subscription:', error);
      throw error;
    }
  }

  // Handle Stripe webhook events
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      const sellerId = this.extractSellerIdFromEvent(event);
      
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }

      // Log the event
      if (sellerId) {
        await this.logBillingEvent(sellerId, null, event.type, event.data.object, event.id);
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  // Record usage for billing period
  async recordUsage(sellerId: number, periodStart: Date, periodEnd: Date): Promise<void> {
    try {
      const usage = await this.getCurrentUsage(sellerId);
      
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.sellerId, sellerId))
        .limit(1);

      if (subscription.length === 0) return;

      const plan = PLANS[subscription[0].plan as PlanId] || PLANS.free;
      
      // Check if usage record already exists for this period
      const existingRecord = await this.db
        .select()
        .from(usageRecords)
        .where(
          and(
            eq(usageRecords.sellerId, sellerId),
            eq(usageRecords.periodStart, periodStart),
            eq(usageRecords.periodEnd, periodEnd)
          )
        )
        .limit(1);

      if (existingRecord.length > 0) {
        // Update existing record
        await this.db
          .update(usageRecords)
          .set({
            productsUsed: usage.products.current,
            ordersProcessed: usage.orders.current,
            storageUsedMB: usage.storage.current,
            limitExceeded: this.checkIfLimitsExceeded(usage, plan),
            updatedAt: new Date(),
          })
          .where(eq(usageRecords.id, existingRecord[0].id));
      } else {
        // Create new record
        await this.db
          .insert(usageRecords)
          .values({
            sellerId,
            subscriptionId: subscription[0].id,
            periodStart,
            periodEnd,
            productsUsed: usage.products.current,
            ordersProcessed: usage.orders.current,
            storageUsedMB: usage.storage.current,
            productsLimit: plan.limits.products,
            ordersLimit: plan.limits.ordersPerMonth,
            storageLimitMB: -1, // TODO: Add storage limits
            limitExceeded: this.checkIfLimitsExceeded(usage, plan),
          });
      }
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }

  // Start grace period for failed payment
  async startGracePeriod(sellerId: number, gracePeriodDays = 7): Promise<void> {
    try {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

      await this.db
        .update(subscriptions)
        .set({
          gracePeriodStart: new Date(),
          gracePeriodEnd: gracePeriodEnd,
          status: 'past_due',
          metadata: sql`jsonb_set(coalesce(metadata, '{}'), '{lastPaymentFailed}', 'true')`,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.sellerId, sellerId));

      await this.logBillingEvent(sellerId, null, 'grace_period_started', {
        gracePeriodDays,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
      });
    } catch (error) {
      console.error('Error starting grace period:', error);
      throw error;
    }
  }

  // End grace period and downgrade to free plan
  async endGracePeriod(sellerId: number): Promise<void> {
    try {
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.sellerId, sellerId))
        .limit(1);

      if (subscription.length === 0) return;

      const currentSub = subscription[0];
      
      // Cancel Stripe subscription
      if (currentSub.stripeSubscriptionId) {
        await cancelStripeSubscription(currentSub.stripeSubscriptionId, false);
      }

      // Update to free plan
      await this.db
        .update(subscriptions)
        .set({
          plan: 'free',
          status: 'canceled',
          gracePeriodStart: null,
          gracePeriodEnd: null,
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, currentSub.id));

      // Update seller's plan
      await this.db
        .update(sellers)
        .set({ plan: 'free', updatedAt: new Date() })
        .where(eq(sellers.id, sellerId));

      await this.logBillingEvent(sellerId, currentSub.id, 'grace_period_ended', {
        downgradedToPlan: 'free',
      });
    } catch (error) {
      console.error('Error ending grace period:', error);
      throw error;
    }
  }

  // Helper methods
  private async handleSubscriptionUpdate(subscription: any) {
    const sellerId = parseInt(subscription.metadata.sellerId || '0');
    if (!sellerId) return;

    const plan = getPlanFromStripePrice(subscription.items.data[0].price.id);

    await this.db
      .update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        plan: plan as PlanId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Update seller's plan
    await this.db
      .update(sellers)
      .set({ plan: plan as PlanId, updatedAt: new Date() })
      .where(eq(sellers.id, sellerId));
  }

  private async handleSubscriptionCancellation(subscription: any) {
    await this.db
      .update(subscriptions)
      .set({
        status: 'canceled',
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  }

  private async handleInvoicePaymentSucceeded(invoice: any) {
    // Clear grace period if payment succeeds
    if (invoice.subscription) {
      await this.db
        .update(subscriptions)
        .set({
          status: 'active',
          gracePeriodStart: null,
          gracePeriodEnd: null,
          metadata: sql`jsonb_set(coalesce(metadata, '{}'), '{lastPaymentFailed}', 'false')`,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));
    }
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    // Start grace period
    if (invoice.subscription && invoice.customer) {
      const subscription = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string))
        .limit(1);

      if (subscription.length > 0) {
        await this.startGracePeriod(subscription[0].sellerId);
      }
    }
  }

  private async handleTrialWillEnd(subscription: any) {
    // TODO: Send notification about trial ending
  }

  private extractSellerIdFromEvent(event: Stripe.Event): number | null {
    const obj = event.data.object as any;
    
    if (obj.metadata?.sellerId) {
      return parseInt(obj.metadata.sellerId);
    }

    // Try to get from customer metadata
    if (obj.customer) {
      try {
        // This would require a database lookup or Stripe API call
        // For now, return null
      } catch (error) {
        // Ignore
      }
    }

    return null;
  }

  private getChangeType(oldPlan: string, newPlan: string): 'upgrade' | 'downgrade' {
    const planOrder = { free: 0, pro: 1, business: 2 };
    const oldOrder = planOrder[oldPlan as keyof typeof planOrder] || 0;
    const newOrder = planOrder[newPlan as keyof typeof planOrder] || 0;
    return newOrder > oldOrder ? 'upgrade' : 'downgrade';
  }

  private checkIfLimitsExceeded(usage: any, plan: any): boolean {
    if (plan.limits.products !== -1 && usage.products.current > plan.limits.products) {
      return true;
    }
    if (plan.limits.ordersPerMonth !== -1 && usage.orders.current > plan.limits.ordersPerMonth) {
      return true;
    }
    return false;
  }

  private async logBillingEvent(
    sellerId: number,
    subscriptionId: number | null,
    eventType: string,
    eventData: any,
    stripeEventId?: string
  ) {
    try {
      await this.db.insert(billingEvents).values({
        sellerId,
        subscriptionId,
        eventType,
        eventData,
        stripeEventId,
      });
    } catch (error) {
      console.error('Error logging billing event:', error);
    }
  }

  private async logPlanChange(
    sellerId: number,
    subscriptionId: number,
    fromPlan: string,
    toPlan: string,
    changeType: 'upgrade' | 'downgrade'
  ) {
    try {
      await this.db.insert(planChangeRequests).values({
        sellerId,
        subscriptionId,
        fromPlan,
        toPlan,
        changeType,
        status: 'completed',
        effectiveDate: new Date(),
      });
    } catch (error) {
      console.error('Error logging plan change:', error);
    }
  }
}