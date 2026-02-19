import { NextRequest, NextResponse } from "next/server";
import { users } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
    const user = await db
      .select({
        id: users.id,
        // Add other settings fields when they're added to the schema
      })
      .from(users)
      .where(eq(users.id, session.customerId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return default settings structure - for now all are defaults
    // Later these can be stored in a separate settings table
    const settings = {
      emailNotifications: {
        orderUpdates: true, // Default values
        promotions: false,
        newsletter: false,
      },
      privacy: {
        showProfile: false,
        dataCollection: true,
      },
      language: "en", // Default language
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { settings } = await request.json();

    const db = getDb();
    
    // For now, settings are handled client-side since users table doesn't have these fields
    // In a full implementation, we'd create a user_settings table
    // Just update the updatedAt timestamp to show activity
    await db
      .update(users)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.customerId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}