// T145: GET /api/rankings - Get all ranked employers
// T146: POST /api/rankings - Add a new ranked employer

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRankings, createRanking, isCompanyRanked } from '@/lib/services/rankings';
import { z } from 'zod';

const createRankingSchema = z.object({
  companyName: z.string().min(1).max(255),
  notes: z.string().max(1000).nullish(),
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

    const rankings = await getRankings(session.user.id);

    return NextResponse.json({ data: rankings });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rankings' } },
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
    const parsed = createRankingSchema.safeParse(body);

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

    // Check if company is already ranked
    const alreadyRanked = await isCompanyRanked(session.user.id, parsed.data.companyName);
    if (alreadyRanked) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'This company is already in your rankings' } },
        { status: 409 }
      );
    }

    const ranking = await createRanking({
      userId: session.user.id,
      companyName: parsed.data.companyName,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ data: ranking }, { status: 201 });
  } catch (error) {
    console.error('Error creating ranking:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create ranking' } },
      { status: 500 }
    );
  }
}
