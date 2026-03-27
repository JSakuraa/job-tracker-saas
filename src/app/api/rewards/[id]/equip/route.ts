// T161: POST /api/rewards/[id]/equip - Equip a reward

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { equipReward } from '@/lib/services/rewards';

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
    const result = await equipReward(session.user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'EQUIP_FAILED', message: result.error ?? 'Failed to equip reward' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { equipped: true } });
  } catch (error) {
    console.error('Error equipping reward:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to equip reward' } },
      { status: 500 }
    );
  }
}
