import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { locations } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const db = getDb();
    const rows = await db.select().from(locations).orderBy(asc(locations.sortOrder));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Admin locations GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const db = getDb();
    const body = await req.json();
    const [row] = await db.insert(locations).values({
      nameEn: body.nameEn,
      namePt: body.namePt,
      slug: body.slug,
      country: body.country || "Mozambique",
      region: body.region || "",
      sortOrder: body.sortOrder ?? 0,
      active: body.active !== false,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("Admin locations POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const db = getDb();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const setObj: Record<string, unknown> = {};
    if (body.nameEn !== undefined) setObj.nameEn = body.nameEn;
    if (body.namePt !== undefined) setObj.namePt = body.namePt;
    if (body.slug !== undefined) setObj.slug = body.slug;
    if (body.country !== undefined) setObj.country = body.country;
    if (body.region !== undefined) setObj.region = body.region;
    if (body.sortOrder !== undefined) setObj.sortOrder = body.sortOrder;
    if (body.active !== undefined) setObj.active = body.active;
    const [row] = await db.update(locations).set(setObj).where(eq(locations.id, body.id)).returning();
    return NextResponse.json(row);
  } catch (err) {
    console.error("Admin locations PUT error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(locations).where(eq(locations.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin locations DELETE error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
