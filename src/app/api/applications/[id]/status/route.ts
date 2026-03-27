// T069: PATCH /api/applications/[id]/status - Update application status

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateApplicationStatus } from '@/lib/services/statusChanges';
import { updateStatusSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status',
            details: result.error.errors.map((e) => ({
              field: e.path.join('.'),
              issue: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const { status } = result.data;
    const updateResult = await updateApplicationStatus(id, session.user.id, status);

    if (!updateResult) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found or status unchanged' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: updateResult.statusChange.id,
        previousStatus: updateResult.statusChange.previousStatus,
        newStatus: updateResult.statusChange.newStatus,
        changedAt: updateResult.statusChange.changedAt,
      },
      xpAwarded: updateResult.xpAwarded,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } },
      { status: 500 }
    );
  }
}
