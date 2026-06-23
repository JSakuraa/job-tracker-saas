import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchCompanies } from '@/lib/services/companies';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: "Query parameter 'q' is required" } },
        { status: 400 }
      );
    }

    const data = await searchCompanies(session.user.id, q);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error searching companies:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to search companies' } },
      { status: 500 }
    );
  }
}
