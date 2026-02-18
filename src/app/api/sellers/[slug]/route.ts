import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";

function isDbUnavailable(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return text.includes("connect") || text.includes("timeout") || text.includes("econn") || text.includes("database");
}

function handleApiError(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" },
      { status: 503 },
    );
  }

  if (isDbUnavailable(error)) {
    return NextResponse.json({ error: "Database is unavailable", errorCode: "DB_UNAVAILABLE" }, { status: 503 });
  }

  return NextResponse.json({ error: "Database request failed", errorCode: "REQUEST_FAILED" }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const db = getDb();
    const { slug } = await params;
    const [row] = await withRetry(() => db.select().from(sellers).where(eq(sellers.slug, slug)), 3);
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

    const [existing] = await withRetry(() => db.select().from(sellers).where(eq(sellers.slug, slug)), 3);
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

    const [updated] = await withRetry(
      () =>
        db
          .update(sellers)
          .set({
            name: body.name ?? existing.name,
            description: body.description ?? existing.description,
            ownerName: body.ownerName ?? existing.ownerName,
            businessType: body.businessType ?? existing.businessType,
            currency: body.currency ?? existing.currency,
            city: body.city ?? existing.city,
            logoUrl: body.logoUrl ?? existing.logoUrl,
            bannerUrl: body.bannerUrl ?? existing.bannerUrl,
            socialLinks: body.socialLinks ?? existing.socialLinks,
            updatedAt: new Date(),
          })
          .where(eq(sellers.id, existing.id))
          .returning(),
      3,
    );

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
