import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { locations } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(locations)
      .where(eq(locations.active, true))
      .orderBy(asc(locations.sortOrder));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Locations API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
