import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

const requiredTables = ["sellers", "catalog_items", "orders"] as const;

export type DbReadiness = {
  ok: boolean;
  connected: boolean;
  requiredTables: readonly string[];
  missingTables: string[];
  errorCode?: "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY";
  message?: string;
};

export async function checkDbReadiness(): Promise<DbReadiness> {
  try {
    const db = getDb();
    const rows = await db.execute<{ table_name: string }>(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
    `);

    const available = new Set((rows.rows ?? []).map((r) => r.table_name));
    const missingTables = requiredTables.filter((table) => !available.has(table));

    if (missingTables.length > 0) {
      return {
        ok: false,
        connected: true,
        requiredTables,
        missingTables,
        errorCode: "DB_TABLES_NOT_READY",
        message: "Database connected but required tables are missing",
      };
    }

    return { ok: true, connected: true, requiredTables, missingTables: [] };
  } catch {
    return {
      ok: false,
      connected: false,
      requiredTables,
      missingTables: [...requiredTables],
      errorCode: "DB_UNAVAILABLE",
      message: "Unable to connect to the database",
    };
  }
}

export function isMissingTableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("does not exist") || message.includes("relation") || message.includes("undefined table");
}
