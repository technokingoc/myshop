import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getRevenueSummary, getSellerPayments } from "@/lib/payment-service";
import { getDb } from "@/lib/db";
import { revenues, settlements } from "@/lib/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "summary";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const db = getDb();

    if (view === "summary") {
      // Get revenue summary
      const summary = await getRevenueSummary(session.sellerId);
      
      // Get recent confirmed payments
      const recentPayments = await getSellerPayments(session.sellerId, 10, 0);

      // Get pending settlement amount from revenues
      const pendingRevenues = await db
        .select()
        .from(revenues)
        .where(
          and(
            eq(revenues.sellerId, session.sellerId),
            eq(revenues.settlementStatus, "pending")
          )
        );

      const pendingSettlementAmount = pendingRevenues.reduce(
        (sum, r) => sum + parseFloat(r.netAmount),
        0
      );

      // Get latest settlements
      const recentSettlements = await db
        .select()
        .from(settlements)
        .where(eq(settlements.sellerId, session.sellerId))
        .orderBy(desc(settlements.createdAt))
        .limit(5);

      return NextResponse.json({
        summary: {
          ...summary,
          pendingSettlementAmount,
        },
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          orderId: p.orderId,
          method: p.method,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          externalReference: p.externalReference,
          completedAt: p.completedAt,
          createdAt: p.createdAt,
        })),
        recentSettlements: recentSettlements.map(s => ({
          id: s.id,
          grossAmount: parseFloat(s.grossAmount),
          netAmount: parseFloat(s.netAmount),
          platformFees: parseFloat(s.platformFees || "0"),
          paymentFees: parseFloat(s.paymentFees || "0"),
          status: s.status,
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
        })),
      });
    } else if (view === "revenues") {
      // Get detailed revenue records - build conditions first
      const conditions = [eq(revenues.sellerId, session.sellerId)];
      
      if (dateFrom) {
        conditions.push(gte(revenues.revenueDate, new Date(dateFrom)));
      }
      
      if (dateTo) {
        conditions.push(lte(revenues.revenueDate, new Date(dateTo)));
      }
      
      const query = db
        .select()
        .from(revenues)
        .where(and(...conditions))
        .orderBy(desc(revenues.revenueDate));

      const revenueRecords = await query.limit(50);

      return NextResponse.json({
        revenues: revenueRecords.map(r => ({
          id: r.id,
          orderId: r.orderId,
          paymentId: r.paymentId,
          grossAmount: r.grossAmount,
          platformFeeAmount: r.platformFeeAmount,
          netAmount: r.netAmount,
          currency: r.currency,
          settlementStatus: r.settlementStatus,
          settlementDate: r.settlementDate,
          revenueDate: r.revenueDate,
          createdAt: r.createdAt,
        })),
      });
    } else if (view === "settlements") {
      // Get settlement history
      const settlementRecords = await db
        .select()
        .from(settlements)
        .where(eq(settlements.sellerId, session.sellerId))
        .orderBy(desc(settlements.createdAt))
        .limit(50);

      return NextResponse.json({
        settlements: settlementRecords.map(s => ({
          id: s.id,
          grossAmount: parseFloat(s.grossAmount),
          platformFees: parseFloat(s.platformFees || "0"),
          paymentFees: parseFloat(s.paymentFees || "0"),
          netAmount: parseFloat(s.netAmount),
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
          status: s.status,
          paymentMethod: s.paymentMethod,
          paymentReference: s.paymentReference,
          paymentIds: s.paymentIds,
          processedAt: s.processedAt,
          paidAt: s.paidAt,
          notes: s.notes,
          createdAt: s.createdAt,
        })),
      });
    }

    return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}