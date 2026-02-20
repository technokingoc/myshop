import { NextRequest, NextResponse } from "next/server";
import { WebhookService } from "@/lib/webhook-service";

// POST /api/cron/webhook-retries - Process pending webhook retries
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional security)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Processing webhook retries...");
    await WebhookService.processRetries();

    return NextResponse.json({
      success: true,
      message: "Webhook retries processed",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error processing webhook retries:", error);
    return NextResponse.json(
      { 
        error: "Failed to process webhook retries", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: "webhook-retries",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
}