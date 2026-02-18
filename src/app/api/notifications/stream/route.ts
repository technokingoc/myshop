import { NextRequest } from "next/server";
import { subscribeEvents } from "@/lib/events";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sellerId = Number(req.nextUrl.searchParams.get("sellerId") || 0);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));

      send(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

      const unsub = subscribeEvents((evt) => {
        if (!sellerId || evt.sellerId !== sellerId) return;
        send(`event: notification\ndata: ${JSON.stringify(evt)}\n\n`);
      });

      const ping = setInterval(() => send(`event: ping\ndata: ${Date.now()}\n\n`), 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        unsub();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
