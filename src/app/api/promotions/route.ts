import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { promotions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const rows = await db.select().from(promotions)
      .where(eq(promotions.sellerId, session.sellerId))
      .orderBy(promotions.priority, promotions.createdAt);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Promotions GET error:", error);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const body = await req.json();
    const { 
      title, 
      description, 
      type, 
      bannerImageUrl, 
      backgroundColor, 
      textColor, 
      linkUrl, 
      priority, 
      validFrom, 
      validUntil 
    } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const [row] = await db.insert(promotions).values({
      sellerId: session.sellerId,
      title: title.trim(),
      description: description || "",
      type: type || "banner",
      bannerImageUrl: bannerImageUrl || "",
      backgroundColor: backgroundColor || "#3b82f6",
      textColor: textColor || "#ffffff",
      linkUrl: linkUrl || "",
      priority: priority || 0,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      active: true,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error: unknown) {
    console.error("Promotions POST error:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}