// T090: GET /api/resumes/[id]/download - Get download URL

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getResumeDownloadUrl } from '@/lib/services/resumes';

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
    const downloadUrl = await getResumeDownloadUrl(id, session.user.id);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Resume not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        downloadUrl,
      },
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate download URL' } },
      { status: 500 }
    );
  }
}
