import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();
  const rows = await db.select().from(platformSettings);

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value ?? "";
  }

  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const db = getDb();

  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(platformSettings)
      .values({ key, value: String(value), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: String(value), updatedAt: new Date() },
      });
  }

  return NextResponse.json({ success: true });
}
