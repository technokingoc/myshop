import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, users } from "@/lib/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

// GET /api/messages/stream - Server-Sent Events for real-time messaging
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = parseInt((session as any).user.id);
    const { searchParams } = new URL(request.url);
    const conversationIds = searchParams.get("conversations")?.split(",").map(id => parseInt(id)) || [];

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
          userId,
        })}\n\n`));

        // Set up polling for new messages
        const pollInterval = setInterval(async () => {
          try {
            // Get latest messages from user's conversations
            const latestMessages = await db
              .select({
                id: messages.id,
                conversationId: messages.conversationId,
                senderId: messages.senderId,
                content: messages.content,
                messageType: messages.messageType,
                attachments: messages.attachments,
                createdAt: messages.createdAt,
                
                // Sender info
                senderName: users.name,
                
                // Conversation info
                customerId: conversations.customerId,
                sellerId: conversations.sellerId,
                unreadByCustomer: conversations.unreadByCustomer,
                unreadBySeller: conversations.unreadBySeller,
              })
              .from(messages)
              .leftJoin(users, eq(messages.senderId, users.id))
              .leftJoin(conversations, eq(messages.conversationId, conversations.id))
              .where(and(
                or(
                  eq(conversations.customerId, userId),
                  eq(conversations.sellerId, userId)
                ),
                sql`${messages.createdAt} > NOW() - INTERVAL '30 seconds'`,
                conversationIds.length > 0 ? 
                  or(...conversationIds.map(id => eq(messages.conversationId, id))) :
                  undefined
              ))
              .orderBy(desc(messages.createdAt))
              .limit(10);

            if (latestMessages.length > 0) {
              // Send new messages
              for (const message of latestMessages) {
                // Only send if it's not from the current user (avoid echo)
                if (message.senderId !== userId) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: "new_message",
                    message: {
                      id: message.id,
                      conversationId: message.conversationId,
                      senderId: message.senderId,
                      senderName: message.senderName,
                      content: message.content,
                      messageType: message.messageType,
                      attachments: message.attachments,
                      createdAt: message.createdAt,
                    },
                    unreadCounts: {
                      customer: message.unreadByCustomer,
                      seller: message.unreadBySeller,
                    },
                    timestamp: new Date().toISOString(),
                  })}\n\n`));
                }
              }
            }

            // Get typing indicators (simplified - in production you'd have a separate typing table)
            // For now, just send heartbeat
            if (Math.random() < 0.1) { // Send heartbeat 10% of the time
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "heartbeat",
                timestamp: new Date().toISOString(),
              })}\n\n`));
            }

          } catch (error) {
            console.error("Error in SSE polling:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              message: "Internal server error",
              timestamp: new Date().toISOString(),
            })}\n\n`));
          }
        }, 2000); // Poll every 2 seconds

        // Clean up on close
        request.signal?.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });

        // Auto-close after 30 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          controller.close();
        }, 30 * 60 * 1000);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error("Error creating SSE stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// POST /api/messages/stream - Send typing indicator
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session as any)?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = parseInt((session as any).user.id);
    const body = await request.json();
    const { conversationId, isTyping = true } = body;

    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    // Verify user has access to this conversation
    const conversation = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        sellerId: conversations.sellerId,
      })
      .from(conversations)
      .where(eq(conversations.id, parseInt(conversationId)))
      .limit(1);

    if (conversation.length === 0) {
      return new Response("Conversation not found", { status: 404 });
    }

    const conv = conversation[0];
    if (conv.customerId !== userId && conv.sellerId !== userId) {
      return new Response("Access denied", { status: 403 });
    }

    // In a real implementation, you would:
    // 1. Update typing_indicators table
    // 2. Broadcast typing status to other participants via WebSocket/SSE
    // 3. Set up auto-cleanup for stale typing indicators

    console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'} in conversation ${conversationId}`);

    return new Response(JSON.stringify({
      message: "Typing indicator updated",
      conversationId,
      userId,
      isTyping,
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error updating typing indicator:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}