import { NextResponse } from "next/server";
import { checkDbReadiness } from "@/lib/db-readiness";

export async function GET() {
  const readiness = await checkDbReadiness();
  const tableChecks = readiness.requiredTables.map((name) => ({
    table: name,
    ready: !readiness.missingTables.includes(name),
  }));

  const suggestion = !readiness.connected
    ? "Check DATABASE_URL and Neon connectivity, then retry."
    : readiness.missingTables.length > 0
      ? `Run migration for missing tables: ${readiness.missingTables.join(", ")}`
      : "Database healthy.";

  return NextResponse.json(
    {
      ...readiness,
      migrationRequired: !readiness.ok,
      tableChecks,
      suggestion,
      checkedAt: new Date().toISOString(),
    },
    { status: readiness.ok ? 200 : 503 },
  );
}
