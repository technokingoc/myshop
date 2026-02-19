import { NextRequest, NextResponse } from "next/server";
import { customerAddresses } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, session.customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const data = await request.json();
    const { label, fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = data;

    const db = getDb();
    
    // If this is being set as default, unset others
    if (isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, session.customerId));
    }

    const [newAddress] = await db
      .insert(customerAddresses)
      .values({
        customerId: session.customerId,
        label: label || "Home",
        fullName,
        addressLine1,
        addressLine2: addressLine2 || "",
        city,
        state: state || "",
        postalCode: postalCode || "",
        country: country || "Mozambique",
        phone: phone || "",
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const data = await request.json();
    const { id, label, fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = data;

    const db = getDb();
    
    // If this is being set as default, unset others
    if (isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, session.customerId));
    }

    const [updatedAddress] = await db
      .update(customerAddresses)
      .set({
        label,
        fullName,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault,
        updatedAt: new Date(),
      })
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, session.customerId)))
      .returning();

    if (!updatedAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, parseInt(addressId)), eq(customerAddresses.customerId, session.customerId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}