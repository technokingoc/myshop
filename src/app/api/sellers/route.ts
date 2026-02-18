import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(sellers);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
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
}
