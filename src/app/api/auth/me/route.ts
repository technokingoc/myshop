import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  return NextResponse.json({ session });
}
