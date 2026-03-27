// T070: GET /api/applications/[id]/history - Get status change history

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStatusHistory } from '@/lib/services/statusChanges';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const history = await getStatusHistory(id, session.user.id);

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('Error fetching status history:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch status history' } },
      { status: 500 }
    );
  }
}
