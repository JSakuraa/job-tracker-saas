// T089: GET /api/resumes/[id] - Get resume details
// T091: DELETE /api/resumes/[id] - Delete resume

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getResumeById, deleteResume } from '@/lib/services/resumes';

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
    const resume = await getResumeById(id, session.user.id);

    if (!resume) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resume not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: resume });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch resume' } },
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
    const deleted = await deleteResume(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resume not found' } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete resume' } },
      { status: 500 }
    );
  }
}
