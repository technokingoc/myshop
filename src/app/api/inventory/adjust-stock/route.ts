import { NextRequest, NextResponse } from "next/server";
import { recordStockChange } from "@/lib/inventory-service";
import { getSessionFromCookie } from "@/lib/session";

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
      quantityChange,
      changeType = 'adjustment',
      reason = '',
      notes = '',
      batchNumber = '',
      expirationDate,
      costPrice,
    } = body;

    if (!productId && !variantId) {
      return NextResponse.json(
        { error: "Either productId or variantId is required" },
        { status: 400 }
      );
    }

    if (typeof quantityChange !== 'number') {
      return NextResponse.json(
        { error: "quantityChange must be a number" },
        { status: 400 }
      );
    }

    const result = await recordStockChange({
      sellerId,
      productId,
      variantId: variantId || null,
      changeType,
      quantityChange,
      reason,
      notes,
      batchNumber,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      createdBy: sellerId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to adjust stock" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newStock: result.newStock,
      message: "Stock adjusted successfully",
    });
  } catch (error) {
    console.error("Adjust stock API error:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}