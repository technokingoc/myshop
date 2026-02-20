import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { stores } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSessionFromCookie as getSession } from '@/lib/session';
import { isValidLocale } from '@/lib/i18n';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const store = await db
      .select({ language: stores.language })
      .from(stores)
      .where(eq(stores.userId, session.userId))
      .limit(1);

    if (!store.length) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      language: store[0].language || 'en' 
    });
  } catch (error) {
    console.error('Failed to get store language:', error);
    return NextResponse.json({ 
      error: 'Failed to get store language' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language } = await request.json();
    
    if (!language || !isValidLocale(language)) {
      return NextResponse.json({ 
        error: 'Invalid language. Supported: en, pt' 
      }, { status: 400 });
    }

    const db = getDb();
    
    // Update store language
    await db
      .update(stores)
      .set({ 
        language,
        updatedAt: new Date()
      })
      .where(eq(stores.userId, session.userId));

    return NextResponse.json({ 
      success: true,
      language 
    });
  } catch (error) {
    console.error('Failed to update store language:', error);
    return NextResponse.json({ 
      error: 'Failed to update store language' 
    }, { status: 500 });
  }
}