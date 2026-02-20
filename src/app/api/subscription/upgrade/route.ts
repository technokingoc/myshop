import { NextRequest } from "next/server";
import { SubscriptionService } from "@/lib/subscription-service";
import { getSellerFromSession } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, paymentMethodId, effectiveImmediately = true } = body;
    
    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }
    
    // Get seller from session/auth
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const subscriptionService = new SubscriptionService();
    
    // Check if this is a new subscription or plan change
    const currentSubscription = await subscriptionService.getSubscription(sellerId);
    
    if (!currentSubscription || currentSubscription.plan === 'free') {
      // Creating new subscription
      const result = await subscriptionService.createSubscription(
        sellerId,
        plan as PlanId,
        paymentMethodId
      );
      
      return Response.json({
        success: true,
        message: "Subscription created successfully",
        subscription: result.subscription,
        clientSecret: result.clientSecret,
        newPlan: plan,
      });
    } else {
      // Changing existing subscription
      const result = await subscriptionService.changeSubscription(
        sellerId,
        plan as PlanId,
        effectiveImmediately
      );
      
      return Response.json({
        success: true,
        message: "Plan changed successfully",
        newPlan: plan,
        stripeSubscription: result.stripeSubscription,
      });
    }
  } catch (error) {
    console.error("Subscription upgrade error:", error);
    
    let errorMessage = "Failed to update subscription";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}