// T160: GET /api/rewards/unlocked - Get user's unlocked rewards

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUnlockedRewards } from '@/lib/services/rewards';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const rewards = await getUnlockedRewards(session.user.id);

    return NextResponse.json({ data: rewards });
  } catch (error) {
    console.error('Error fetching unlocked rewards:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch unlocked rewards' } },
      { status: 500 }
    );
  }
}
