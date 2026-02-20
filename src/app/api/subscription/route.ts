import { NextRequest } from "next/server";
import { SubscriptionService } from "@/lib/subscription-service";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get seller from session/auth
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const subscriptionService = new SubscriptionService();
    
    // Get subscription data
    const subscription = await subscriptionService.getSubscription(sellerId);
    
    if (!subscription) {
      // No subscription found, return default free plan data
      const usage = await subscriptionService.getCurrentUsage(sellerId);
      
      return Response.json({
        currentPlan: "free",
        status: "active",
        nextBillingDate: null,
        gracePeriodEnds: null,
        usage,
        paymentMethod: null,
        invoices: [],
      });
    }
    
    // Format response data
    const subscriptionData = {
      currentPlan: subscription.plan,
      status: subscription.status,
      nextBillingDate: subscription.currentPeriodEnd?.toISOString() || null,
      gracePeriodEnds: subscription.gracePeriodEnd?.toISOString() || null,
      usage: subscription.usage,
      paymentMethod: subscription.paymentMethod,
      invoices: subscription.invoices.map(invoice => ({
        id: invoice.id.toString(),
        amount: invoice.amount,
        status: invoice.status,
        date: invoice.date.toISOString(),
        downloadUrl: `/api/invoices/${invoice.id}/download`,
        pdfUrl: invoice.pdfUrl,
      })),
    };
    
    return Response.json(subscriptionData);
  } catch (error) {
    console.error("Subscription API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}