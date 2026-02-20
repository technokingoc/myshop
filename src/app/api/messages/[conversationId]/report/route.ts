import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  conversations, 
  messages,
  messageReports,
  conversationFlags,
  users 
} from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";

// POST /api/messages/[conversationId]/report - Report a message or conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { conversationId: convId } = await params;
    const conversationId = parseInt(convId);
    const body = await request.json();
    const { 
      messageId, 
      reason, 
      description = "", 
      category = "inappropriate" 
    } = body;

    // Validate reason
    const validReasons = ['spam', 'harassment', 'inappropriate', 'fraud', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be one of: " + validReasons.join(", ") },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        status: conversations.status,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conv = conversation[0];
    if (conv.customerId !== userId && conv.sellerId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const reportedUserId = conv.customerId === userId ? conv.sellerId : conv.customerId;

    if (messageId) {
      // Report specific message
      const messageToReport = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          conversationId: messages.conversationId,
        })
        .from(messages)
        .where(and(
          eq(messages.id, parseInt(messageId)),
          eq(messages.conversationId, conversationId)
        ))
        .limit(1);

      if (messageToReport.length === 0) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      // Cannot report your own message
      if (messageToReport[0].senderId === userId) {
        return NextResponse.json({ error: "Cannot report your own message" }, { status: 400 });
      }

      // Check if already reported by this user
      const existingReport = await db
        .select({ id: messageReports.id })
        .from(messageReports)
        .where(and(
          eq(messageReports.messageId, parseInt(messageId)),
          eq(messageReports.reporterId, userId)
        ))
        .limit(1);

      if (existingReport.length > 0) {
        return NextResponse.json({ error: "You have already reported this message" }, { status: 400 });
      }

      // Create message report
      await db
        .insert(messageReports)
        .values({
          messageId: parseInt(messageId),
          conversationId,
          reporterId: userId,
          reportedUserId,
          reason,
          description: description.trim(),
          category,
          status: "pending",
        });

      // Auto-flag conversation if severity is high
      const highSeverityReasons = ['harassment', 'fraud'];
      if (highSeverityReasons.includes(reason)) {
        await db
          .insert(conversationFlags)
          .values({
            conversationId,
            flaggedBy: userId,
            reason: 'user_report',
            description: `User reported message for: ${reason}`,
            severity: 'high',
            autoFlagged: false,
            status: 'pending',
          });
      }

    } else {
      // Report entire conversation
      const existingFlag = await db
        .select({ id: conversationFlags.id })
        .from(conversationFlags)
        .where(and(
          eq(conversationFlags.conversationId, conversationId),
          eq(conversationFlags.flaggedBy, userId),
          eq(conversationFlags.status, "pending")
        ))
        .limit(1);

      if (existingFlag.length > 0) {
        return NextResponse.json({ error: "You have already reported this conversation" }, { status: 400 });
      }

      // Create conversation flag
      await db
        .insert(conversationFlags)
        .values({
          conversationId,
          flaggedBy: userId,
          reason: reason,
          description: description.trim(),
          severity: reason === 'fraud' ? 'critical' : reason === 'harassment' ? 'high' : 'medium',
          autoFlagged: false,
          status: 'pending',
        });
    }

    // Get reporter and reported user info for logging
    const users_info = await db
      .select({
        reporterName: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log(`Content reported by ${users_info[0]?.reporterName} (ID: ${userId}) in conversation ${conversationId}. Reason: ${reason}`);

    return NextResponse.json({
      message: "Report submitted successfully. Our moderation team will review it.",
      reportId: messageId ? "message_report" : "conversation_flag",
    });

  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}