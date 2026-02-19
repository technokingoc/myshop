import { NextRequest, NextResponse } from "next/server";
import { users, orders, wishlists, customerAddresses, customerReviews, notifications } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function DELETE() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = getDb();
    
    // Start a transaction to delete all customer data
    await db.transaction(async (tx) => {
      // Delete related data first (foreign key constraints)
      await tx.delete(customerAddresses).where(eq(customerAddresses.customerId, session.customerId));
      await tx.delete(customerReviews).where(eq(customerReviews.customerId, session.customerId));
      await tx.delete(wishlists).where(eq(wishlists.customerId, session.customerId));
      await tx.delete(notifications).where(eq(notifications.customerId, session.customerId));
      
      // Update orders to remove customer reference instead of deleting them
      // (merchants still need order history)
      await tx.update(orders)
        .set({ 
          customerId: null,
          customerName: "Deleted Account",
          customerContact: "account-deleted@example.com"
        })
        .where(eq(orders.customerId, session.customerId));

      // Finally delete the user account
      await tx.delete(users).where(eq(users.id, session.customerId));
    });

    // Clear the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete("customer-session");

    return response;
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}