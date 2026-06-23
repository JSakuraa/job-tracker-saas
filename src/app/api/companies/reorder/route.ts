import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { bulkReorderCompanies } from '@/lib/services/companies';
import { z } from 'zod';

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

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
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const success = await bulkReorderCompanies(session.user.id, parsed.data.orderedIds);
    if (!success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'One or more IDs do not belong to your companies' } },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error reordering companies:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder companies' } },
      { status: 500 }
    );
  }
}
