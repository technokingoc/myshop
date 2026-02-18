import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { categories } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder));

    // Build tree structure
    const roots = rows.filter((r) => !r.parentId);
    const children = rows.filter((r) => r.parentId);
    const tree = roots.map((r) => ({
      ...r,
      children: children.filter((c) => c.parentId === r.id),
    }));

    return NextResponse.json(tree);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
