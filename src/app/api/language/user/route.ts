import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/schema';
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
    const user = await db
      .select({ language: users.language })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      language: user[0].language || 'en' 
    });
  } catch (error) {
    console.error('Failed to get user language:', error);
    return NextResponse.json({ 
      error: 'Failed to get user language' 
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
    
    // Allow null to reset to default
    if (language !== null && (!language || !isValidLocale(language))) {
      return NextResponse.json({ 
        error: 'Invalid language. Supported: en, pt, or null for default' 
      }, { status: 400 });
    }

    const db = getDb();
    
    // Update user language preference
    await db
      .update(users)
      .set({ 
        language: language || 'en',
        updatedAt: new Date()
      })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ 
      success: true,
      language: language || 'en'
    });
  } catch (error) {
    console.error('Failed to update user language:', error);
    return NextResponse.json({ 
      error: 'Failed to update user language' 
    }, { status: 500 });
  }
}