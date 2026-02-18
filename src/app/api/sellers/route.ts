import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
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

export async function GET() {
  try {
    const db = getDb();
    const rows = await withRetry(() => db.select().from(sellers), 3);
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

    const [row] = await withRetry(
      () =>
        db
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
          .returning(),
      3,
    );

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
