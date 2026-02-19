import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { flashSales } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const rows = await db.select().from(flashSales)
      .where(eq(flashSales.sellerId, session.sellerId))
      .orderBy(flashSales.startTime);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Flash sales GET error:", error);
    return NextResponse.json({ error: "Failed to load flash sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const body = await req.json();
    const { 
      name, 
      description, 
      discountType, 
      discountValue, 
      maxDiscount,
      minOrderAmount, 
      maxUses, 
      startTime, 
      endTime,
      products,
      bannerText,
      bannerColor,
      showCountdown
    } = body;

    if (!name || !discountValue || !startTime || !endTime) {
      return NextResponse.json({ 
        error: "name, discountValue, startTime, and endTime are required" 
      }, { status: 400 });
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return NextResponse.json({ 
        error: "End time must be after start time" 
      }, { status: 400 });
    }

    const [row] = await db.insert(flashSales).values({
      sellerId: session.sellerId,
      name: name.trim(),
      description: description || "",
      discountType: discountType || "percentage",
      discountValue: String(discountValue),
      maxDiscount: String(maxDiscount || 0),
      minOrderAmount: String(minOrderAmount || 0),
      maxUses: maxUses ?? -1,
      startTime: start,
      endTime: end,
      products: products || "",
      bannerText: bannerText || `Flash Sale: ${discountType === 'percentage' ? discountValue + '% OFF' : '$' + discountValue + ' OFF'}!`,
      bannerColor: bannerColor || "#ef4444",
      showCountdown: showCountdown !== false,
      active: true,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error: unknown) {
    console.error("Flash sales POST error:", error);
    return NextResponse.json({ error: "Failed to create flash sale" }, { status: 500 });
  }
}