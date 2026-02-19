import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { platformSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  try {
    const settings = await db.select().from(platformSettings);
    
    // Convert array to object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value || '';
      return acc;
    }, {} as Record<string, string>);

    // Provide defaults for missing settings
    const defaultSettings = {
      platform_fee_percentage: "5.0",
      platform_fee_fixed: "0.30",
      platform_fee_enabled: "true",
      auto_approve_sellers: "false",
      auto_approve_products: "true",
      auto_approve_reviews: "true",
      email_notifications_enabled: "true",
      sms_notifications_enabled: "false",
      default_currency: "USD",
      platform_name: "MyShop",
      support_email: "support@myshop.co.mz",
      max_file_size_mb: "10",
      session_timeout_minutes: "60",
    };

    const finalSettings = { ...defaultSettings, ...settingsObject };

    return NextResponse.json({ settings: finalSettings });
  } catch (error) {
    console.error("Platform settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const settings = await request.json();
  const db = getDb();

  try {
    const now = new Date();
    
    // Update or insert each setting
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') continue;
      
      try {
        // Try to update existing setting
        const [existing] = await db
          .select({ key: platformSettings.key })
          .from(platformSettings)
          .where(eq(platformSettings.key, key))
          .limit(1);

        if (existing) {
          // Update existing
          await db
            .update(platformSettings)
            .set({ 
              value: value as string, 
              updatedAt: now 
            })
            .where(eq(platformSettings.key, key));
        } else {
          // Insert new
          await db.insert(platformSettings).values({
            key,
            value: value as string,
            updatedAt: now,
          });
        }
      } catch (settingError) {
        console.error(`Failed to update setting ${key}:`, settingError);
        // Continue with other settings
      }
    }

    // Log the admin activity
    try {
      await db.execute(`
        INSERT INTO admin_activities (admin_id, action, target_type, target_id, new_values, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        session.sellerId,
        'platform_settings_update',
        'platform',
        0,
        JSON.stringify(settings),
        'Platform settings updated',
        now
      ]);
    } catch {
      // Ignore if admin_activities table doesn't exist
    }

    return NextResponse.json({ 
      success: true, 
      message: "Settings updated successfully" 
    });

  } catch (error) {
    console.error("Platform settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}