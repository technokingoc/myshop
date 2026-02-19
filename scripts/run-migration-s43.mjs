import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  const sql = neon(url);

  try {
    console.log("Connected to database");

    // Read and execute the migration
    const migrationPath = path.join(__dirname, "../db/migrations/0005_notification_preferences_s43.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("Running migration 0005_notification_preferences_s43.sql...");
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement using sql.query
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await sql.query(statement);
      }
    }
    
    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();