import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    const db = getDb();
    
    // Update the notification to acknowledged (we'll use a metadata flag since there's no acknowledged status)
    const result = await db
      .update(notifications)
      .set({
        metadata: {
          acknowledged: true,
          acknowledgedAt: new Date().toISOString(),
        },
      })
      .where(
        and(
          eq(notifications.id, alertId),
          eq(notifications.sellerId, sellerId)
        )
      )
      .returning({ id: notifications.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Alert acknowledged successfully",
    });

  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}