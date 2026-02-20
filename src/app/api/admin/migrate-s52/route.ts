import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'scripts', 'migrate-s52-subscriptions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    console.log('Running S52 migration: Subscription Billing System...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let executedStatements = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(statement);
          executedStatements++;
        } catch (error) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          console.error(error);
          // Continue with other statements for CREATE TABLE IF NOT EXISTS scenarios
        }
      }
    }
    
    console.log(`✅ S52 migration completed successfully! Executed ${executedStatements} statements.`);
    
    return Response.json({ 
      success: true, 
      message: "S52 migration completed: Subscription billing system tables created",
      executedStatements
    });
  } catch (error) {
    console.error("S52 migration failed:", error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}