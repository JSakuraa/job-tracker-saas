// T162: POST /api/rewards/[id]/unequip - Unequip a reward

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unequipReward } from '@/lib/services/rewards';

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
    const result = await unequipReward(session.user.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'UNEQUIP_FAILED', message: result.error ?? 'Failed to unequip reward' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { unequipped: true } });
  } catch (error) {
    console.error('Error unequipping reward:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to unequip reward' } },
      { status: 500 }
    );
  }
}
