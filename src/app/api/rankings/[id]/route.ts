// T147: PATCH /api/rankings/[id] - Update a ranking
// T148: DELETE /api/rankings/[id] - Delete a ranking

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRankingById, updateRanking, deleteRanking } from '@/lib/services/rankings';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateRankingSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  notes: z.string().max(1000).nullish(),
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
    const ranking = await getRankingById(id, session.user.id);

    if (!ranking) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Ranking not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: ranking });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ranking' } },
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
    const parsed = updateRankingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateRanking(id, session.user.id, parsed.data);

    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Ranking not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating ranking:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update ranking' } },
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
    const deleted = await deleteRanking(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Ranking not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting ranking:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete ranking' } },
      { status: 500 }
    );
  }
}
