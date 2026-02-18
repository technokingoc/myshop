import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { catalogItems } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.name) updates.name = body.name;

  await db.update(catalogItems).set(updates).where(eq(catalogItems.id, Number(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const db = getDb();

  await db.delete(catalogItems).where(eq(catalogItems.id, Number(id)));

  return NextResponse.json({ success: true });
}
