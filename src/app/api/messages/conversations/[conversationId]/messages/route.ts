import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { conversations, messages, users } from "@/lib/schema";
import { eq, and, or } from "drizzle-orm";
import { getUnifiedSession } from "@/lib/unified-session";

// POST /api/messages/conversations/[conversationId]/messages - Send a new message
export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = parseInt(params.conversationId);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
    }

    const body = await req.json();
    const { content, messageType = 'text', attachments = [] } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const db = getDb();

    // Verify user is participant in conversation
    const conv = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        status: conversations.status,
      })
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

    const conversation = conv[0];

    // Check if conversation is active
    if (conversation.status === 'closed') {
      return NextResponse.json({ error: "Cannot send message to closed conversation" }, { status: 403 });
    }

    const isCustomer = session.userId === conversation.customerId;

    // Insert new message
    const messageResults = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.userId,
        content: content.trim(),
        messageType,
        attachments,
        readByCustomer: isCustomer,
        readByCustomerAt: isCustomer ? new Date() : null,
        readBySeller: !isCustomer,
        readBySellerAt: !isCustomer ? new Date() : null,
      })
      .returning({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
      });

    const newMessage = messageResults[0];

    // Update conversation with latest message info and unread counts
    const unreadByCustomer = isCustomer ? 0 : 1;
    const unreadBySeller = isCustomer ? 1 : 0;

    await db
      .update(conversations)
      .set({
        lastMessageId: newMessage.id,
        lastMessageAt: newMessage.createdAt,
        lastMessagePreview: newMessage.content.substring(0, 150),
        unreadByCustomer,
        unreadBySeller,
        updatedAt: new Date(),
        status: 'active', // Reactivate conversation if it was archived
      })
      .where(eq(conversations.id, conversationId));

    // Get sender info for response
    const senderInfo = await db
      .select({
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const sender = senderInfo[0];

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        senderId: session.userId,
        content: newMessage.content,
        messageType: newMessage.messageType,
        attachments: newMessage.attachments,
        isRead: true, // Sender has read their own message
        readAt: newMessage.createdAt,
        createdAt: newMessage.createdAt,
        sender: {
          id: session.userId,
          name: sender.name,
          email: sender.email,
          avatarUrl: sender.avatarUrl,
          isCurrentUser: true,
        },
      },
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}