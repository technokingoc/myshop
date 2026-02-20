import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const db = getDb();

    // Look up user
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userResults.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = userResults[0];

    if (!user.passwordHash) {
      return NextResponse.json({ error: "Account not set up for password login" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Look up store for this user
    const storeResults = await db.select().from(stores).where(eq(stores.userId, user.id)).limit(1);
    const store = storeResults[0];

    await createSessionCookie({
      sellerId: user.id,
      email: user.email,
      sellerSlug: store?.slug ?? "",
      storeName: store?.name ?? user.name,
      role: user.role ?? "user",
    });

    return NextResponse.json({
      success: true,
      seller: {
        id: user.id,
        slug: store?.slug ?? "",
        name: store?.name ?? user.name,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
