import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, sellers } from "@/lib/schema";
import { eq, and, desc, like, sql, ilike, or } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where conditions
    let whereConditions = [eq(catalogItems.sellerId, sellerId)];

    if (search) {
      whereConditions.push(
        or(
          ilike(catalogItems.name, `%${search}%`),
          ilike(catalogItems.category, `%${search}%`),
          ilike(catalogItems.shortDescription, `%${search}%`)
        )!
      );
    }

    if (category) {
      whereConditions.push(eq(catalogItems.category, category));
    }

    if (status) {
      whereConditions.push(eq(catalogItems.status, status));
    }

    // Fetch products
    const products = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        currentPrice: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        category: catalogItems.category,
        status: catalogItems.status,
        stockQuantity: catalogItems.stockQuantity,
        imageUrl: catalogItems.imageUrl,
        hasVariants: catalogItems.hasVariants,
        shortDescription: catalogItems.shortDescription,
        createdAt: catalogItems.createdAt,
      })
      .from(catalogItems)
      .where(and(...whereConditions))
      .orderBy(desc(catalogItems.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform data for frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      currentPrice: parseFloat(product.currentPrice || "0"),
      compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : undefined,
      category: product.category || "",
      status: product.status || "Draft",
      stockQuantity: product.stockQuantity || 0,
      imageUrl: product.imageUrl || "",
      hasVariants: product.hasVariants || false,
      shortDescription: product.shortDescription || "",
    }));

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      products: formattedProducts,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });

  } catch (error) {
    console.error("Failed to fetch products for bulk operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}