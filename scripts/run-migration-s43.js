const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Read and execute the migration
    const migrationPath = path.join(__dirname, "../db/migrations/0005_notification_preferences_s43.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("Running migration 0005_notification_preferences_s43.sql...");
    await client.query(migrationSQL);
    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();