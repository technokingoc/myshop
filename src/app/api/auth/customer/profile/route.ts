import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, createCustomerSessionCookie } from "@/lib/customer-session";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { name, phone, address, city, country } = await req.json();
    const db = getDb();

    const updates: Record<string, string> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address !== undefined) updates.address = address.trim();
    if (city !== undefined) updates.city = city.trim();
    if (country !== undefined) updates.country = country.trim();

    const [updated] = await db.update(customers).set(updates).where(eq(customers.id, session.customerId)).returning();

    // Update session cookie with new name
    await createCustomerSessionCookie({ customerId: updated.id, email: updated.email, name: updated.name });

    return NextResponse.json({ ok: true, customer: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, address: updated.address, city: updated.city, country: updated.country } });
  } catch (error) {
    console.error("Customer profile update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
