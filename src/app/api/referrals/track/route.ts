import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { referralLinks, referralTracking } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { referralCode, action = "click", orderId, orderValue, customerId } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const db = getDb();

    // Find the referral link
    const [link] = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.code, referralCode))
      .limit(1);

    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Invalid or inactive referral link" }, { status: 404 });
    }

    // Check if link is expired
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return NextResponse.json({ error: "Referral link has expired" }, { status: 400 });
    }

    // Get visitor information from headers
    const userAgent = req.headers.get("user-agent") || "";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const referrer = req.headers.get("referer") || "";

    // Create visitor fingerprint (simple hash of IP + User Agent)
    const visitorId = `${ipAddress}_${userAgent}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 128);

    // Track the action
    await db.insert(referralTracking).values({
      linkId: link.id,
      visitorId,
      ipAddress: ipAddress.substring(0, 45), // IPv6 limit
      userAgent,
      referrer,
      action,
      orderId: orderId || null,
      customerId: customerId || null,
      orderValue: orderValue ? orderValue.toString() : "0",
      rewardAmount: "0", // Will be calculated based on program settings
    });

    // Update link statistics
    if (action === "click") {
      await db
        .update(referralLinks)
        .set({ 
          clicks: sql`${referralLinks.clicks} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(referralLinks.id, link.id));
    } else if (action === "conversion" || action === "purchase") {
      const revenue = parseFloat(orderValue || "0");
      await db
        .update(referralLinks)
        .set({ 
          conversions: sql`${referralLinks.conversions} + 1`,
          totalRevenue: sql`${referralLinks.totalRevenue} + ${revenue}`,
          updatedAt: new Date(),
        })
        .where(eq(referralLinks.id, link.id));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Referral tracked successfully",
      linkInfo: {
        code: link.code,
        targetUrl: link.targetUrl,
      }
    });

  } catch (error) {
    console.error("Error tracking referral:", error);
    return NextResponse.json(
      { error: "Failed to track referral" },
      { status: 500 }
    );
  }
}