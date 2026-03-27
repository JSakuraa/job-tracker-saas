// T159: GET /api/rewards - Get all rewards with unlock status

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRewards } from '@/lib/services/rewards';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const rewards = await getRewards(session.user.id);

    return NextResponse.json({ data: rewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rewards' } },
      { status: 500 }
    );
  }
}
