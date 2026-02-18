import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createCustomerSessionCookie } from "@/lib/customer-session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = getDb();
    const [customer] = await db.select().from(customers).where(eq(customers.email, email.toLowerCase().trim()));
    if (!customer) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const encoder = new TextEncoder();
    const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(password));
    const passwordHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (passwordHash !== customer.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createCustomerSessionCookie({ customerId: customer.id, email: customer.email, name: customer.name });

    return NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email } });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
