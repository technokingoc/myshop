import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
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
    const { action, productIds, sellerId } = body;

    if (!action || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "action and productIds required" }, { status: 400 });
    }

    const ids = productIds.map((id) => Number(id));

    switch (action) {
      case "activate": {
        const updated = await withRetry(
          () => 
            db
              .update(catalogItems)
              .set({ status: "Published" })
              .where(inArray(catalogItems.id, ids))
              .returning(),
          3,
        );
        return NextResponse.json({ success: true, updated: updated.length });
      }

      case "deactivate": {
        const updated = await withRetry(
          () =>
            db
              .update(catalogItems)
              .set({ status: "Draft" })
              .where(inArray(catalogItems.id, ids))
              .returning(),
          3,
        );
        return NextResponse.json({ success: true, updated: updated.length });
      }

      case "delete": {
        await withRetry(
          () => db.delete(catalogItems).where(inArray(catalogItems.id, ids)),
          3,
        );
        return NextResponse.json({ success: true, deleted: ids.length });
      }

      case "duplicate": {
        // Get original products
        const originals = await withRetry(
          () => 
            db
              .select()
              .from(catalogItems)
              .where(inArray(catalogItems.id, ids)),
          3,
        );

        // Create duplicates
        const duplicates = originals.map((original) => ({
          ...original,
          id: undefined, // Will be auto-generated
          name: `${original.name} (Copy)`,
          status: "Draft" as const,
        }));

        const created = await withRetry(
          () => 
            db.insert(catalogItems).values(duplicates).returning(),
          3,
        );

        return NextResponse.json({ 
          success: true, 
          duplicated: created.length,
          products: created 
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Bulk operation failed" },
      { status: 500 }
    );
  }
}