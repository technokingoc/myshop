import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { productVariants, catalogItems } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { checkDbReadiness } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const productId = req.nextUrl.searchParams.get("productId");
    
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const variants = await withRetry(
      () => 
        db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, Number(productId)))
          .orderBy(productVariants.sortOrder),
      3,
    );

    return NextResponse.json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const {
      productId,
      name,
      sku,
      price,
      compareAtPrice,
      stockQuantity,
      lowStockThreshold,
      imageUrl,
      attributes,
      sortOrder,
      active,
    } = body;

    if (!productId || !name || price === undefined) {
      return NextResponse.json(
        { error: "productId, name, and price required" },
        { status: 400 }
      );
    }

    const [variant] = await withRetry(
      () =>
        db
          .insert(productVariants)
          .values({
            productId: Number(productId),
            name,
            sku: sku || "",
            price: String(price),
            compareAtPrice: compareAtPrice ? String(compareAtPrice) : "0",
            stockQuantity: stockQuantity || 0,
            lowStockThreshold: lowStockThreshold || 5,
            imageUrl: imageUrl || "",
            attributes: attributes || {},
            sortOrder: sortOrder || 0,
            active: active !== false,
          })
          .returning(),
      3,
    );

    // Update parent product to mark it as having variants
    await withRetry(
      () =>
        db
          .update(catalogItems)
          .set({ hasVariants: true })
          .where(eq(catalogItems.id, Number(productId))),
      3,
    );

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "variant id required" }, { status: 400 });
    }

    const setObj: Record<string, unknown> = {};
    if (updates.name !== undefined) setObj.name = updates.name;
    if (updates.sku !== undefined) setObj.sku = updates.sku;
    if (updates.price !== undefined) setObj.price = String(updates.price);
    if (updates.compareAtPrice !== undefined) 
      setObj.compareAtPrice = String(updates.compareAtPrice);
    if (updates.stockQuantity !== undefined) 
      setObj.stockQuantity = updates.stockQuantity;
    if (updates.lowStockThreshold !== undefined) 
      setObj.lowStockThreshold = updates.lowStockThreshold;
    if (updates.imageUrl !== undefined) setObj.imageUrl = updates.imageUrl;
    if (updates.attributes !== undefined) setObj.attributes = updates.attributes;
    if (updates.sortOrder !== undefined) setObj.sortOrder = updates.sortOrder;
    if (updates.active !== undefined) setObj.active = updates.active;

    const [variant] = await withRetry(
      () =>
        db
          .update(productVariants)
          .set(setObj)
          .where(eq(productVariants.id, Number(id)))
          .returning(),
      3,
    );

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");
    const productId = req.nextUrl.searchParams.get("productId");
    
    if (!id) {
      return NextResponse.json({ error: "variant id required" }, { status: 400 });
    }

    await withRetry(
      () => db.delete(productVariants).where(eq(productVariants.id, Number(id))),
      3,
    );

    // Check if this was the last variant and update parent product
    if (productId) {
      const remainingVariants = await withRetry(
        () =>
          db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, Number(productId))),
        3,
      );

      if (remainingVariants.length === 0) {
        await withRetry(
          () =>
            db
              .update(catalogItems)
              .set({ hasVariants: false })
              .where(eq(catalogItems.id, Number(productId))),
          3,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}