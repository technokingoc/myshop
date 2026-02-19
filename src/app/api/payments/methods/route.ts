import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { paymentMethods } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Get all payment methods for the seller
    const methods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.sellerId, session.sellerId));

    // Format response to hide sensitive data
    const formattedMethods = methods.map(method => ({
      id: method.id,
      method: method.method,
      enabled: method.enabled,
      displayName: method.displayName,
      instructions: method.instructions,
      
      // Bank transfer fields (safe to expose)
      bankName: method.bankName,
      bankAccount: method.method === "bank_transfer" ? method.bankAccount : "***",
      bankAccountName: method.bankAccountName,
      bankBranch: method.bankBranch,
      bankSwiftCode: method.bankSwiftCode,
      bankInstructions: method.bankInstructions,
      
      // M-Pesa fields (hide sensitive data)
      mpesaBusinessNumber: method.mpesaBusinessNumber,
      mpesaBusinessName: method.mpesaBusinessName,
      mpesaEnvironment: method.mpesaEnvironment,
      mpesaConfigured: !!(method.mpesaApiKey && method.mpesaApiSecret),
      
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
    }));

    return NextResponse.json({ methods: formattedMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { method, enabled, ...config } = body;

    if (!method || !["mpesa", "bank_transfer"].includes(method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if method already exists for this seller
    const existing = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.sellerId, session.sellerId),
          eq(paymentMethods.method, method)
        )
      )
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing method
      [result] = await db
        .update(paymentMethods)
        .set({
          enabled: enabled ?? true,
          displayName: config.displayName || "",
          instructions: config.instructions || "",
          
          // Bank transfer fields
          ...(method === "bank_transfer" && {
            bankName: config.bankName || "",
            bankAccount: config.bankAccount || "",
            bankAccountName: config.bankAccountName || "",
            bankBranch: config.bankBranch || "",
            bankSwiftCode: config.bankSwiftCode || "",
            bankInstructions: config.bankInstructions || "",
          }),
          
          // M-Pesa fields
          ...(method === "mpesa" && {
            mpesaBusinessNumber: config.mpesaBusinessNumber || "",
            mpesaBusinessName: config.mpesaBusinessName || "",
            mpesaEnvironment: config.mpesaEnvironment || "sandbox",
            // Only update API credentials if provided
            ...(config.mpesaApiKey && { mpesaApiKey: config.mpesaApiKey }),
            ...(config.mpesaApiSecret && { mpesaApiSecret: config.mpesaApiSecret }),
          }),
          
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, existing[0].id))
        .returning();
    } else {
      // Create new method
      [result] = await db
        .insert(paymentMethods)
        .values({
          sellerId: session.sellerId,
          method,
          enabled: enabled ?? true,
          displayName: config.displayName || "",
          instructions: config.instructions || "",
          
          // Bank transfer fields
          bankName: config.bankName || "",
          bankAccount: config.bankAccount || "",
          bankAccountName: config.bankAccountName || "",
          bankBranch: config.bankBranch || "",
          bankSwiftCode: config.bankSwiftCode || "",
          bankInstructions: config.bankInstructions || "",
          
          // M-Pesa fields
          mpesaBusinessNumber: config.mpesaBusinessNumber || "",
          mpesaBusinessName: config.mpesaBusinessName || "",
          mpesaApiKey: config.mpesaApiKey || "",
          mpesaApiSecret: config.mpesaApiSecret || "",
          mpesaEnvironment: config.mpesaEnvironment || "sandbox",
        })
        .returning();
    }

    // Return formatted response (hide sensitive data)
    const formattedResult = {
      id: result.id,
      method: result.method,
      enabled: result.enabled,
      displayName: result.displayName,
      instructions: result.instructions,
      
      // Bank transfer fields
      bankName: result.bankName,
      bankAccount: result.method === "bank_transfer" ? result.bankAccount : "***",
      bankAccountName: result.bankAccountName,
      bankBranch: result.bankBranch,
      bankSwiftCode: result.bankSwiftCode,
      bankInstructions: result.bankInstructions,
      
      // M-Pesa fields
      mpesaBusinessNumber: result.mpesaBusinessNumber,
      mpesaBusinessName: result.mpesaBusinessName,
      mpesaEnvironment: result.mpesaEnvironment,
      mpesaConfigured: !!(result.mpesaApiKey && result.mpesaApiSecret),
      
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return NextResponse.json({
      success: true,
      method: formattedResult,
    });
  } catch (error) {
    console.error("Error saving payment method:", error);
    return NextResponse.json(
      { error: "Failed to save payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get("id");

    if (!methodId) {
      return NextResponse.json(
        { error: "Method ID is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify the method belongs to the current seller
    const method = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, parseInt(methodId)))
      .limit(1);

    if (method.length === 0) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (method[0].sellerId !== session.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the method
    await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, parseInt(methodId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}