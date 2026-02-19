import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createUnifiedSessionCookie } from "@/lib/unified-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, city, country } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const db = getDb();
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUsers = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim() || "",
      city: city?.trim() || "",
      country: country?.trim() || "",
      role: "user",
    }).returning();

    const newUser = newUsers[0];

    // Create session for new user (no store initially)
    await createUnifiedSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      hasStore: false,
      role: newUser.role || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        hasStore: false,
        store: null,
      },
    });
  } catch (err: unknown) {
    console.error("Unified registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}