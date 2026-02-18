import { NextRequest, NextResponse } from "next/server";
import { upsertPaymentStatus } from "@/lib/dev-store";
import { emitEvent } from "@/lib/events";

// Mock webhook endpoint (dev-safe): accepts signed provider callbacks later.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const orderId = Number(body.orderId || 0);
  const sellerId = Number(body.sellerId || 0);
  const status = body.status as "pending" | "paid" | "failed" | "manual";

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
  }

  const row = await upsertPaymentStatus(orderId, status, body.externalUrl);
  if (sellerId) {
    emitEvent({
      type: "payment:status",
      sellerId,
      message: `Webhook received: payment ${status} for order #${orderId}`,
      payload: body,
    });
  }

  return NextResponse.json({ ok: true, payment: row });
}
