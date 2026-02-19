import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createUnifiedSessionCookie } from "@/lib/unified-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const db = getDb();
    
    // Find user by email
    const userResults = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (userResults.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = userResults[0];

    // Verify password (using bcrypt for new unified system)
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check if user has a store
    const storeResults = await db.select().from(stores).where(eq(stores.userId, user.id)).limit(1);
    const userStore = storeResults[0] || null;

    // Create unified session
    await createUnifiedSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      hasStore: !!userStore,
      storeId: userStore?.id,
      storeSlug: userStore?.slug,
      storeName: userStore?.name,
      role: user.role || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasStore: !!userStore,
        store: userStore ? {
          id: userStore.id,
          slug: userStore.slug,
          name: userStore.name,
        } : null,
      },
    });
  } catch (err: unknown) {
    console.error("Unified login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}