import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { conversations, messages, users, stores, catalogItems } from "@/lib/schema";
import { eq, desc, and, or, isNull, sql } from "drizzle-orm";
import { getUnifiedSession } from "@/lib/unified-session";

// GET /api/messages/conversations - List conversations for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build where conditions
    const whereConditions = [
      eq(conversations.status, status),
      or(
        eq(conversations.customerId, session.userId),
        eq(conversations.sellerId, session.userId)
      )
    ];

    if (unreadOnly) {
      if (session.hasStore) {
        whereConditions.push(sql`${conversations.unreadBySeller} > 0`);
      } else {
        whereConditions.push(sql`${conversations.unreadByCustomer} > 0`);
      }
    }

    // Get conversations with participant info and latest message
    const conversationList = await db
      .select({
        id: conversations.id,
        storeId: conversations.storeId,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        subject: conversations.subject,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        unreadByCustomer: conversations.unreadByCustomer,
        unreadBySeller: conversations.unreadBySeller,
        productId: conversations.productId,
        orderId: conversations.orderId,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        // Customer info
        customerName: users.name,
        customerEmail: users.email,
        customerAvatarUrl: users.avatarUrl,
        // Store info
        storeName: stores.name,
        storeSlug: stores.slug,
        // Product info (if applicable)
        productName: catalogItems.name,
      })
      .from(conversations)
      .innerJoin(users, eq(conversations.customerId, users.id))
      .innerJoin(stores, eq(conversations.storeId, stores.id))
      .leftJoin(catalogItems, eq(conversations.productId, catalogItems.id))
      .where(and(...whereConditions))
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    // Format response
    const formattedConversations = conversationList.map(conv => ({
      id: conv.id,
      storeId: conv.storeId,
      subject: conv.subject,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      lastMessagePreview: conv.lastMessagePreview,
      unreadCount: session.hasStore ? conv.unreadBySeller : conv.unreadByCustomer,
      productId: conv.productId,
      orderId: conv.orderId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      // Participant info (relative to current user)
      participant: session.userId === conv.customerId ? {
        id: conv.sellerId,
        type: 'seller',
        name: conv.storeName,
        avatarUrl: null,
        email: null,
      } : {
        id: conv.customerId,
        type: 'customer',
        name: conv.customerName,
        avatarUrl: conv.customerAvatarUrl,
        email: conv.customerEmail,
      },
      store: {
        id: conv.storeId,
        name: conv.storeName,
        slug: conv.storeSlug,
      },
      product: conv.productId ? {
        id: conv.productId,
        name: conv.productName,
      } : null,
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      total: formattedConversations.length,
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

// POST /api/messages/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeId, message, subject, productId, orderId } = body;

    if (!storeId || !message) {
      return NextResponse.json({ error: "Store ID and initial message required" }, { status: 400 });
    }

    const db = getDb();

    // Get store info and seller ID
    const storeResults = await db
      .select({ sellerId: stores.userId })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (storeResults.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const sellerId = storeResults[0].sellerId;

    // Prevent users from messaging themselves
    if (session.userId === sellerId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check if conversation already exists
    const existingConv = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.storeId, storeId),
          eq(conversations.customerId, session.userId),
          eq(conversations.sellerId, sellerId),
          isNull(conversations.deletedAt)
        )
      )
      .limit(1);

    let conversationId;

    if (existingConv.length > 0) {
      // Use existing conversation
      conversationId = existingConv[0].id;
    } else {
      // Create new conversation
      const newConvResults = await db
        .insert(conversations)
        .values({
          storeId,
          customerId: session.userId,
          sellerId,
          subject: subject || '',
          productId: productId || null,
          orderId: orderId || null,
        })
        .returning({ id: conversations.id });

      conversationId = newConvResults[0].id;
    }

    // Insert the initial message
    const messageResults = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: session.userId,
        content: message,
        messageType: 'text',
        readByCustomer: true, // Sender has read their own message
        readBySeller: session.hasStore,
      })
      .returning({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
      });

    const newMessage = messageResults[0];

    // Update conversation with last message info
    await db
      .update(conversations)
      .set({
        lastMessageId: newMessage.id,
        lastMessageAt: newMessage.createdAt,
        lastMessagePreview: newMessage.content.substring(0, 150),
        unreadByCustomer: session.hasStore ? 1 : 0,
        unreadBySeller: session.hasStore ? 0 : 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({
      success: true,
      conversationId,
      messageId: newMessage.id,
    });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}