import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productTags, productTagAssignments, catalogItems } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await db
      .select()
      .from(productTags)
      .where(eq(productTags.sellerId, sellerId))
      .orderBy(desc(productTags.productCount), productTags.name);

    return NextResponse.json({ tags });

  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    // Create slug from name
    const slug = name.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Add seller ID to slug to ensure uniqueness per seller
    const uniqueSlug = `${sellerId}-${slug}`;

    const newTag = {
      name: name.trim(),
      slug: uniqueSlug,
      color: color || '#3B82F6',
      sellerId,
      productCount: 0
    };

    const [insertedTag] = await db.insert(productTags).values(newTag).returning();

    return NextResponse.json({ tag: insertedTag });

  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}