// T149: PATCH /api/rankings/reorder - Reorder rankings

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { bulkReorderRankings, reorderRanking } from '@/lib/services/rankings';
import { z } from 'zod';

// Bulk reorder with ordered IDs
const bulkReorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

// Single item reorder
const singleReorderSchema = z.object({
  rankingId: z.string().uuid(),
  newRank: z.number().int().positive(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Try bulk reorder first
    const bulkParsed = bulkReorderSchema.safeParse(body);
    if (bulkParsed.success) {
      const success = await bulkReorderRankings(session.user.id, bulkParsed.data.orderedIds);

      if (!success) {
        return NextResponse.json(
          { error: { code: 'INVALID_IDS', message: 'One or more ranking IDs are invalid' } },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: { reordered: true } });
    }

    // Try single reorder
    const singleParsed = singleReorderSchema.safeParse(body);
    if (singleParsed.success) {
      const success = await reorderRanking(
        singleParsed.data.rankingId,
        session.user.id,
        singleParsed.data.newRank
      );

      if (!success) {
        return NextResponse.json(
          { error: { code: 'INVALID_REORDER', message: 'Failed to reorder ranking' } },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: { reordered: true } });
    }

    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input. Provide either orderedIds array or rankingId with newRank.',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error reordering rankings:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder rankings' } },
      { status: 500 }
    );
  }
}
