import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const updates: Record<string, unknown> = {};
  if (body.role) updates.role = body.role;

  await db.update(sellers).set(updates).where(eq(sellers.id, Number(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const db = getDb();

  await db.delete(sellers).where(eq(sellers.id, Number(id)));

  return NextResponse.json({ success: true });
}
