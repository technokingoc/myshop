import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { customerReviews } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const db = getDb();

  await db.delete(customerReviews).where(eq(customerReviews.id, Number(id)));

  return NextResponse.json({ success: true });
}
