import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ session: null });
    }
    const db = getDb();
    const [customer] = await db.select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
      city: customers.city,
      country: customers.country,
    }).from(customers).where(eq(customers.id, session.customerId));

    if (!customer) {
      return NextResponse.json({ session: null });
    }
    return NextResponse.json({ session: { customerId: customer.id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, city: customer.city, country: customer.country } });
  } catch (error) {
    console.error("Customer me error:", error);
    return NextResponse.json({ session: null });
  }
}
