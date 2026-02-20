import { NextRequest } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import { SubscriptionService } from '@/lib/subscription-service';
import { InvoiceService } from '@/lib/invoice-service';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Construct and verify the webhook event
    const event = constructWebhookEvent(body, signature);
    
    console.log(`Received Stripe webhook: ${event.type} (${event.id})`);

    const subscriptionService = new SubscriptionService();
    const invoiceService = new InvoiceService();

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, subscriptionService);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, subscriptionService);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(event, invoiceService);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event, invoiceService);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, subscriptionService, invoiceService);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, subscriptionService);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event, subscriptionService);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Let the subscription service handle the webhook for additional processing
    await subscriptionService.handleStripeWebhook(event);

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    
    if (error instanceof Error && error.message.includes('signature')) {
      return Response.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdated(
  event: Stripe.Event,
  subscriptionService: SubscriptionService
) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Subscription ${subscription.id} updated, status: ${subscription.status}`);
  
  // The SubscriptionService.handleStripeWebhook will handle the database updates
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  subscriptionService: SubscriptionService
) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Subscription ${subscription.id} deleted`);
  
  // The SubscriptionService.handleStripeWebhook will handle the database updates
}

async function handleInvoiceCreated(
  event: Stripe.Event,
  invoiceService: InvoiceService
) {
  const invoice = event.data.object as any; // Stripe webhook invoice object
  console.log(`Invoice ${invoice.id} created for subscription ${invoice.subscription}`);
  
  // Extract seller ID from subscription metadata
  const sellerId = getSellerIdFromInvoice(invoice);
  if (sellerId) {
    try {
      await invoiceService.createInvoiceFromStripe(invoice, sellerId);
      console.log(`Created local invoice record for Stripe invoice ${invoice.id}`);
    } catch (error) {
      console.error('Error creating local invoice:', error);
    }
  }
}

async function handleInvoiceFinalized(
  event: Stripe.Event,
  invoiceService: InvoiceService
) {
  const invoice = event.data.object as any;
  console.log(`Invoice ${invoice.id} finalized`);
  
  // Generate PDF for the finalized invoice
  const sellerId = getSellerIdFromInvoice(invoice);
  if (sellerId) {
    try {
      // Find the local invoice record
      const localInvoices = await invoiceService.getInvoicesForSeller(sellerId, 100);
      const localInvoice = localInvoices.find(inv => 
        (inv as any).stripeInvoiceId === invoice.id
      );
      
      if (localInvoice) {
        await invoiceService.generatePDF(localInvoice.id);
        console.log(`Generated PDF for invoice ${invoice.id}`);
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    }
  }
}

async function handleInvoicePaymentSucceeded(
  event: Stripe.Event,
  subscriptionService: SubscriptionService,
  invoiceService: InvoiceService
) {
  const invoice = event.data.object as any;
  console.log(`Payment succeeded for invoice ${invoice.id}`);
  
  const sellerId = getSellerIdFromInvoice(invoice);
  if (sellerId) {
    try {
      // Find and mark the local invoice as paid
      const localInvoices = await invoiceService.getInvoicesForSeller(sellerId, 100);
      const localInvoice = localInvoices.find(inv => 
        (inv as any).stripeInvoiceId === invoice.id
      );
      
      if (localInvoice) {
        const paidAt = invoice.status_transitions?.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date();
        
        await invoiceService.markInvoiceAsPaid(localInvoice.id, paidAt);
        console.log(`Marked local invoice ${localInvoice.id} as paid`);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  }
}

async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  subscriptionService: SubscriptionService
) {
  const invoice = event.data.object as any;
  console.log(`Payment failed for invoice ${invoice.id}`);
  
  // The SubscriptionService will handle starting the grace period
}

async function handleTrialWillEnd(
  event: Stripe.Event,
  subscriptionService: SubscriptionService
) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Trial will end for subscription ${subscription.id}`);
  
  // TODO: Send notification to seller about trial ending
  const sellerId = getSellerIdFromSubscription(subscription);
  if (sellerId) {
    // Here you could send an email or in-app notification
    console.log(`Trial ending soon for seller ${sellerId}`);
  }
}

async function handlePaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
  
  // TODO: Update local payment method records
}

// Helper functions to extract seller ID from Stripe objects
function getSellerIdFromInvoice(invoice: any): number | null {
  // Try to get seller ID from subscription metadata
  if (invoice.subscription && typeof invoice.subscription === 'object' && invoice.subscription.metadata?.sellerId) {
    return parseInt(invoice.subscription.metadata.sellerId);
  }
  
  // Try to get from customer metadata
  if (invoice.customer && typeof invoice.customer === 'object' && invoice.customer.metadata?.sellerId) {
    return parseInt(invoice.customer.metadata.sellerId);
  }
  
  return null;
}

function getSellerIdFromSubscription(subscription: Stripe.Subscription): number | null {
  if (subscription.metadata?.sellerId) {
    return parseInt(subscription.metadata.sellerId);
  }
  return null;
}