import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const db = getDb();
  const { slug } = await params;
  const [row] = await db.select().from(sellers).where(eq(sellers.slug, slug));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const db = getDb();
  const { slug } = await params;
  const body = await req.json();

  const [existing] = await db.select().from(sellers).where(eq(sellers.slug, slug));
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [updated] = await db
    .update(sellers)
    .set({
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      ownerName: body.ownerName ?? existing.ownerName,
      businessType: body.businessType ?? existing.businessType,
      currency: body.currency ?? existing.currency,
      city: body.city ?? existing.city,
      logoUrl: body.logoUrl ?? existing.logoUrl,
      socialLinks: body.socialLinks ?? existing.socialLinks,
      updatedAt: new Date(),
    })
    .where(eq(sellers.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}
