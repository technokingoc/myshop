import { NextRequest, NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unified-session";

export async function GET(req: NextRequest) {
  try {
    const session = await getUnifiedSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        hasStore: session.hasStore,
        role: session.role,
        store: session.hasStore ? {
          id: session.storeId,
          slug: session.storeSlug,
          name: session.storeName,
        } : null,
      },
    });
  } catch (err: unknown) {
    console.error("Session fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}