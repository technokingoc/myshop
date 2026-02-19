import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { catalogItems, comments, adminActivities } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const itemId = parseInt(id);
  const { action, notes, type } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!['product', 'review'].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const db = getDb();

  try {
    const now = new Date();
    const moderationStatus = action === 'approve' ? 'approved' : 'rejected';

    if (type === 'product') {
      try {
        await db
          .update(catalogItems)
          .set({
            moderationStatus,
            reviewedBy: session.sellerId,
            reviewedAt: now,
            // If approving, clear the flag
            ...(action === 'approve' && { flaggedReason: '' }),
          })
          .where(eq(catalogItems.id, itemId));

        // Log the admin activity
        try {
          await db.insert(adminActivities).values({
            adminId: session.sellerId,
            action: `moderation_${action}`,
            targetType: 'product',
            targetId: itemId,
            newValues: { moderationStatus },
            notes: notes || '',
          });
        } catch {
          // Ignore if admin_activities table doesn't exist
        }

        return NextResponse.json({ 
          success: true, 
          message: `Product ${action}d successfully` 
        });

      } catch (error) {
        console.error("Product moderation update failed:", error);
        return NextResponse.json({ 
          error: "Product moderation failed. Database may need migration." 
        }, { status: 500 });
      }

    } else if (type === 'review') {
      try {
        await db
          .update(comments)
          .set({
            moderationStatus,
            reviewedBy: session.sellerId,
            reviewedAt: now,
            // If approving, clear the flag
            ...(action === 'approve' && { flaggedReason: '' }),
          })
          .where(eq(comments.id, itemId));

        // Log the admin activity
        try {
          await db.insert(adminActivities).values({
            adminId: session.sellerId,
            action: `moderation_${action}`,
            targetType: 'review',
            targetId: itemId,
            newValues: { moderationStatus },
            notes: notes || '',
          });
        } catch {
          // Ignore if admin_activities table doesn't exist
        }

        return NextResponse.json({ 
          success: true, 
          message: `Review ${action}d successfully` 
        });

      } catch (error) {
        console.error("Review moderation update failed:", error);
        return NextResponse.json({ 
          error: "Review moderation failed. Database may need migration." 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ 
      error: "Moderation action failed. Database may need migration." 
    }, { status: 500 });
  }
}