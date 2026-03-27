// T093: DELETE /api/applications/[id]/resumes/[resumeId] - Detach resume from application

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getApplicationById } from '@/lib/services/applications';
import { detachResumeFromApplication } from '@/lib/services/resumes';

interface RouteParams {
  params: Promise<{ id: string; resumeId: string }>;
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

    const { id, resumeId } = await params;

    // Verify the application belongs to the user
    const application = await getApplicationById(id, session.user.id);
    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const detached = await detachResumeFromApplication(id, resumeId);

    if (!detached) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resume attachment not found' } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error detaching resume:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to detach resume' } },
      { status: 500 }
    );
  }
}
