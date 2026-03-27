// T120: POST /api/quests/[id]/claim - Claim quest reward

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { claimQuestReward } from '@/lib/services/quests';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await claimQuestReward(session.user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Quest not found or not completed' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        claimed: true,
        xpAwarded: result.xpAwarded,
      },
    });
  } catch (error) {
    console.error('Error claiming quest reward:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to claim quest reward' } },
      { status: 500 }
    );
  }
}
