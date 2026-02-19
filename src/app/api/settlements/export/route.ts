import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settlements } from "@/lib/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sellerId, period = '30d' } = body;

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

    // CSV headers
    const headers = [
      'Settlement ID',
      'Period Start',
      'Period End', 
      'Gross Amount (MZN)',
      'Platform Fees (MZN)',
      'Payment Fees (MZN)',
      'Net Amount (MZN)',
      'Status',
      'Payment Method',
      'Payment Reference',
      'Created At',
      'Processed At',
      'Paid At'
    ];

    // CSV rows
    const rows = settlementsList.map(settlement => [
      settlement.id,
      new Date(settlement.periodStart).toISOString().split('T')[0],
      new Date(settlement.periodEnd).toISOString().split('T')[0],
      parseFloat(settlement.grossAmount).toFixed(2),
      parseFloat(settlement.platformFees || "0").toFixed(2),
      parseFloat(settlement.paymentFees || "0").toFixed(2),
      parseFloat(settlement.netAmount).toFixed(2),
      settlement.status,
      settlement.paymentMethod || '',
      settlement.paymentReference || '',
      new Date(settlement.createdAt).toISOString(),
      settlement.processedAt ? new Date(settlement.processedAt).toISOString() : '',
      settlement.paidAt ? new Date(settlement.paidAt).toISOString() : ''
    ]);

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="settlements-${sellerId}-${Date.now()}.csv"`
      }
    });

  } catch (error) {
    console.error('Settlements export error:', error);
    return NextResponse.json(
      { error: "Failed to export settlements" },
      { status: 500 }
    );
  }
}