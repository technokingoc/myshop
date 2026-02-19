import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { stores, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getUnifiedSession, createUnifiedSessionCookie } from "@/lib/unified-session";

export async function POST(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user already has a store
    if (session.hasStore) {
      return NextResponse.json({ error: "User already has a store" }, { status: 409 });
    }

    const body = await req.json();
    const { name, slug, businessType, description, city, country } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Store name and slug are required" }, { status: 400 });
    }

    // Validate slug format (letters, numbers, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, and hyphens" }, { status: 400 });
    }

    const db = getDb();

    // Check if slug is already taken
    const existingStore = await db.select().from(stores).where(eq(stores.slug, slug.toLowerCase())).limit(1);
    if (existingStore.length > 0) {
      return NextResponse.json({ error: "Store slug already taken" }, { status: 409 });
    }

    // Create the store
    const newStores = await db.insert(stores).values({
      userId: session.userId,
      slug: slug.toLowerCase().trim(),
      name: name.trim(),
      description: description?.trim() || "",
      businessType: businessType || "Retail",
      city: city?.trim() || "",
      country: country?.trim() || "",
      plan: "free",
      themeColor: "indigo",
      storeTemplate: "classic",
      headerTemplate: "compact",
    }).returning();

    const newStore = newStores[0];

    // Update the session to include store info
    await createUnifiedSessionCookie({
      userId: session.userId,
      email: session.email,
      name: session.name,
      hasStore: true,
      storeId: newStore.id,
      storeSlug: newStore.slug,
      storeName: newStore.name,
      role: session.role || undefined,
    });

    return NextResponse.json({
      success: true,
      store: {
        id: newStore.id,
        slug: newStore.slug,
        name: newStore.name,
        description: newStore.description,
        businessType: newStore.businessType,
      },
    });
  } catch (err: unknown) {
    console.error("Store creation error:", err);
    return NextResponse.json({ error: "Failed to create store" }, { status: 500 });
  }
}