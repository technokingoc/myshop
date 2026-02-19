import { NextRequest, NextResponse } from "next/server";
import { 
  getRestockReminders, 
  createRestockReminder, 
  snoozeRestockReminder 
} from "@/lib/inventory-service";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: "No seller ID found" }, { status: 400 });
    }

    const reminders = await getRestockReminders(sellerId);
    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Get restock reminders API error:", error);
    return NextResponse.json(
      { error: "Failed to get restock reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: "No seller ID found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      productId,
      variantId,
      triggerQuantity,
      targetQuantity,
      leadTimeDays = 7,
      supplierName = '',
      supplierEmail = '',
      supplierPhone = '',
      minOrderQuantity = 1,
      emailNotifications = true,
    } = body;

    if (!productId && !variantId) {
      return NextResponse.json(
        { error: "Either productId or variantId is required" },
        { status: 400 }
      );
    }

    if (typeof triggerQuantity !== 'number' || typeof targetQuantity !== 'number') {
      return NextResponse.json(
        { error: "triggerQuantity and targetQuantity must be numbers" },
        { status: 400 }
      );
    }

    const result = await createRestockReminder({
      sellerId,
      productId,
      variantId: variantId || null,
      triggerQuantity,
      targetQuantity,
      leadTimeDays,
      supplierName,
      supplierEmail,
      supplierPhone,
      minOrderQuantity,
      emailNotifications,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create restock reminder" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reminderId: result.reminderId,
      message: "Restock reminder created successfully",
    });
  } catch (error) {
    console.error("Create restock reminder API error:", error);
    return NextResponse.json(
      { error: "Failed to create restock reminder" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, reminderId, hours = 24 } = body;

    if (action === "snooze" && reminderId) {
      const result = await snoozeRestockReminder(reminderId, hours);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to snooze reminder" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reminder snoozed successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update restock reminder API error:", error);
    return NextResponse.json(
      { error: "Failed to update restock reminder" },
      { status: 500 }
    );
  }
}