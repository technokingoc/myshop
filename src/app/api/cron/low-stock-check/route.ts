import { NextRequest, NextResponse } from "next/server";
import { checkLowStock } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  // Verify this is coming from a cron job or authorized source
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "dev-secret";
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkLowStock();
    return NextResponse.json({ success: true, message: "Low stock check completed" });
  } catch (error) {
    console.error("Low stock check failed:", error);
    return NextResponse.json({ error: "Low stock check failed" }, { status: 500 });
  }
}

// Allow GET for testing in development
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }
  
  try {
    await checkLowStock();
    return NextResponse.json({ success: true, message: "Low stock check completed" });
  } catch (error) {
    console.error("Low stock check failed:", error);
    return NextResponse.json({ error: "Low stock check failed" }, { status: 500 });
  }
}