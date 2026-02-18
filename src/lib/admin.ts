import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin() {
  const session = await getSessionFromCookie();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }

  // Verify role from DB (don't trust cookie alone)
  const db = getDb();
  const result = await db.select({ role: sellers.role }).from(sellers).where(eq(sellers.id, session.sellerId)).limit(1);
  
  if (result.length === 0 || result[0].role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
