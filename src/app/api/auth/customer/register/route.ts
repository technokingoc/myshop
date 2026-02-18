import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createCustomerSessionCookie } from "@/lib/customer-session";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email.toLowerCase()));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(password));
    const passwordHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    const [customer] = await db.insert(customers).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim() || "",
    }).returning();

    await createCustomerSessionCookie({ customerId: customer.id, email: customer.email, name: customer.name });

    return NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email } }, { status: 201 });
  } catch (error) {
    console.error("Customer register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
