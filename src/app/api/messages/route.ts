import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, users, stores, catalogItems, orders, userBlocks } from "@/lib/schema";
import { eq, desc, and, or, sql, not, inArray } from "drizzle-orm";

// GET /api/messages - List conversations for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Get blocked users to filter them out
    const blockedUsers = await db
      .select({ blockedUserId: userBlocks.blockedUserId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, userId));

    const blockedUserIds = blockedUsers.map(b => b.blockedUserId);

    // Build conversations query
    let conversationsQuery = db
      .select({
        id: conversations.id,
        storeId: conversations.storeId,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
        subject: conversations.subject,
        status: conversations.status,
        lastMessageId: conversations.lastMessageId,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        unreadByCustomer: conversations.unreadByCustomer,
        unreadBySeller: conversations.unreadBySeller,
        productId: conversations.productId,
        orderId: conversations.orderId,
        createdAt: conversations.createdAt,
        
        // Store info
        storeName: stores.name,
        storeSlug: stores.slug,
        storeLogoUrl: stores.logoUrl,
        
        // Other participant info
        otherParticipantName: users.name,
        otherParticipantEmail: users.email,
        
        // Product info if linked
        productName: catalogItems.name,
        productImageUrl: catalogItems.imageUrl,
        
        // Order info if linked
        orderStatus: orders.status,
      })
      .from(conversations)
      .leftJoin(stores, eq(conversations.storeId, stores.id))
      .leftJoin(catalogItems, eq(conversations.productId, catalogItems.id))
      .leftJoin(orders, eq(conversations.orderId, orders.id))
      .leftJoin(users, or(
        and(eq(conversations.customerId, userId), eq(users.id, conversations.sellerId)),
        and(eq(conversations.sellerId, userId), eq(users.id, conversations.customerId))
      ))
      .where(and(
        or(
          eq(conversations.customerId, userId),
          eq(conversations.sellerId, userId)
        ),
        eq(conversations.status, status),
        // Filter out conversations with blocked users
        blockedUserIds.length > 0 ? not(or(
          and(eq(conversations.customerId, userId), inArray(conversations.sellerId, blockedUserIds)),
          and(eq(conversations.sellerId, userId), inArray(conversations.customerId, blockedUserIds))
        )) : undefined
      ))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const conversationsList = await conversationsQuery;

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(and(
        or(
          eq(conversations.customerId, userId),
          eq(conversations.sellerId, userId)
        ),
        eq(conversations.status, status),
        // Filter out conversations with blocked users
        blockedUserIds.length > 0 ? not(or(
          and(eq(conversations.customerId, userId), inArray(conversations.sellerId, blockedUserIds)),
          and(eq(conversations.sellerId, userId), inArray(conversations.customerId, blockedUserIds))
        )) : undefined
      ));

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      conversations: conversationsList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const {
      storeId,
      sellerId,
      subject,
      initialMessage,
      productId,
      orderId,
    } = body;

    // Validate required fields
    if (!storeId || !sellerId || !initialMessage?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: storeId, sellerId, initialMessage" },
        { status: 400 }
      );
    }

    // Check if user is blocked by the seller
    const isBlocked = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, sellerId),
        eq(userBlocks.blockedUserId, userId)
      ))
      .limit(1);

    if (isBlocked.length > 0) {
      return NextResponse.json(
        { error: "You cannot message this user" },
        { status: 403 }
      );
    }

    // Check if conversation already exists for this product/order
    let existingConversation = null;
    if (productId || orderId) {
      existingConversation = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(
          eq(conversations.storeId, storeId),
          eq(conversations.customerId, userId),
          eq(conversations.sellerId, sellerId),
          productId ? eq(conversations.productId, productId) : sql`product_id IS NULL`,
          orderId ? eq(conversations.orderId, orderId) : sql`order_id IS NULL`,
          not(eq(conversations.status, "closed"))
        ))
        .limit(1);
    }

    let conversationId;
    
    if (existingConversation && existingConversation.length > 0) {
      // Use existing conversation
      conversationId = existingConversation[0].id;
    } else {
      // Create new conversation
      const newConversation = await db
        .insert(conversations)
        .values({
          storeId: parseInt(storeId),
          customerId: userId,
          sellerId: parseInt(sellerId),
          subject: subject?.trim() || "",
          status: "active",
          productId: productId ? parseInt(productId) : null,
          orderId: orderId ? parseInt(orderId) : null,
          unreadByCustomer: 0,
          unreadBySeller: 1,
        })
        .returning({ id: conversations.id });

      conversationId = newConversation[0].id;
    }

    // Create initial message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        content: initialMessage.trim(),
        messageType: "text",
        readByCustomer: true,
        readBySeller: false,
      })
      .returning({
        id: messages.id,
        createdAt: messages.createdAt,
      });

    // Update conversation with last message info
    await db
      .update(conversations)
      .set({
        lastMessageId: newMessage[0].id,
        lastMessageAt: newMessage[0].createdAt,
        lastMessagePreview: initialMessage.trim().substring(0, 150),
        unreadBySeller: sql`unread_by_seller + 1`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({
      conversationId,
      messageId: newMessage[0].id,
      message: "Conversation started successfully",
    });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}