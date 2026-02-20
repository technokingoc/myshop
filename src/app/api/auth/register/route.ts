import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeName, slug, ownerName, email, password, businessType, currency, city, whatsapp, instagram, facebook } = body;

    // Validate required fields
    if (!storeName || !slug || !ownerName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const db = getDb();

    // Check email uniqueness in users table
    const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Check slug uniqueness in stores table
    const existingSlug = await db.select({ id: stores.id }).from(stores).where(eq(stores.slug, slug)).limit(1);
    if (existingSlug.length > 0) {
      return NextResponse.json({ error: "Store slug already taken" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await db.insert(users).values({
      email,
      passwordHash,
      name: ownerName,
      city: city || "",
      role: "seller",
    }).returning({ id: users.id });

    const userId = userResult[0].id;

    // Create store
    await db.insert(stores).values({
      userId,
      slug,
      name: storeName,
      businessType: businessType || "Retail",
      currency: currency || "USD",
      city: city || "",
      socialLinks: {
        whatsapp: whatsapp || "",
        instagram: instagram || "",
        facebook: facebook || "",
      },
    });

    return NextResponse.json({ success: true, sellerId: userId });
  } catch (err: unknown) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
