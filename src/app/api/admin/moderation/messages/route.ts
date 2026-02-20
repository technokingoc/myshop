import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  messageReports,
  conversationFlags,
  messages,
  conversations,
  users,
  stores,
  contentFilters,
  messageFilterMatches 
} from "@/lib/schema";
import { eq, desc, and, or, sql, inArray, isNull } from "drizzle-orm";

// GET /api/admin/moderation/messages - Get reported messages and flagged conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you may want to check role in users table)
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, parseInt(session.user.id)))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // 'reports', 'flags', 'all'
    const status = searchParams.get("status") || "pending";
    const severity = searchParams.get("severity");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const results = {
      reports: [] as any[],
      flags: [] as any[],
      statistics: {
        pendingReports: 0,
        pendingFlags: 0,
        totalReports: 0,
        totalFlags: 0,
      },
    };

    // Get message reports
    if (type === "all" || type === "reports") {
      let reportsQuery = db
        .select({
          id: messageReports.id,
          messageId: messageReports.messageId,
          conversationId: messageReports.conversationId,
          reporterId: messageReports.reporterId,
          reportedUserId: messageReports.reportedUserId,
          reason: messageReports.reason,
          description: messageReports.description,
          category: messageReports.category,
          status: messageReports.status,
          moderatedBy: messageReports.moderatedBy,
          moderatedAt: messageReports.moderatedAt,
          moderatorNotes: messageReports.moderatorNotes,
          actionTaken: messageReports.actionTaken,
          createdAt: messageReports.createdAt,
          
          // Message content
          messageContent: messages.content,
          messageType: messages.messageType,
          messageCreatedAt: messages.createdAt,
          
          // Reporter info
          reporterName: users.name,
          reporterEmail: users.email,
          
          // Store info
          storeName: stores.name,
          storeSlug: stores.slug,
        })
        .from(messageReports)
        .leftJoin(messages, eq(messageReports.messageId, messages.id))
        .leftJoin(conversations, eq(messageReports.conversationId, conversations.id))
        .leftJoin(stores, eq(conversations.storeId, stores.id))
        .leftJoin(users, eq(messageReports.reporterId, users.id))
        .where(eq(messageReports.status, status))
        .orderBy(desc(messageReports.createdAt))
        .limit(limit)
        .offset(offset);

      results.reports = await reportsQuery;
    }

    // Get conversation flags
    if (type === "all" || type === "flags") {
      let flagsQuery = db
        .select({
          id: conversationFlags.id,
          conversationId: conversationFlags.conversationId,
          flaggedBy: conversationFlags.flaggedBy,
          reason: conversationFlags.reason,
          description: conversationFlags.description,
          severity: conversationFlags.severity,
          autoFlagged: conversationFlags.autoFlagged,
          triggerRules: conversationFlags.triggerRules,
          status: conversationFlags.status,
          moderatedBy: conversationFlags.moderatedBy,
          moderatedAt: conversationFlags.moderatedAt,
          moderatorNotes: conversationFlags.moderatorNotes,
          createdAt: conversationFlags.createdAt,
          
          // Conversation info
          conversationSubject: conversations.subject,
          lastMessagePreview: conversations.lastMessagePreview,
          
          // Store info
          storeName: stores.name,
          storeSlug: stores.slug,
          
          // Flagger info (null if auto-flagged)
          flaggerName: users.name,
          flaggerEmail: users.email,
        })
        .from(conversationFlags)
        .leftJoin(conversations, eq(conversationFlags.conversationId, conversations.id))
        .leftJoin(stores, eq(conversations.storeId, stores.id))
        .leftJoin(users, eq(conversationFlags.flaggedBy, users.id))
        .where(and(
          eq(conversationFlags.status, status),
          severity ? eq(conversationFlags.severity, severity) : undefined
        ))
        .orderBy(desc(conversationFlags.createdAt))
        .limit(limit)
        .offset(offset);

      results.flags = await flagsQuery;
    }

    // Get statistics
    const [pendingReports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageReports)
      .where(eq(messageReports.status, "pending"));

    const [totalReports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageReports);

    const [pendingFlags] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversationFlags)
      .where(eq(conversationFlags.status, "pending"));

    const [totalFlags] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversationFlags);

    results.statistics = {
      pendingReports: pendingReports?.count || 0,
      pendingFlags: pendingFlags?.count || 0,
      totalReports: totalReports?.count || 0,
      totalFlags: totalFlags?.count || 0,
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error fetching moderation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch moderation data" },
      { status: 500 }
    );
  }
}

