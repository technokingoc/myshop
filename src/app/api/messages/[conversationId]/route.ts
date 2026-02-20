import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  conversations, 
  messages, 
  messageFiles,
  contentFilters,
  messageFilterMatches,
  users,
  userBlocks 
} from "@/lib/schema";
import { eq, desc, and, or, sql, not } from "drizzle-orm";

// GET /api/messages/[conversationId] - Get messages in a conversation
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

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

    // Check if conversation involves blocked users
    const isBlocked = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        or(
          and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedUserId, conv.customerId === userId ? conv.sellerId : conv.customerId)),
          and(eq(userBlocks.blockerId, conv.customerId === userId ? conv.sellerId : conv.customerId), eq(userBlocks.blockedUserId, userId))
        )
      ))
      .limit(1);

    if (isBlocked.length > 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages with sender info and files
    const messagesList = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
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
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.conversationId, conversationId),
        sql`deleted_at IS NULL`
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Mark messages as read by current user
    if (messagesList.length > 0) {
      if (userId === conv.customerId) {
        // Mark as read by customer
        await db
          .update(messages)
          .set({
            readByCustomer: true,
            readByCustomerAt: sql`NOW()`,
          })
          .where(and(
            eq(messages.conversationId, conversationId),
            eq(messages.readByCustomer, false),
            not(eq(messages.senderId, userId))
          ));

        // Update conversation unread count
        await db
          .update(conversations)
          .set({ unreadByCustomer: 0 })
          .where(eq(conversations.id, conversationId));

      } else if (userId === conv.sellerId) {
        // Mark as read by seller
        await db
          .update(messages)
          .set({
            readBySeller: true,
            readBySellerAt: sql`NOW()`,
          })
          .where(and(
            eq(messages.conversationId, conversationId),
            eq(messages.readBySeller, false),
            not(eq(messages.senderId, userId))
          ));

        // Update conversation unread count
        await db
          .update(conversations)
          .set({ unreadBySeller: 0 })
          .where(eq(conversations.id, conversationId));
      }
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        sql`deleted_at IS NULL`
      ));

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      messages: messagesList.reverse(), // Reverse to show oldest first
      conversation: conv,
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
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/[conversationId] - Send a new message
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
    const { content, messageType = "text", attachments = [], metadata = {} } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
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
        storeId: conversations.storeId,
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

    if (conv.status === "closed") {
      return NextResponse.json({ error: "Conversation is closed" }, { status: 400 });
    }

    // Check if user is blocked
    const otherUserId = conv.customerId === userId ? conv.sellerId : conv.customerId;
    const isBlocked = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        or(
          and(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedUserId, otherUserId)),
          and(eq(userBlocks.blockerId, otherUserId), eq(userBlocks.blockedUserId, userId))
        )
      ))
      .limit(1);

    if (isBlocked.length > 0) {
      return NextResponse.json({ error: "Cannot send message" }, { status: 403 });
    }

    // Content filtering
    const filteredContent = await applyContentFilters(content.trim(), conv.storeId);
    if (filteredContent.blocked) {
      return NextResponse.json(
        { error: "Message contains prohibited content", details: filteredContent.reasons },
        { status: 400 }
      );
    }

    // Create message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        content: filteredContent.content,
        messageType,
        attachments: JSON.stringify(attachments),
        metadata: JSON.stringify(metadata),
        readByCustomer: userId === conv.customerId,
        readBySeller: userId === conv.sellerId,
      })
      .returning({
        id: messages.id,
        createdAt: messages.createdAt,
        content: messages.content,
      });

    const messageId = newMessage[0].id;

    // Log filter matches if any
    if (filteredContent.matches.length > 0) {
      for (const match of filteredContent.matches) {
        await db
          .insert(messageFilterMatches)
          .values({
            messageId,
            filterId: match.filterId,
            matchedText: match.matchedText,
            filterPattern: match.pattern,
            actionTaken: match.action,
            originalContent: match.originalContent || "",
            position: match.position || 0,
          });
      }
    }

    // Update conversation
    const isCustomer = userId === conv.customerId;
    await db
      .update(conversations)
      .set({
        lastMessageId: messageId,
        lastMessageAt: newMessage[0].createdAt,
        lastMessagePreview: filteredContent.content.substring(0, 150),
        status: "active", // Reactivate if it was archived
        unreadByCustomer: isCustomer ? 0 : sql`unread_by_customer + 1`,
        unreadBySeller: isCustomer ? sql`unread_by_seller + 1` : 0,
        updatedAt: sql`NOW()`,
      })
      .where(eq(conversations.id, conversationId));

    // Get sender info for response
    const sender = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      id: messageId,
      conversationId,
      senderId: userId,
      senderName: sender[0]?.name || "",
      content: filteredContent.content,
      messageType,
      attachments,
      metadata,
      createdAt: newMessage[0].createdAt,
      filtered: filteredContent.filtered,
      warnings: filteredContent.warnings,
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// Helper function to apply content filters
async function applyContentFilters(content: string, storeId: number) {
  const result = {
    content,
    filtered: false,
    blocked: false,
    matches: [] as any[],
    warnings: [] as string[],
    reasons: [] as string[],
  };

  try {
    // Get active filters for store and global
    const filters = await db
      .select()
      .from(contentFilters)
      .where(and(
        eq(contentFilters.enabled, true),
        or(
          eq(contentFilters.storeId, storeId),
          sql`store_id IS NULL`
        )
      ));

    for (const filter of filters) {
      const patterns = filter.patterns as string[];
      
      for (const pattern of patterns) {
        let regex: RegExp;
        
        try {
          if (filter.filterType === "regex") {
            regex = new RegExp(pattern, filter.caseSensitive ? "g" : "gi");
          } else if (filter.filterType === "phone") {
            // Phone number patterns
            regex = /(\+?\d{1,3}[-.\s]?)?\(?[0-9]{2,3}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
          } else if (filter.filterType === "email") {
            // Email patterns
            regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          } else if (filter.filterType === "url") {
            // URL patterns
            regex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|edu|gov|mil|int|co|io|me|ly)[\/\w]*)/g;
          } else {
            // Keyword matching
            const flags = filter.caseSensitive ? "g" : "gi";
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const boundaryPattern = filter.wholeWordsOnly ? `\\b${escapedPattern}\\b` : escapedPattern;
            regex = new RegExp(boundaryPattern, flags);
          }

          const matches = Array.from(content.matchAll(regex));
          
          for (const match of matches) {
            const matchedText = match[0];
            const position = match.index || 0;

            result.matches.push({
              filterId: filter.id,
              matchedText,
              pattern,
              position,
              action: filter.action,
              originalContent: filter.action === "replace" ? content : "",
            });

            // Apply action
            switch (filter.action) {
              case "block":
                result.blocked = true;
                result.reasons.push(`${filter.name}: "${matchedText}"`);
                break;
                
              case "replace":
                result.content = result.content.replace(matchedText, filter.replacement || "[FILTERED]");
                result.filtered = true;
                break;
                
              case "warn":
                result.warnings.push(`${filter.name}: Content may violate policy`);
                break;
                
              case "flag":
                // Just log for moderation review
                result.filtered = true;
                break;
            }

            // Update filter statistics
            await db
              .update(contentFilters)
              .set({
                matchCount: sql`match_count + 1`,
                lastMatch: sql`NOW()`,
              })
              .where(eq(contentFilters.id, filter.id));
          }
        } catch (regexError) {
          console.error(`Invalid regex pattern in filter ${filter.id}:`, regexError);
        }
      }
    }
  } catch (error) {
    console.error("Error applying content filters:", error);
  }

  return result;
}