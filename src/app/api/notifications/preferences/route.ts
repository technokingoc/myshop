import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  NotificationPreferences 
} from "@/lib/notification-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const userId = session?.sellerId;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getNotificationPreferences(Number(userId));
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const userId = session?.sellerId;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const preferences: Partial<NotificationPreferences> = body;

    // Validate the structure
    if (typeof preferences !== 'object' || preferences === null) {
      return NextResponse.json({ error: "Invalid preferences format" }, { status: 400 });
    }

    const success = await updateNotificationPreferences(Number(userId), preferences);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    const updatedPreferences = await getNotificationPreferences(Number(userId));
    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 });
  }
}