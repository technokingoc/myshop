import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  
  if (!stripeInstance) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  
  return stripeInstance;
}

// Export for backward compatibility
export const stripe = stripeInstance;

// Stripe product and price IDs for each plan
export const STRIPE_PLANS = {
  pro: {
    productId: process.env.STRIPE_PRO_PRODUCT_ID || 'prod_pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    amount: 1900, // $19.00 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
  business: {
    productId: process.env.STRIPE_BUSINESS_PRODUCT_ID || 'prod_business',
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly',
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
};

// Initialize Stripe products and prices (run once during deployment)
export async function initializeStripeProducts() {
  try {
    const stripe = getStripe();
    
    // Create Pro plan product and price
    const proProduct = await stripe.products.create({
      name: 'MyShop Pro Plan',
      description: '100 products, unlimited orders, advanced analytics',
      metadata: {
        plan: 'pro',
      },
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: STRIPE_PLANS.pro.amount,
      currency: STRIPE_PLANS.pro.currency,
      recurring: {
        interval: STRIPE_PLANS.pro.interval,
      },
      metadata: {
        plan: 'pro',
      },
    });

    // Create Business plan product and price
    const businessProduct = await stripe.products.create({
      name: 'MyShop Business Plan',
      description: 'Unlimited products and orders, priority support, API access',
      metadata: {
        plan: 'business',
      },
    });

    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: STRIPE_PLANS.business.amount,
      currency: STRIPE_PLANS.business.currency,
      recurring: {
        interval: STRIPE_PLANS.business.interval,
      },
      metadata: {
        plan: 'business',
      },
    });

    console.log('Stripe products and prices initialized successfully');
    return { proProduct, proPrice, businessProduct, businessPrice };
  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      console.log('Stripe products and prices already exist');
      return null;
    }
    console.error('Error initializing Stripe products:', error);
    throw error;
  }
}

// Create or retrieve a Stripe customer
export async function createOrRetrieveStripeCustomer(sellerId: number, email: string, name: string) {
  try {
    const stripe = getStripe();
    
    // Try to find existing customer by metadata
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      // Update metadata if needed
      if (!customer.metadata.sellerId) {
        await stripe.customers.update(customer.id, {
          metadata: {
            sellerId: sellerId.toString(),
          },
        });
      }
      return customer;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        sellerId: sellerId.toString(),
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw error;
  }
}

// Create a subscription
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  sellerId: number,
  paymentMethodId?: string
) {
  try {
    const stripe = getStripe();
    
    const subscriptionData: any = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        sellerId: sellerId.toString(),
      },
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

// Update subscription (for plan changes)
export async function updateStripeSubscription(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
) {
  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: prorationBehavior,
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating Stripe subscription:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelStripeSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
  try {
    const stripe = getStripe();
    
    if (cancelAtPeriodEnd) {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    } else {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    }
  } catch (error) {
    console.error('Error cancelling Stripe subscription:', error);
    throw error;
  }
}

// Get upcoming invoice preview for plan changes
export async function getUpcomingInvoicePreview(customerId: string, subscriptionId: string, newPriceId: string) {
  try {
    // TODO: Implement upcoming invoice preview with correct Stripe API method
    console.log('Upcoming invoice preview not yet implemented');
    return null;
  } catch (error) {
    console.error('Error retrieving upcoming invoice preview:', error);
    throw error;
  }
}

// Retry payment for past due subscription
export async function retrySubscriptionPayment(subscriptionId: string, paymentMethodId?: string) {
  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice'],
    });

    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as any;
      
      if (paymentMethodId) {
        // Update default payment method
        await stripe.customers.update(subscription.customer as string, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Retry the invoice payment
      if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
        const paymentIntent = await stripe.paymentIntents.confirm(invoice.payment_intent);
        return paymentIntent;
      }
    }

    throw new Error('No payment intent found for subscription');
  } catch (error) {
    console.error('Error retrying subscription payment:', error);
    throw error;
  }
}

// Webhook signature verification
export function constructWebhookEvent(body: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

// Get plan info from Stripe price metadata (requires price object expansion)
export function getPlanFromStripePrice(priceId: string): string {
  // In a real implementation, you'd look up the price and check its metadata
  // For now, we'll need to store and lookup the price IDs dynamically
  return 'free';
}

// Get Stripe price ID from plan - these need to be stored after creation
export function getStripePriceFromPlan(plan: string): string | null {
  // In a real implementation, you'd store the created price IDs in your database
  // or environment variables after running initializeStripeProducts
  const priceIds = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    business: process.env.STRIPE_BUSINESS_PRICE_ID,
  };
  
  return priceIds[plan as keyof typeof priceIds] || null;
}

// Format amount from Stripe (cents) to display format
export function formatStripeAmount(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}