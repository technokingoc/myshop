import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";

function handleApiError(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Database request failed" }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const db = getDb();
    const { slug } = await params;
    const [row] = await db.select().from(sellers).where(eq(sellers.slug, slug));
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}
