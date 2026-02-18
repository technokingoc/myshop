import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
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
    const results = await db.select().from(sellers).where(eq(sellers.email, email)).limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const seller = results[0];

    if (!seller.passwordHash) {
      return NextResponse.json({ error: "Account not set up for password login" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, seller.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSessionCookie({
      sellerId: seller.id,
      email: seller.email!,
      sellerSlug: seller.slug,
      storeName: seller.name,
    });

    return NextResponse.json({
      success: true,
      seller: {
        id: seller.id,
        slug: seller.slug,
        name: seller.name,
        email: seller.email,
      },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
