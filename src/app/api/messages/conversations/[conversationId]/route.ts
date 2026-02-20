import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { conversations, messages, users } from "@/lib/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { getUnifiedSession } from "@/lib/unified-session";

// GET /api/messages/conversations/[conversationId] - Get conversation with messages
export async function GET(
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

    const db = getDb();

    // Get conversation details with participant verification
    const conv = await db
      .select()
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

    // Get messages for this conversation
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const messageList = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        metadata: messages.metadata,
        readByCustomer: messages.readByCustomer,
        readByCustomerAt: messages.readByCustomerAt,
        readBySeller: messages.readBySeller,
        readBySellerAt: messages.readBySellerAt,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        // Sender info
        senderName: users.name,
        senderEmail: users.email,
        senderAvatarUrl: users.avatarUrl,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Mark messages as read by current user
    const isCustomer = session.userId === conversation.customerId;
    const updateField = isCustomer 
      ? { readByCustomer: true, readByCustomerAt: new Date() }
      : { readBySeller: true, readBySellerAt: new Date() };

    await db
      .update(messages)
      .set(updateField)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isCustomer 
            ? eq(messages.readByCustomer, false)
            : eq(messages.readBySeller, false)
        )
      );

    // Update conversation unread count
    const unreadUpdate = isCustomer
      ? { unreadByCustomer: 0 }
      : { unreadBySeller: 0 };

    await db
      .update(conversations)
      .set(unreadUpdate)
      .where(eq(conversations.id, conversationId));

    // Format messages
    const formattedMessages = messageList.reverse().map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      attachments: msg.attachments,
      metadata: msg.metadata,
      isRead: isCustomer ? msg.readByCustomer : msg.readBySeller,
      readAt: isCustomer ? msg.readByCustomerAt : msg.readBySellerAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sender: {
        id: msg.senderId,
        name: msg.senderName,
        email: msg.senderEmail,
        avatarUrl: msg.senderAvatarUrl,
        isCurrentUser: msg.senderId === session.userId,
      },
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        storeId: conversation.storeId,
        customerId: conversation.customerId,
        sellerId: conversation.sellerId,
        subject: conversation.subject,
        status: conversation.status,
        productId: conversation.productId,
        orderId: conversation.orderId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: formattedMessages,
      hasMore: messageList.length === limit,
      nextOffset: offset + limit,
    });

  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}

// PATCH /api/messages/conversations/[conversationId] - Update conversation status
export async function PATCH(
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
    const { status } = body;

    if (!['active', 'archived', 'closed'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();

    // Verify user is participant
    const conv = await db
      .select()
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

    // Update conversation status
    await db
      .update(conversations)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

// DELETE /api/messages/conversations/[conversationId] - Delete/archive conversation
export async function DELETE(
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

    const db = getDb();

    // Verify user is participant
    const conv = await db
      .select()
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

    // Archive conversation instead of hard delete
    await db
      .update(conversations)
      .set({ 
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}