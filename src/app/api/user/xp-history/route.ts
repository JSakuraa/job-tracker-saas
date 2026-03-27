// T104: GET /api/user/xp-history - Get user's XP event history

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getXpHistory } from '@/lib/xp/service';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const events = await getXpHistory(session.user.id, limit, offset);

    return NextResponse.json({
      data: events,
      meta: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching XP history:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch XP history' } },
      { status: 500 }
    );
  }
}
