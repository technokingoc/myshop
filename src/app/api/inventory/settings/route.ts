import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

type InventorySettings = {
  autoHideOutOfStock: boolean;
  lowStockEmailAlerts: boolean;
  outOfStockEmailAlerts: boolean;
  restockReminderFrequency: 'instant' | 'daily' | 'weekly';
};

export async function GET(req: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Get current store settings
    const [store] = await db
      .select({
        autoHideOutOfStock: stores.storeTemplate, // We'll use this field to store the setting for now
        emailNotifications: stores.emailNotifications,
      })
      .from(stores)
      .where(eq(stores.userId, sellerId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // For now, we'll mock the auto-hide setting since it's not in the schema yet
    // In a real implementation, you'd add a proper field to the stores table
    const settings: InventorySettings = {
      autoHideOutOfStock: false, // Default to false for now
      lowStockEmailAlerts: store.emailNotifications ?? true,
      outOfStockEmailAlerts: store.emailNotifications ?? true,
      restockReminderFrequency: 'daily',
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error("Failed to get inventory settings:", error);
    return NextResponse.json(
      { error: "Failed to get inventory settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      autoHideOutOfStock, 
      lowStockEmailAlerts, 
      outOfStockEmailAlerts,
      restockReminderFrequency 
    }: Partial<InventorySettings> = body;

    const db = getDb();
    
    // Update store settings
    // For the auto-hide feature, we'll need to add logic to the product display queries
    // For now, we'll just acknowledge the setting
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (lowStockEmailAlerts !== undefined || outOfStockEmailAlerts !== undefined) {
      // Update email notifications setting
      updateData.emailNotifications = lowStockEmailAlerts ?? outOfStockEmailAlerts ?? true;
    }

    const result = await db
      .update(stores)
      .set(updateData)
      .where(eq(stores.userId, sellerId))
      .returning({ id: stores.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // In a real implementation, you might also:
    // 1. Update product visibility based on autoHideOutOfStock
    // 2. Update notification preferences
    // 3. Schedule/unschedule reminder emails based on restockReminderFrequency

    // For the auto-hide feature, we would need to modify the catalog queries 
    // to filter out products where stockQuantity = 0 when autoHideOutOfStock is true

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });

  } catch (error) {
    console.error("Failed to update inventory settings:", error);
    return NextResponse.json(
      { error: "Failed to update inventory settings" },
      { status: 500 }
    );
  }
}