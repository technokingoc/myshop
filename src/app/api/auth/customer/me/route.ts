import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";

export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    
    if (!session) {
      return NextResponse.json({ session: null });
    }
    
    return NextResponse.json({
      session: {
        customerId: session.customerId,
        name: session.name,
        email: session.email
      }
    });
    
  } catch (error) {
    console.error('Customer session error:', error);
    return NextResponse.json(
      { error: "Failed to get customer session" },
      { status: 500 }
    );
  }
}