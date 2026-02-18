import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus, upsertPaymentStatus } from "@/lib/dev-store";
import { emitEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  const orderId = Number(req.nextUrl.searchParams.get("orderId") || 0);
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  const row = await getPaymentStatus(orderId);
  return NextResponse.json(row || { status: "pending" });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const orderId = Number(body.orderId || 0);
  const sellerId = Number(body.sellerId || 0);
  const status = body.status as "pending" | "paid" | "failed" | "manual";
  const externalUrl = body.externalUrl as string | undefined;

  if (!orderId || !status) return NextResponse.json({ error: "orderId and status required" }, { status: 400 });

  const next = await upsertPaymentStatus(orderId, status, externalUrl);
  if (sellerId) {
    emitEvent({
      type: "payment:status",
      sellerId,
      message: `Payment status updated to ${status} for order #${orderId}`,
      payload: { orderId, status },
    });
  }

  return NextResponse.json(next);
}
