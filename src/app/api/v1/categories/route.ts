import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { categories, catalogItems } from "@/lib/schema";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";

// GET /api/v1/categories - List categories
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.CATEGORIES_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeProductCount = searchParams.get("include_product_count") === "true";
    const parentId = searchParams.get("parent_id");
    const topLevelOnly = searchParams.get("top_level_only") === "true";
    const language = searchParams.get("language") || "en";
    const sortBy = searchParams.get("sort_by") || "sort_order";
    const sortOrder = searchParams.get("sort_order") || "asc";

    const db = getDb();
    
    // Build conditions
    const conditions: any[] = [eq(categories.active, true)];
    
    if (parentId) {
      conditions.push(eq(categories.parentId, parseInt(parentId, 10)));
    } else if (topLevelOnly) {
      conditions.push(isNull(categories.parentId));
    }

    // Determine sort order
    const orderBy = sortOrder === "asc" ? asc : desc;
    let sortColumn;
    switch (sortBy) {
      case "name":
        sortColumn = orderBy(language === "pt" ? categories.namePt : categories.nameEn);
        break;
      case "created_at":
        sortColumn = orderBy(categories.createdAt);
        break;
      default:
        sortColumn = orderBy(categories.sortOrder);
    }

    // Get categories
    let categoriesQuery = db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
        namePt: categories.namePt,
        slug: categories.slug,
        icon: categories.icon,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        active: categories.active,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .where(and(...conditions))
      .orderBy(sortColumn);

    const categoriesList = await categoriesQuery;

    // Add product count if requested
    let categoriesWithCount = categoriesList;
    if (includeProductCount) {
      const categoryIds = categoriesList.map(c => c.id);
      
      if (categoryIds.length > 0) {
        // Get product counts
        const productCounts = await db
          .select({
            category: catalogItems.category,
            count: sql<number>`count(*)`
          })
          .from(catalogItems)
          .where(and(
            eq(catalogItems.status, "Published"),
            sql`${catalogItems.category} = ANY(${categoriesList.map(c => c.nameEn)})`
          ))
          .groupBy(catalogItems.category);

        // Create a map for quick lookup
        const countMap = Object.fromEntries(
          productCounts.map(pc => [pc.category, pc.count])
        );

        categoriesWithCount = categoriesList.map(category => ({
          ...category,
          productCount: countMap[category.nameEn] || 0
        }));
      } else {
        categoriesWithCount = categoriesList.map(category => ({
          ...category,
          productCount: 0
        }));
      }
    }

    // Build hierarchy if no specific parent requested
    let responseData = categoriesWithCount;
    if (!parentId && !topLevelOnly) {
      // Build tree structure
      const categoryMap = new Map(categoriesWithCount.map(cat => [cat.id, { ...cat, children: [] as any[] }]));
      const rootCategories: any[] = [];

      categoriesWithCount.forEach(category => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryMap.get(category.id)!);
          }
        } else {
          rootCategories.push(categoryMap.get(category.id)!);
        }
      });

      responseData = rootCategories;
    }

    return NextResponse.json({
      data: responseData,
      meta: {
        total: categoriesList.length,
        language,
        hierarchy: !parentId && !topLevelOnly
      }
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/v1/categories - Create category (Admin only)
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.CATEGORIES_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const {
      nameEn,
      namePt,
      slug,
      icon = "",
      parentId = null,
      sortOrder = 0,
      active = true,
    } = body;

    // Validate required fields
    if (!nameEn || !namePt) {
      return NextResponse.json(
        { error: "Both English and Portuguese names are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Check if slug already exists
    if (slug) {
      const existingCategory = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (existingCategory.length > 0) {
        return NextResponse.json(
          { error: "Category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Generate slug if not provided
    const finalSlug = slug || nameEn.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Validate parent category exists
    if (parentId) {
      const parentCategory = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, parentId))
        .limit(1);

      if (!parentCategory.length) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    // Create category
    const categoryResult = await db.insert(categories).values({
      nameEn,
      namePt,
      slug: finalSlug,
      icon,
      parentId,
      sortOrder,
      active,
    }).returning({
      id: categories.id,
      nameEn: categories.nameEn,
      namePt: categories.namePt,
      slug: categories.slug,
      icon: categories.icon,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      active: categories.active,
      createdAt: categories.createdAt,
    });

    return NextResponse.json({
      data: categoryResult[0],
      message: "Category created successfully"
    }, { status: 201 });
    
  } catch (error) {
    console.error("API error:", error);
    
    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}