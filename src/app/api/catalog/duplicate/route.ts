import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkDbReadiness } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { productId, sellerId, newName } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId required" },
        { status: 400 }
      );
    }

    // Get original product
    const [original] = await withRetry(
      () =>
        db
          .select()
          .from(catalogItems)
          .where(eq(catalogItems.id, Number(productId))),
      3,
    );

    if (!original) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify seller ownership if sellerId provided
    if (sellerId && original.sellerId !== Number(sellerId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create duplicate product
    const duplicateName = newName || `${original.name} (Copy)`;
    const [duplicate] = await withRetry(
      () =>
        db
          .insert(catalogItems)
          .values({
            ...original,
            id: undefined, // Will be auto-generated
            name: duplicateName,
            status: "Draft",
            createdAt: undefined, // Will be set to now
          })
          .returning(),
      3,
    );

    // If original has variants, duplicate them too
    if (original.hasVariants) {
      const originalVariants = await withRetry(
        () =>
          db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, original.id)),
        3,
      );

      if (originalVariants.length > 0) {
        const duplicateVariants = originalVariants.map((variant) => ({
          ...variant,
          id: undefined, // Will be auto-generated
          productId: duplicate.id,
          createdAt: undefined, // Will be set to now
        }));

        await withRetry(
          () => db.insert(productVariants).values(duplicateVariants),
          3,
        );
      }
    }

    return NextResponse.json({
      success: true,
      duplicate,
      originalId: original.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating product:", error);
    return NextResponse.json(
      { error: "Failed to duplicate product" },
      { status: 500 }
    );
  }
}