import { NextRequest, NextResponse } from "next/server";
import { clearUnifiedSessionCookie } from "@/lib/unified-session";

export async function POST(req: NextRequest) {
  try {
    await clearUnifiedSessionCookie();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}