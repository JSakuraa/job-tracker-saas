// T118: GET /api/quests/active - List active quests

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveQuests } from '@/lib/services/quests';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const questList = await getActiveQuests(session.user.id);

    return NextResponse.json({
      data: questList,
    });
  } catch (error) {
    console.error('Error fetching active quests:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch active quests' } },
      { status: 500 }
    );
  }
}
