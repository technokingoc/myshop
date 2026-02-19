import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { payments, settlements } from "@/lib/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const sellerId = Number(req.nextUrl.searchParams.get("sellerId") || 0);
    const period = req.nextUrl.searchParams.get("period") || '30d';

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Calculate period dates
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // Get settlements
    const settlementsList = await db.select()
      .from(settlements)
      .where(
        and(
          eq(settlements.sellerId, sellerId),
          period !== 'all' ? gte(settlements.createdAt, startDate) : undefined
        )
      )
      .orderBy(desc(settlements.createdAt));

    // Get summary data from payments
    const paymentSummaryQuery = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' THEN CAST(${payments.amount} AS DECIMAL) ELSE 0 END), 0)`,
      totalFees: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' THEN CAST(${payments.fees} AS DECIMAL) ELSE 0 END), 0)`,
      netRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' THEN CAST(${payments.netAmount} AS DECIMAL) ELSE 0 END), 0)`
    })
      .from(payments)
      .where(
        and(
          eq(payments.sellerId, sellerId),
          period !== 'all' ? gte(payments.createdAt, startDate) : undefined
        )
      );

    const summary = paymentSummaryQuery[0] || { totalRevenue: 0, totalFees: 0, netRevenue: 0 };

    // Count pending and completed settlements
    const pendingSettlements = settlementsList.filter(s => s.status === 'pending').length;
    const completedSettlements = settlementsList.filter(s => s.status === 'completed').length;

    // Get last settlement date
    const lastSettlement = settlementsList.length > 0 ? settlementsList[0].createdAt : undefined;

    return NextResponse.json({
      settlements: settlementsList.map(settlement => ({
        id: settlement.id,
        sellerId: settlement.sellerId,
        periodStart: settlement.periodStart,
        periodEnd: settlement.periodEnd,
        grossAmount: parseFloat(settlement.grossAmount),
        platformFees: parseFloat(settlement.platformFees || "0"),
        paymentFees: parseFloat(settlement.paymentFees || "0"),
        netAmount: parseFloat(settlement.netAmount),
        paymentMethod: settlement.paymentMethod,
        paymentReference: settlement.paymentReference,
        status: settlement.status,
        paymentIds: settlement.paymentIds,
        processedAt: settlement.processedAt,
        paidAt: settlement.paidAt,
        createdAt: settlement.createdAt,
        metadata: settlement.metadata
      })),
      summary: {
        totalRevenue: summary.totalRevenue,
        totalFees: summary.totalFees,
        netRevenue: summary.netRevenue,
        pendingSettlements,
        completedSettlements,
        lastSettlement
      }
    });

  } catch (error) {
    console.error('Settlements API error:', error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sellerId, action, period = '30d' } = body;

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId required" },
        { status: 400 }
      );
    }

    const db = getDb();

    switch (action) {
      case 'create':
        return await createSettlement(db, sellerId, period);
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Settlements POST error:', error);
    return NextResponse.json(
      { error: "Failed to process settlement request" },
      { status: 500 }
    );
  }
}

async function createSettlement(db: any, sellerId: number, period: string) {
  // Calculate settlement period
  const now = new Date();
  let periodStart = new Date();
  let periodEnd = new Date();
  
  switch (period) {
    case '7d':
      periodStart.setDate(now.getDate() - 7);
      break;
    case '30d':
      periodStart.setDate(now.getDate() - 30);
      break;
    case 'all':
      periodStart = new Date(2020, 0, 1); // Start from 2020
      break;
  }
  
  // Get completed payments that haven't been settled
  const completedPayments = await db.select()
    .from(payments)
    .where(
      and(
        eq(payments.sellerId, sellerId),
        eq(payments.status, 'completed'),
        eq(payments.settled, false),
        gte(payments.completedAt, periodStart),
        lte(payments.completedAt, periodEnd)
      )
    );

  if (completedPayments.length === 0) {
    return NextResponse.json(
      { error: "No unsettled payments found for the selected period" },
      { status: 400 }
    );
  }

  // Calculate settlement amounts
  const grossAmount = completedPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);
  const paymentFees = completedPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.fees || "0"), 0);
  
  // Calculate platform fees (e.g., 2.5% of gross amount)
  const platformFeeRate = 0.025;
  const platformFees = grossAmount * platformFeeRate;
  
  const netAmount = grossAmount - platformFees - paymentFees;

  // Create settlement record
  const [settlement] = await db.insert(settlements).values({
    sellerId,
    periodStart,
    periodEnd,
    grossAmount: grossAmount.toString(),
    platformFees: platformFees.toString(),
    paymentFees: paymentFees.toString(),
    netAmount: netAmount.toString(),
    status: 'pending',
    paymentIds: completedPayments.map((p: any) => p.id).join(','),
    metadata: {
      paymentBreakdown: completedPayments.map((payment: any) => ({
        paymentId: payment.id,
        amount: parseFloat(payment.amount),
        fees: parseFloat(payment.fees)
      }))
    }
  }).returning();

  // Mark payments as settled
  const paymentIds = completedPayments.map((p: any) => p.id);
  await db.update(payments)
    .set({
      settled: true,
      settledAt: new Date(),
      updatedAt: new Date()
    })
    .where(sql`${payments.id} = ANY(${paymentIds})`);

  return NextResponse.json({
    success: true,
    settlement: {
      id: settlement.id,
      grossAmount: parseFloat(settlement.grossAmount),
      platformFees: parseFloat(settlement.platformFees),
      paymentFees: parseFloat(settlement.paymentFees),
      netAmount: parseFloat(settlement.netAmount),
      status: settlement.status,
      paymentsCount: completedPayments.length
    }
  });
}