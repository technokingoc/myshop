import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userBlocks, users, conversations } from "@/lib/schema";
import { eq, and, or, sql } from "drizzle-orm";

// POST /api/messages/block - Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { blockedUserId, reason = "", notes = "", blockType = "messages" } = body;

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "blockedUserId is required" },
        { status: 400 }
      );
    }

    const blockedUserIdInt = parseInt(blockedUserId);

    // Cannot block yourself
    if (blockedUserIdInt === userId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Check if user exists
    const userToBlock = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, blockedUserIdInt))
      .limit(1);

    if (userToBlock.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already blocked
    const existingBlock = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, userId),
        eq(userBlocks.blockedUserId, blockedUserIdInt)
      ))
      .limit(1);

    if (existingBlock.length > 0) {
      return NextResponse.json({ error: "User is already blocked" }, { status: 400 });
    }

    // Validate block type
    const validBlockTypes = ['messages', 'orders', 'all'];
    if (!validBlockTypes.includes(blockType)) {
      return NextResponse.json(
        { error: "Invalid blockType. Must be one of: " + validBlockTypes.join(", ") },
        { status: 400 }
      );
    }

    // Create block
    await db
      .insert(userBlocks)
      .values({
        blockerId: userId,
        blockedUserId: blockedUserIdInt,
        reason: reason.trim(),
        notes: notes.trim(),
        blockType,
      });

    // Archive all active conversations between these users
    await db
      .update(conversations)
      .set({
        status: "archived",
        updatedAt: sql`NOW()`,
      })
      .where(and(
        or(
          and(eq(conversations.customerId, userId), eq(conversations.sellerId, blockedUserIdInt)),
          and(eq(conversations.customerId, blockedUserIdInt), eq(conversations.sellerId, userId))
        ),
        eq(conversations.status, "active")
      ));

    return NextResponse.json({
      message: `Successfully blocked ${userToBlock[0].name}`,
      blockedUser: {
        id: blockedUserIdInt,
        name: userToBlock[0].name,
      },
    });

  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json(
      { error: "Failed to block user" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/block - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get("userId");

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const blockedUserIdInt = parseInt(blockedUserId);

    // Find and remove block
    const block = await db
      .select({
        id: userBlocks.id,
        blockedUserId: userBlocks.blockedUserId,
      })
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, userId),
        eq(userBlocks.blockedUserId, blockedUserIdInt)
      ))
      .limit(1);

    if (block.length === 0) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    await db
      .delete(userBlocks)
      .where(eq(userBlocks.id, block[0].id));

    // Get unblocked user info
    const unblockedUser = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, blockedUserIdInt))
      .limit(1);

    return NextResponse.json({
      message: `Successfully unblocked ${unblockedUser[0]?.name || "user"}`,
      unblockedUser: {
        id: blockedUserIdInt,
        name: unblockedUser[0]?.name || "",
      },
    });

  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      { error: "Failed to unblock user" },
      { status: 500 }
    );
  }
}

// GET /api/messages/block - Get blocked users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Get blocked users with their info
    const blockedUsers = await db
      .select({
        id: userBlocks.id,
        blockedUserId: userBlocks.blockedUserId,
        reason: userBlocks.reason,
        notes: userBlocks.notes,
        blockType: userBlocks.blockType,
        createdAt: userBlocks.createdAt,
        
        // Blocked user info
        blockedUserName: users.name,
        blockedUserEmail: users.email,
      })
      .from(userBlocks)
      .leftJoin(users, eq(userBlocks.blockedUserId, users.id))
      .where(eq(userBlocks.blockerId, userId))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, userId));

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      blockedUsers,
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
    console.error("Error fetching blocked users:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked users" },
      { status: 500 }
    );
  }
}