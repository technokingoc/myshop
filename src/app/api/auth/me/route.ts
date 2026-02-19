import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getUnifiedSession } from "@/lib/unified-session";

export async function GET() {
  // Try legacy session first
  const legacySession = await getSessionFromCookie();
  if (legacySession) {
    return NextResponse.json({ session: legacySession });
  }

  // Fall back to unified session
  const unified = await getUnifiedSession();
  if (unified && unified.hasStore && unified.storeId && unified.storeSlug) {
    // Translate unified → legacy AuthSession format for dashboard compatibility
    return NextResponse.json({
      session: {
        sellerId: unified.storeId,
        email: unified.email,
        sellerSlug: unified.storeSlug,
        storeName: unified.storeName || "My Store",
        role: unified.role || "seller",
      },
    });
  }

  return NextResponse.json({ session: null }, { status: 401 });
}
