import { NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unified-session";
import { getDb } from "@/lib/db";
import { stores, catalogItems, shippingZones, shippingMethods } from "@/lib/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const db = getDb();

    // Get user's store
    const userStores = await db
      .select()
      .from(stores)
      .where(eq(stores.userId, session.userId))
      .limit(1);

    if (!userStores.length) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = userStores[0];

    // Check various onboarding tasks
    const [productCount] = await db
      .select({ count: count() })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.sellerId, store.id),
        eq(catalogItems.status, "Published")
      ));

    const [shippingZoneCount] = await db
      .select({ count: count() })
      .from(shippingZones)
      .where(and(
        eq(shippingZones.sellerId, store.id),
        eq(shippingZones.active, true)
      ));

    const [shippingMethodCount] = await db
      .select({ count: count() })
      .from(shippingMethods)
      .where(eq(shippingMethods.sellerId, store.id));

    // Calculate onboarding progress
    const status = {
      // Basic store information
      storeInfo: {
        completed: !!(store.name && store.city && store.businessType),
        details: {
          hasName: !!store.name,
          hasCity: !!store.city,
          hasBusinessType: !!store.businessType,
        }
      },
      
      // Products
      products: {
        completed: productCount.count > 0,
        count: productCount.count,
      },
      
      // Store customization
      customization: {
        completed: !!(
          store.themeColor && store.themeColor !== "indigo" ||
          store.storeTemplate && store.storeTemplate !== "classic" ||
          store.logoUrl
        ),
        details: {
          hasCustomTheme: store.themeColor !== "indigo",
          hasCustomTemplate: store.storeTemplate !== "classic", 
          hasLogo: !!store.logoUrl,
        }
      },
      
      // Business verification
      verification: {
        completed: !!(store.address && store.logoUrl), // Simple check for now
        details: {
          hasAddress: !!store.address,
          hasLogo: !!store.logoUrl,
        }
      },
      
      // Shipping setup
      shipping: {
        completed: shippingZoneCount.count > 0 && shippingMethodCount.count > 0,
        details: {
          hasZones: shippingZoneCount.count > 0,
          hasMethods: shippingMethodCount.count > 0,
          zoneCount: shippingZoneCount.count,
          methodCount: shippingMethodCount.count,
        }
      },
      
      // Payment setup (placeholder - would need payment integration)
      payment: {
        completed: false, // TODO: Implement when payment methods are added
        details: {
          hasPaymentMethods: false,
        }
      },
      
      // Store metadata
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        themeColor: store.themeColor,
        storeTemplate: store.storeTemplate,
      }
    };

    // Calculate overall progress
    const tasks = Object.values(status).filter(task => typeof task === 'object' && 'completed' in task);
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    
    return NextResponse.json({
      success: true,
      progress: {
        completed: completedTasks,
        total: totalTasks,
        percentage: Math.round((completedTasks / totalTasks) * 100),
      },
      status,
    });
  } catch (error) {
    console.error("Onboarding status error:", error);
    return NextResponse.json({ error: "Failed to get onboarding status" }, { status: 500 });
  }
}