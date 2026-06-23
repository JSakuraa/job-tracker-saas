import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAsConnected } from '@/lib/services/connections';
import { z } from 'zod';

const statusSchema = z.object({
  relationshipType: z.literal('established_connection'),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Only "established_connection" is accepted' } },
        { status: 400 }
      );
    }

    const { id } = await params;
    const updated = await markAsConnected(id, session.user.id);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Connection not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        relationshipType: updated.relationshipType,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating connection status:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update connection status' } },
      { status: 500 }
    );
  }
}
