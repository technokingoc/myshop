import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { payments, orders } from "@/lib/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const sellerId = Number(req.nextUrl.searchParams.get("sellerId") || 0);
    const orderId = Number(req.nextUrl.searchParams.get("orderId") || 0);
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");
    const limit = Number(req.nextUrl.searchParams.get("limit") || 50);
    const offset = Number(req.nextUrl.searchParams.get("offset") || 0);

    if (!sellerId && !orderId) {
      return NextResponse.json(
        { error: "sellerId or orderId required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Build all conditions first
    const conditions = [];
    
    if (sellerId) {
      conditions.push(eq(payments.sellerId, sellerId));
    }
    
    if (orderId) {
      conditions.push(eq(payments.orderId, orderId));
    }
    
    if (status) {
      conditions.push(eq(payments.status, status));
    }
    
    if (search) {
      conditions.push(
        or(
          like(payments.payerName, `%${search}%`),
          like(payments.payerEmail, `%${search}%`),
          like(payments.payerPhone, `%${search}%`),
          like(payments.externalId, `%${search}%`),
          like(payments.confirmationCode, `%${search}%`),
          sql`CAST(${payments.orderId} AS TEXT) LIKE ${`%${search}%`}`
        )
      );
    }
    
    // Build the query with all conditions
    const query = db.select({
      id: payments.id,
      orderId: payments.orderId,
      sellerId: payments.sellerId,
      customerId: payments.customerId,
      method: payments.method,
      provider: payments.provider,
      status: payments.status,
      amount: payments.amount,
      fees: payments.fees,
      netAmount: payments.netAmount,
      currency: payments.currency,
      externalId: payments.externalId,
      externalReference: payments.externalReference,
      confirmationCode: payments.confirmationCode,
      payerPhone: payments.payerPhone,
      payerName: payments.payerName,
      payerEmail: payments.payerEmail,
      settled: payments.settled,
      settledAt: payments.settledAt,
      initiatedAt: payments.initiatedAt,
      processedAt: payments.processedAt,
      completedAt: payments.completedAt,
      failedAt: payments.failedAt,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      metadata: payments.metadata
    })
    .from(payments)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset);

    const result = await query;

    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const [{ count: total }] = await countQuery;

    // Format the results
    const formattedPayments = result.map(payment => ({
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      method: payment.method,
      provider: payment.provider,
      amount: parseFloat(payment.amount),
      fees: parseFloat(payment.fees || "0"),
      netAmount: parseFloat(payment.netAmount),
      currency: payment.currency,
      externalId: payment.externalId,
      externalReference: payment.externalReference,
      confirmationCode: payment.confirmationCode,
      customerName: payment.payerName,
      customerPhone: payment.payerPhone,
      customerEmail: payment.payerEmail,
      settled: payment.settled,
      settledAt: payment.settledAt,
      initiatedAt: payment.initiatedAt,
      processedAt: payment.processedAt,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      metadata: payment.metadata
    }));

    return NextResponse.json({
      payments: formattedPayments,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch payments",
        payments: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // This endpoint could be used for bulk operations or advanced queries
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'markSettled':
        return await markPaymentsAsSettled(body);
      case 'exportCSV':
        return await exportPaymentsCSV(body);
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function markPaymentsAsSettled(body: any) {
  const { paymentIds, settlementAmount } = body;
  
  if (!paymentIds || !Array.isArray(paymentIds)) {
    return NextResponse.json(
      { error: "paymentIds array required" },
      { status: 400 }
    );
  }

  const db = getDb();
  
  // Update payments as settled
  await db.update(payments)
    .set({
      settled: true,
      settledAt: new Date(),
      updatedAt: new Date()
    })
    .where(sql`${payments.id} = ANY(${paymentIds})`);

  return NextResponse.json({ success: true });
}

async function exportPaymentsCSV(body: any) {
  const { sellerId, startDate, endDate } = body;
  
  const db = getDb();
  const conditions = [eq(payments.sellerId, sellerId)];
  
  if (startDate) {
    conditions.push(sql`${payments.createdAt} >= ${startDate}`);
  }
  
  if (endDate) {
    conditions.push(sql`${payments.createdAt} <= ${endDate}`);
  }

  const result = await db.select()
    .from(payments)
    .where(and(...conditions))
    .orderBy(desc(payments.createdAt));

  // Convert to CSV format
  const headers = [
    'Payment ID',
    'Order ID', 
    'Method',
    'Status',
    'Amount',
    'Currency',
    'Fees',
    'Net Amount',
    'Customer Name',
    'Customer Phone',
    'External ID',
    'Confirmation Code',
    'Created At',
    'Completed At'
  ];

  const rows = result.map(payment => [
    payment.id,
    payment.orderId,
    payment.method,
    payment.status,
    payment.amount,
    payment.currency,
    payment.fees,
    payment.netAmount,
    payment.payerName || '',
    payment.payerPhone || '',
    payment.externalId || '',
    payment.confirmationCode || '',
    payment.createdAt,
    payment.completedAt || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payments-${Date.now()}.csv"`
    }
  });
}