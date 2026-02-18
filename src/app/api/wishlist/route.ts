import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { getDb } from "@/lib/db";
import { wishlists, catalogItems, sellers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
    const rows = await db
      .select({
        wishlistId: wishlists.id,
        catalogItemId: wishlists.catalogItemId,
        itemName: catalogItems.name,
        itemPrice: catalogItems.price,
        itemImageUrl: catalogItems.imageUrl,
        itemCategory: catalogItems.category,
        sellerSlug: sellers.slug,
        sellerName: sellers.name,
        sellerCurrency: sellers.currency,
      })
      .from(wishlists)
      .innerJoin(catalogItems, eq(wishlists.catalogItemId, catalogItems.id))
      .innerJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(eq(wishlists.customerId, session.customerId));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json({ error: "Failed to load wishlist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { catalogItemId } = await req.json();
    if (!catalogItemId) return NextResponse.json({ error: "catalogItemId required" }, { status: 400 });

    const db = getDb();
    const [row] = await db.insert(wishlists).values({
      customerId: session.customerId,
      catalogItemId: Number(catalogItemId),
    }).onConflictDoNothing().returning();

    return NextResponse.json({ ok: true, id: row?.id });
  } catch (error) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const catalogItemId = req.nextUrl.searchParams.get("catalogItemId");
    if (!catalogItemId) return NextResponse.json({ error: "catalogItemId required" }, { status: 400 });

    const db = getDb();
    await db.delete(wishlists).where(
      and(eq(wishlists.customerId, session.customerId), eq(wishlists.catalogItemId, Number(catalogItemId)))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Wishlist DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
