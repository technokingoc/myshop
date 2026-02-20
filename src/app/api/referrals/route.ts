import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { referralPrograms, referralLinks, referralTracking, sellers, stores } from "@/lib/schema";
import { getSessionFromCookie } from "@/lib/session";
import { eq, sql, desc } from "drizzle-orm";
// Simple random string generator instead of nanoid
const generateCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const db = getDb();

    if (action === "stats") {
      // Get referral statistics
      const links = await db
        .select({
          clicks: referralLinks.clicks,
          conversions: referralLinks.conversions,
          totalRevenue: referralLinks.totalRevenue,
          isActive: referralLinks.isActive,
        })
        .from(referralLinks)
        .where(eq(referralLinks.sellerId, session.sellerId));

      const stats = {
        totalClicks: links.reduce((sum, link) => sum + (link.clicks || 0), 0),
        totalConversions: links.reduce((sum, link) => sum + (link.conversions || 0), 0),
        totalRevenue: links.reduce((sum, link) => sum + parseFloat(link.totalRevenue?.toString() || "0"), 0),
        activeLinks: links.filter(link => link.isActive).length,
      };

      return NextResponse.json(stats);
    }

    // Get referral links for this seller
    const links = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.sellerId, session.sellerId))
      .orderBy(desc(referralLinks.createdAt))
      .limit(20);

    return NextResponse.json({ links });

  } catch (error) {
    console.error("Error in referrals API:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUrl, validityDays = 30 } = await req.json();

    const db = getDb();

    // Check if seller has a referral program, create one if not
    let program = await db
      .select()
      .from(referralPrograms)
      .where(eq(referralPrograms.sellerId, session.sellerId))
      .limit(1);

    if (program.length === 0) {
      const [newProgram] = await db
        .insert(referralPrograms)
        .values({
          sellerId: session.sellerId,
          name: "Referral Program",
          description: "Earn rewards by referring new customers",
          isActive: true,
        })
        .returning();
      
      program = [newProgram];
    }

    // Generate unique referral code
    let code: string;
    let isUnique = false;
    let attempts = 0;
    
    do {
      code = `REF-${generateCode()}`;
      const existing = await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.code, code))
        .limit(1);
      
      isUnique = existing.length === 0;
      attempts++;
    } while (!isUnique && attempts < 5);

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
    }

    // Create expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Create new referral link
    const [newLink] = await db
      .insert(referralLinks)
      .values({
        programId: program[0].id,
        sellerId: session.sellerId,
        code,
        targetUrl: targetUrl || null,
        clicks: 0,
        conversions: 0,
        totalRevenue: "0",
        isActive: true,
        expiresAt,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      link: newLink,
      message: "Referral link created successfully"
    });

  } catch (error) {
    console.error("Error creating referral link:", error);
    return NextResponse.json(
      { error: "Failed to create referral link" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = parseInt(searchParams.get("id") || "0");

    if (!linkId) {
      return NextResponse.json({ error: "Link ID required" }, { status: 400 });
    }

    const db = getDb();

    // Delete referral link (only if it belongs to the current seller)
    const result = await db
      .delete(referralLinks)
      .where(
        sql`${referralLinks.id} = ${linkId} AND ${referralLinks.sellerId} = ${session.sellerId}`
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Link deleted successfully" });

  } catch (error) {
    console.error("Error deleting referral link:", error);
    return NextResponse.json(
      { error: "Failed to delete referral link" },
      { status: 500 }
    );
  }
}