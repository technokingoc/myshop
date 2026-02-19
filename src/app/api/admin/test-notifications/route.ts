// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { notifyOrderPlaced, notifyLowStock, notifyNewReview } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const sellerId = session?.sellerId;
    
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized - seller login required" }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body;

    console.log(`Testing notification type: ${type} for seller ${sellerId}`);

    switch (type) {
      case "order":
        // Test order notification
        await notifyOrderPlaced(
          999999, // Fake order ID
          sellerId,
          null // No customer ID for test
        );
        break;

      case "inventory":
        // Test low stock notification
        await notifyLowStock(
          1, // Fake product ID
          sellerId,
          2, // Current stock
          5  // Threshold
        );
        break;

      case "review":
        // Test review notification
        await notifyNewReview(
          1, // Fake review ID
          sellerId
        );
        break;

      default:
        return NextResponse.json({ error: "Invalid test type. Use: order, inventory, or review" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} notification created successfully`,
      sellerId 
    });

  } catch (error) {
    console.error("Test notification failed:", error);
    return NextResponse.json(
      { error: "Test notification failed", details: String(error) },
      { status: 500 }
    );
  }
}