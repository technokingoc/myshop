import { NextResponse } from "next/server";
import { checkDbReadiness } from "@/lib/db-readiness";

export async function GET() {
  const readiness = await checkDbReadiness();
  const tableChecks = readiness.requiredTables.map((name) => ({
    table: name,
    ready: !readiness.missingTables.includes(name),
  }));

  return NextResponse.json(
    {
      ...readiness,
      migrationRequired: !readiness.ok,
      tableChecks,
      checkedAt: new Date().toISOString(),
    },
    { status: readiness.ok ? 200 : 503 },
  );
}
