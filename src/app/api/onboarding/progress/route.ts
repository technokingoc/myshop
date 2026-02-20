import { NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unified-session";

// Simple in-memory store for onboarding progress (in production, use Redis or database)
const onboardingProgress = new Map<number, any>();

export async function GET() {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const progress = onboardingProgress.get(session.userId);
    
    return NextResponse.json({
      success: true,
      data: progress || null
    });
  } catch (error) {
    console.error("Failed to get onboarding progress:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const data = await request.json();
    
    // Save progress for this user
    onboardingProgress.set(session.userId, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Progress saved"
    });
  } catch (error) {
    console.error("Failed to save onboarding progress:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    onboardingProgress.delete(session.userId);

    return NextResponse.json({
      success: true,
      message: "Progress cleared"
    });
  } catch (error) {
    console.error("Failed to clear onboarding progress:", error);
    return NextResponse.json({ error: "Failed to clear progress" }, { status: 500 });
  }
}