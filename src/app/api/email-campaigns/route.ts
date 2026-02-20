import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { emailCampaigns, stores, sellers } from "@/lib/schema";
import { getSessionFromCookie } from "@/lib/session";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Get email campaigns for this seller
    const campaigns = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.sellerId, session.sellerId))
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(50);

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error("Error in email campaigns API:", error);
    return NextResponse.json(
      { error: "Failed to fetch email campaigns" },
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

    const { 
      name, 
      subject, 
      content, 
      audienceType = "all", 
      audienceFilter = {}, 
      scheduleType = "draft",
      scheduledAt 
    } = await req.json();

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: "Name, subject, and content are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Calculate estimated recipients based on audience type
    let estimatedRecipients = 0;
    switch (audienceType) {
      case "all":
        estimatedRecipients = 350; // Mock number
        break;
      case "customers":
        estimatedRecipients = 150; // Mock number
        break;
      case "subscribers":
        estimatedRecipients = 95; // Mock number
        break;
    }

    // Apply audience filters to estimate
    if (audienceFilter.city) estimatedRecipients = Math.floor(estimatedRecipients * 0.3);
    if (audienceFilter.minPurchases) estimatedRecipients = Math.floor(estimatedRecipients * 0.6);

    // Determine status and dates based on schedule type
    let status = "draft";
    let scheduledAtDate = null;
    let sentAtDate = null;

    if (scheduleType === "now") {
      status = "sent";
      sentAtDate = new Date();
    } else if (scheduleType === "later" && scheduledAt) {
      status = "scheduled";
      scheduledAtDate = new Date(scheduledAt);
    }

    // Create new email campaign
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values({
        sellerId: session.sellerId,
        name,
        subject,
        content,
        audienceType,
        audienceFilter,
        status,
        scheduledAt: scheduledAtDate,
        sentAt: sentAtDate,
        estimatedRecipients,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      campaign: newCampaign,
      message: `Campaign ${status === 'sent' ? 'sent' : status === 'scheduled' ? 'scheduled' : 'saved as draft'} successfully`
    });

  } catch (error) {
    console.error("Error creating email campaign:", error);
    return NextResponse.json(
      { error: "Failed to create email campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      campaignId,
      name, 
      subject, 
      content, 
      audienceType = "all", 
      audienceFilter = {}, 
      scheduleType = "draft",
      scheduledAt 
    } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: "Name, subject, and content are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Calculate estimated recipients
    let estimatedRecipients = 0;
    switch (audienceType) {
      case "all":
        estimatedRecipients = 350;
        break;
      case "customers":
        estimatedRecipients = 150;
        break;
      case "subscribers":
        estimatedRecipients = 95;
        break;
    }

    if (audienceFilter.city) estimatedRecipients = Math.floor(estimatedRecipients * 0.3);
    if (audienceFilter.minPurchases) estimatedRecipients = Math.floor(estimatedRecipients * 0.6);

    // Determine status and dates
    let status = "draft";
    let scheduledAtDate = null;
    let sentAtDate = null;

    if (scheduleType === "now") {
      status = "sent";
      sentAtDate = new Date();
    } else if (scheduleType === "later" && scheduledAt) {
      status = "scheduled";
      scheduledAtDate = new Date(scheduledAt);
    }

    // Update campaign (only if it belongs to the current seller)
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set({
        name,
        subject,
        content,
        audienceType,
        audienceFilter,
        status,
        scheduledAt: scheduledAtDate,
        sentAt: sentAtDate,
        estimatedRecipients,
        updatedAt: new Date(),
      })
      .where(
        sql`${emailCampaigns.id} = ${campaignId} AND ${emailCampaigns.sellerId} = ${session.sellerId}`
      )
      .returning();

    if (!updatedCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      campaign: updatedCampaign,
      message: "Campaign updated successfully"
    });

  } catch (error) {
    console.error("Error updating email campaign:", error);
    return NextResponse.json(
      { error: "Failed to update email campaign" },
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
    const campaignId = parseInt(searchParams.get("id") || "0");

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const db = getDb();

    // Delete campaign (only if it belongs to the current seller)
    const result = await db
      .delete(emailCampaigns)
      .where(
        sql`${emailCampaigns.id} = ${campaignId} AND ${emailCampaigns.sellerId} = ${session.sellerId}`
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });

  } catch (error) {
    console.error("Error deleting email campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete email campaign" },
      { status: 500 }
    );
  }
}