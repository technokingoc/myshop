import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { conversations, typingIndicators } from "@/lib/schema";
import { eq, and, or, lt, ne } from "drizzle-orm";
import { getUnifiedSession } from "@/lib/unified-session";

// POST /api/messages/typing - Update typing status
export async function POST(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, isTyping } = body;

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify user is participant in conversation
    const conv = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.customerId, session.userId),
            eq(conversations.sellerId, session.userId)
          )
        )
      )
      .limit(1);

    if (conv.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (isTyping) {
      // Update or insert typing indicator
      await db
        .insert(typingIndicators)
        .values({
          conversationId,
          userId: session.userId,
          isTyping: true,
          lastTypingAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [typingIndicators.conversationId, typingIndicators.userId],
          set: {
            isTyping: true,
            lastTypingAt: new Date(),
          },
        });
    } else {
      // Remove typing indicator
      await db
        .delete(typingIndicators)
        .where(
          and(
            eq(typingIndicators.conversationId, conversationId),
            eq(typingIndicators.userId, session.userId)
          )
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating typing status:", error);
    return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 });
  }
}

// GET /api/messages/typing?conversationId=X - Get typing indicators
export async function GET(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = parseInt(searchParams.get('conversationId') || '');

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify user is participant
    const conv = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          or(
            eq(conversations.customerId, session.userId),
            eq(conversations.sellerId, session.userId)
          )
        )
      )
      .limit(1);

    if (conv.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Clean up old typing indicators (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await db
      .delete(typingIndicators)
      .where(lt(typingIndicators.lastTypingAt, fiveMinutesAgo));

    // Get current typing indicators (excluding current user)
    const typingUsers = await db
      .select({
        userId: typingIndicators.userId,
        lastTypingAt: typingIndicators.lastTypingAt,
      })
      .from(typingIndicators)
      .where(
        and(
          eq(typingIndicators.conversationId, conversationId),
          eq(typingIndicators.isTyping, true),
          ne(typingIndicators.userId, session.userId) // Exclude current user
        )
      );

    return NextResponse.json({
      typingUsers: typingUsers.map(user => ({
        userId: user.userId,
        lastTypingAt: user.lastTypingAt,
      })),
    });

  } catch (error) {
    console.error("Error fetching typing indicators:", error);
    return NextResponse.json({ error: "Failed to fetch typing indicators" }, { status: 500 });
  }
}