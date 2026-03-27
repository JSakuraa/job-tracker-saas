// T117: GET /api/quests - List all quests

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuests } from '@/lib/services/quests';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const questList = await getQuests(session.user.id);

    return NextResponse.json({
      data: questList,
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch quests' } },
      { status: 500 }
    );
  }
}