// POST /api/admin/moderation/messages - Take moderation action
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = parseInt(session.user.id);

    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!user[0] || user[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type, // 'report' or 'flag'
      id,
      action, // 'approve', 'dismiss', 'warn', 'temp_ban', 'permanent_ban', 'delete_message'
      notes = "",
    } = body;

    if (!type || !id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, action" },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'dismiss', 'warn', 'temp_ban', 'permanent_ban', 'delete_message'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: " + validActions.join(", ") },
        { status: 400 }
      );
    }

    if (type === "report") {
      // Handle message report
      const report = await db
        .select({
          id: messageReports.id,
          messageId: messageReports.messageId,
          reportedUserId: messageReports.reportedUserId,
          status: messageReports.status,
        })
        .from(messageReports)
        .where(eq(messageReports.id, parseInt(id)))
        .limit(1);

      if (report.length === 0) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      if (report[0].status !== "pending") {
        return NextResponse.json({ error: "Report already moderated" }, { status: 400 });
      }

      // Update report status
      await db
        .update(messageReports)
        .set({
          status: action === "dismiss" ? "dismissed" : "resolved",
          moderatedBy: adminId,
          moderatedAt: sql`NOW()`,
          moderatorNotes: notes.trim(),
          actionTaken: action,
        })
        .where(eq(messageReports.id, parseInt(id)));

      // Apply action
      if (action === "delete_message" && report[0].messageId) {
        await db
          .update(messages)
          .set({
            deletedAt: sql`NOW()`,
            deletedBy: adminId,
          })
          .where(eq(messages.id, report[0].messageId));
      }

      // Handle user actions (warn, ban, etc.)
      if (["warn", "temp_ban", "permanent_ban"].includes(action)) {
        // In a real app, you would implement user suspension/warning system
        console.log(`User ${report[0].reportedUserId} received action: ${action}`);
      }

    } else if (type === "flag") {
      // Handle conversation flag
      const flag = await db
        .select({
          id: conversationFlags.id,
          conversationId: conversationFlags.conversationId,
          status: conversationFlags.status,
        })
        .from(conversationFlags)
        .where(eq(conversationFlags.id, parseInt(id)))
        .limit(1);

      if (flag.length === 0) {
        return NextResponse.json({ error: "Flag not found" }, { status: 404 });
      }

      if (flag[0].status !== "pending") {
        return NextResponse.json({ error: "Flag already moderated" }, { status: 400 });
      }

      // Update flag status
      await db
        .update(conversationFlags)
        .set({
          status: action === "dismiss" ? "dismissed" : "resolved",
          moderatedBy: adminId,
          moderatedAt: sql`NOW()`,
          moderatorNotes: notes.trim(),
        })
        .where(eq(conversationFlags.id, parseInt(id)));

      // Apply action to conversation
      if (action === "approve") {
        await db
          .update(conversations)
          .set({
            status: "closed",
            updatedAt: sql`NOW()`,
          })
          .where(eq(conversations.id, flag[0].conversationId));
      }
    }

    return NextResponse.json({
      message: "Moderation action applied successfully",
      action,
      type,
    });

  } catch (error) {
    console.error("Error applying moderation action:", error);
    return NextResponse.json(
      { error: "Failed to apply moderation action" },
      { status: 500 }
    );
  }
}