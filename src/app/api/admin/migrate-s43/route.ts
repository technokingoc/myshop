// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured");
    }

    const sql = neon(url);
    console.log("Starting Sprint S43 migration...");

    // Step 1: Create notification_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_type VARCHAR(32) NOT NULL DEFAULT 'seller',
        
        email_order_updates BOOLEAN DEFAULT TRUE,
        email_inventory_alerts BOOLEAN DEFAULT TRUE,
        email_review_alerts BOOLEAN DEFAULT TRUE,
        email_promotional_emails BOOLEAN DEFAULT FALSE,
        email_system_updates BOOLEAN DEFAULT TRUE,
        
        inapp_order_updates BOOLEAN DEFAULT TRUE,
        inapp_inventory_alerts BOOLEAN DEFAULT TRUE,
        inapp_review_alerts BOOLEAN DEFAULT TRUE,
        inapp_system_updates BOOLEAN DEFAULT TRUE,
        
        email_frequency VARCHAR(32) DEFAULT 'instant',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 2: Create indexes for notification_preferences
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_one_preference_per_user 
      ON notification_preferences(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
      ON notification_preferences(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type 
      ON notification_preferences(user_type)
    `;

    // Step 3: Enhance existing notifications table
    await sql`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT ''
    `;

    await sql`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1
    `;

    await sql`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS notification_channel VARCHAR(32) DEFAULT 'in_app'
    `;

    // Step 4: Add performance indexes for notifications
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
      ON notifications(seller_id, customer_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_read_status 
      ON notifications(read, created_at)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_type_priority 
      ON notifications(type, priority, created_at)
    `;

    console.log("Migration completed successfully!");

    return NextResponse.json({ 
      success: true, 
      message: "Sprint S43 migration completed successfully" 
    });

  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) || "Unknown error" },
      { status: 500 }
    );
  }
}