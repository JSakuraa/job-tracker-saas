// T135: POST /api/goals/[id]/abandon - Abandon goal

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { abandonGoal } from '@/lib/services/goals';

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
    const success = await abandonGoal(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found or not active' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { abandoned: true },
    });
  } catch (error) {
    console.error('Error abandoning goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to abandon goal' } },
      { status: 500 }
    );
  }
}
