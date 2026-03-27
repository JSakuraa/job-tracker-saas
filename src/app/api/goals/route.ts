// T130: GET /api/goals - List goals
// T131: POST /api/goals - Create goal

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoals, createGoal } from '@/lib/services/goals';
import { z } from 'zod';

const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  targetType: z.string().min(1).max(50),
  targetCount: z.number().int().positive(),
  deadline: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const goals = await getGoals(session.user.id);

    return NextResponse.json({
      data: goals,
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goals' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = createGoalSchema.safeParse(body);
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

    const goal = await createGoal({
      userId: session.user.id,
      title: result.data.title,
      description: result.data.description ?? null,
      targetType: result.data.targetType,
      targetCount: result.data.targetCount,
      deadline: result.data.deadline ? new Date(result.data.deadline) : null,
    });

    return NextResponse.json(
      { data: goal },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create goal' } },
      { status: 500 }
    );
  }
}
