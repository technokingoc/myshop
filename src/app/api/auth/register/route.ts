import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
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

    // Check email uniqueness
    const existingEmail = await db.select().from(sellers).where(eq(sellers.email, email)).limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Check slug uniqueness
    const existingSlug = await db.select().from(sellers).where(eq(sellers.slug, slug)).limit(1);
    if (existingSlug.length > 0) {
      return NextResponse.json({ error: "Store slug already taken" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert seller
    const result = await db.insert(sellers).values({
      name: storeName,
      slug,
      ownerName,
      email,
      passwordHash,
      businessType: businessType || "Retail",
      currency: currency || "USD",
      city: city || "",
      socialLinks: {
        whatsapp: whatsapp || "",
        instagram: instagram || "",
        facebook: facebook || "",
      },
    }).returning({ id: sellers.id });

    return NextResponse.json({ success: true, sellerId: result[0].id });
  } catch (err: unknown) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
