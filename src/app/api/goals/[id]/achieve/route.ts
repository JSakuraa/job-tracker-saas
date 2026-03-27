// T134: POST /api/goals/[id]/achieve - Mark goal as achieved

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { achieveGoal } from '@/lib/services/goals';

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
    const result = await achieveGoal(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found or not active' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        achieved: true,
        xpAwarded: result.xpAwarded,
      },
    });
  } catch (error) {
    console.error('Error achieving goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to achieve goal' } },
      { status: 500 }
    );
  }
}
