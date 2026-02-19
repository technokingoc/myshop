import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { wishlists } from "@/lib/schema";
import { getCustomerSession } from "@/lib/customer-session";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const db = getDb();
    
    const userWishlists = await db.select()
      .from(wishlists)
      .where(eq(wishlists.customerId, session.customerId));
    
    return NextResponse.json(userWishlists);
    
  } catch (error) {
    console.error('Wishlist get error:', error);
    return NextResponse.json(
      { error: "Failed to get wishlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { catalogItemId } = await request.json();
    
    if (!catalogItemId) {
      return NextResponse.json({ error: "catalogItemId is required" }, { status: 400 });
    }
    
    const db = getDb();
    
    // Check if already in wishlist
    const existing = await db.select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.customerId, session.customerId),
          eq(wishlists.catalogItemId, catalogItemId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json({ message: "Already in wishlist" });
    }
    
    await db.insert(wishlists).values({
      customerId: session.customerId,
      catalogItemId: catalogItemId,
      createdAt: new Date()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Wishlist add error:', error);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const catalogItemId = searchParams.get('catalogItemId');
    
    if (!catalogItemId) {
      return NextResponse.json({ error: "catalogItemId is required" }, { status: 400 });
    }
    
    const db = getDb();
    
    await db.delete(wishlists)
      .where(
        and(
          eq(wishlists.customerId, session.customerId),
          eq(wishlists.catalogItemId, parseInt(catalogItemId))
        )
      );
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Wishlist remove error:', error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}