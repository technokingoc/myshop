#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
    console.log("Running S51 language migration...");
    
    // Execute individual statements using template literals
    const statements = [
      "ALTER TABLE sellers ADD COLUMN IF NOT EXISTS language VARCHAR(8) DEFAULT 'en'",
      "ALTER TABLE stores ADD COLUMN IF NOT EXISTS language VARCHAR(8) DEFAULT 'en'", 
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(8) DEFAULT 'en'",
      "UPDATE sellers SET language = 'en' WHERE language IS NULL",
      "UPDATE stores SET language = 'en' WHERE language IS NULL",
      "UPDATE users SET language = 'en' WHERE language IS NULL",
      "CREATE INDEX IF NOT EXISTS idx_sellers_language ON sellers(language)",
      "CREATE INDEX IF NOT EXISTS idx_stores_language ON stores(language)",
      "CREATE INDEX IF NOT EXISTS idx_users_language ON users(language)"
    ];
    
    for (const statement of statements) {
      console.log(`Executing: ${statement}`);
      await sql.query(statement);
    }
    
    console.log("✅ S51 language migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();