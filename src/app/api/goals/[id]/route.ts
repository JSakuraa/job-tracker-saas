// T132: GET /api/goals/[id] - Get goal
// T133: PATCH /api/goals/[id] - Update goal
// T136: DELETE /api/goals/[id] - Delete goal

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoalById, updateGoal, deleteGoal } from '@/lib/services/goals';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  targetCount: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional().nullable(),
});

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
    const goal = await getGoalById(id, session.user.id);

    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goal' } },
      { status: 500 }
    );
  }
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

    const result = updateGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: result.error.errors.map((e) => ({
              field: e.path.join('.'),
              issue: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const updateData: Parameters<typeof updateGoal>[2] = {};
    if (result.data.title !== undefined) {
      updateData.title = result.data.title;
    }
    if (result.data.description !== undefined) {
      updateData.description = result.data.description;
    }
    if (result.data.targetCount !== undefined) {
      updateData.targetCount = result.data.targetCount;
    }
    if (result.data.deadline !== undefined) {
      updateData.deadline = result.data.deadline ? new Date(result.data.deadline) : null;
    }

    const goal = await updateGoal(id, session.user.id, updateData);

    if (!goal) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update goal' } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await deleteGoal(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Goal not found' } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete goal' } },
      { status: 500 }
    );
  }
}
