import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
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

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(sellers);
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { slug, name, description, ownerName, businessType, currency, city, logoUrl, socialLinks } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    const [row] = await db
      .insert(sellers)
      .values({
        slug,
        name,
        description: description || "",
        ownerName: ownerName || "",
        businessType: businessType || "Retail",
        currency: currency || "USD",
        city: city || "",
        logoUrl: logoUrl || "",
        socialLinks: socialLinks || {},
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
