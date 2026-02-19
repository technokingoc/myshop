import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { paymentInstructions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const sellerId = Number(req.nextUrl.searchParams.get("sellerId") || 0);
    const method = req.nextUrl.searchParams.get("method");

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    const conditions = [eq(paymentInstructions.sellerId, sellerId)];
    if (method) {
      conditions.push(eq(paymentInstructions.method, method));
    }
    
    const query = db.select()
      .from(paymentInstructions)
      .where(and(...conditions));

    const instructions = await query.orderBy(paymentInstructions.sortOrder);

    return NextResponse.json({
      instructions: instructions.map(instruction => ({
        id: instruction.id,
        method: instruction.method,
        bankName: instruction.bankName,
        accountNumber: instruction.accountNumber,
        accountName: instruction.accountName,
        swiftCode: instruction.swiftCode,
        iban: instruction.iban,
        mobileNumber: instruction.mobileNumber,
        networkProvider: instruction.networkProvider,
        instructionsEn: instruction.instructionsEn,
        instructionsPt: instruction.instructionsPt,
        active: instruction.active,
        sortOrder: instruction.sortOrder,
        createdAt: instruction.createdAt,
        updatedAt: instruction.updatedAt
      }))
    });

  } catch (error) {
    console.error('Payment instructions GET error:', error);
    return NextResponse.json(
      { error: "Failed to fetch payment instructions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sellerId,
      method,
      bankName,
      accountNumber,
      accountName,
      swiftCode,
      iban,
      mobileNumber,
      networkProvider,
      instructionsEn,
      instructionsPt,
      active = true,
      sortOrder = 0
    } = body;

    if (!sellerId || !method) {
      return NextResponse.json(
        { error: "sellerId and method are required" },
        { status: 400 }
      );
    }

    if (!['bank_transfer', 'mpesa', 'mobile_money'].includes(method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if instructions already exist for this seller and method
    const existing = await db.select()
      .from(paymentInstructions)
      .where(
        and(
          eq(paymentInstructions.sellerId, sellerId),
          eq(paymentInstructions.method, method)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing instructions
      const [updated] = await db.update(paymentInstructions)
        .set({
          bankName: bankName || '',
          accountNumber: accountNumber || '',
          accountName: accountName || '',
          swiftCode: swiftCode || '',
          iban: iban || '',
          mobileNumber: mobileNumber || '',
          networkProvider: networkProvider || '',
          instructionsEn: instructionsEn || '',
          instructionsPt: instructionsPt || '',
          active,
          sortOrder,
          updatedAt: new Date()
        })
        .where(eq(paymentInstructions.id, existing[0].id))
        .returning();

      return NextResponse.json({
        success: true,
        instruction: {
          id: updated.id,
          method: updated.method,
          active: updated.active,
          updatedAt: updated.updatedAt
        }
      });
    } else {
      // Create new instructions
      const [created] = await db.insert(paymentInstructions).values({
        sellerId,
        method,
        bankName: bankName || '',
        accountNumber: accountNumber || '',
        accountName: accountName || '',
        swiftCode: swiftCode || '',
        iban: iban || '',
        mobileNumber: mobileNumber || '',
        networkProvider: networkProvider || '',
        instructionsEn: instructionsEn || '',
        instructionsPt: instructionsPt || '',
        active,
        sortOrder
      }).returning();

      return NextResponse.json({
        success: true,
        instruction: {
          id: created.id,
          method: created.method,
          active: created.active,
          createdAt: created.createdAt
        }
      });
    }

  } catch (error) {
    console.error('Payment instructions POST error:', error);
    return NextResponse.json(
      { error: "Failed to save payment instructions" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const [updated] = await db.update(paymentInstructions)
      .set({
        active: active ?? true,
        updatedAt: new Date()
      })
      .where(eq(paymentInstructions.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      instruction: {
        id: updated.id,
        active: updated.active,
        updatedAt: updated.updatedAt
      }
    });

  } catch (error) {
    console.error('Payment instructions PUT error:', error);
    return NextResponse.json(
      { error: "Failed to update payment instructions" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id") || 0);

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    await db.delete(paymentInstructions)
      .where(eq(paymentInstructions.id, id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Payment instructions DELETE error:', error);
    return NextResponse.json(
      { error: "Failed to delete payment instructions" },
      { status: 500 }
    );
  }
}