import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { socialShares } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { platform, url, title, timestamp, userAgent, referrer } = await request.json();

    // Extract store/product info from URL
    let storeId = null;
    let productId = null;
    
    // Parse URL to determine if it's a product or store share
    const urlPath = url.replace(/^https?:\/\/[^\/]+/, '');
    const storeMatch = urlPath.match(/^\/s\/([^\/]+)/);
    const productMatch = urlPath.match(/^\/s\/[^\/]+\/product\/(\d+)/);
    
    if (productMatch) {
      productId = parseInt(productMatch[1]);
    }
    
    // For now, use a placeholder store ID - in real implementation, 
    // you'd extract this from the session or URL
    storeId = 1;

    // Generate a simple visitor ID based on IP and user agent
    const visitorId = `${request.ip || 'unknown'}_${Date.now()}`;

    await db.insert(socialShares).values({
      storeId,
      productId,
      platform,
      sharedUrl: url,
      shareTitle: title,
      visitorId,
      ipAddress: request.ip || null,
      userAgent,
      referrer,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Social share tracking error:', error);
    return NextResponse.json({ error: 'Failed to track share' }, { status: 500 });
  }
}