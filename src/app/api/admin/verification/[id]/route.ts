import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const sellerId = parseInt(id);
  const { action, notes } = await request.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = getDb();

  try {
    const now = new Date();
    const verificationStatus = action === 'approve' ? 'approved' : 'rejected';

    // Try to update in sellers table first (legacy)
    try {
      const [updatedSeller] = await db
        .update(sellers)
        .set({
          verificationStatus,
          verificationNotes: notes || '',
          verificationReviewedAt: now,
          verificationReviewedBy: session.sellerId,
          updatedAt: now,
        })
        .where(eq(sellers.id, sellerId))
        .returning({ id: sellers.id });

      if (updatedSeller) {
        // Log the admin activity if we have an admin activities table
        try {
          await db.execute(`
            INSERT INTO admin_activities (admin_id, action, target_type, target_id, new_values, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            session.sellerId,
            `verification_${action}`,
            'seller',
            sellerId,
            JSON.stringify({ verificationStatus, verificationNotes: notes }),
            notes || '',
            now
          ]);
        } catch {
          // Ignore if admin_activities table doesn't exist yet
        }

        return NextResponse.json({ 
          success: true, 
          message: `Seller ${action}d successfully` 
        });
      }
    } catch (error) {
      // If the verification columns don't exist in sellers table, 
      // we'll fall through to check stores table
      console.log("Sellers table update failed, trying stores table");
    }

    // Try to update in stores table (new system)
    try {
      const [updatedStore] = await db
        .update(stores)
        .set({
          verificationStatus,
          verificationNotes: notes || '',
          verificationReviewedAt: now,
          verificationReviewedBy: session.sellerId,
          updatedAt: now,
        })
        .where(eq(stores.id, sellerId))
        .returning({ id: stores.id });

      if (updatedStore) {
        return NextResponse.json({ 
          success: true, 
          message: `Store ${action}d successfully` 
        });
      }
    } catch (error) {
      console.log("Stores table update failed");
    }

    // If both updates failed, the seller/store doesn't exist
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });

  } catch (error) {
    console.error("Verification update error:", error);
    return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const sellerId = parseInt(id);

  const db = getDb();

  try {
    // Try to get from sellers table first
    let seller;
    try {
      const [foundSeller] = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId));
      seller = foundSeller;
    } catch {
      // If sellers table query fails, try stores table
      const [foundStore] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, sellerId));
      seller = foundStore;
    }

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Get seller error:", error);
    return NextResponse.json({ error: "Failed to fetch seller details" }, { status: 500 });
  }
}