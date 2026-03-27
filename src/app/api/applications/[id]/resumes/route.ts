// T092: POST /api/applications/[id]/resumes - Attach resume to application
// GET /api/applications/[id]/resumes - List attached resumes

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getApplicationById } from '@/lib/services/applications';
import {
  attachResumeToApplication,
  getResumesForApplication,
} from '@/lib/services/resumes';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const attachResumeSchema = z.object({
  resumeId: z.string().uuid(),
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

    // Verify the application belongs to the user
    const application = await getApplicationById(id, session.user.id);
    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const resumeList = await getResumesForApplication(id, session.user.id);

    return NextResponse.json({
      data: resumeList,
    });
  } catch (error) {
    console.error('Error fetching application resumes:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch resumes' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the application belongs to the user
    const application = await getApplicationById(id, session.user.id);
    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();

    const result = attachResumeSchema.safeParse(body);
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

    const attached = await attachResumeToApplication(
      id,
      result.data.resumeId,
      session.user.id
    );

    if (!attached) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Resume not found or already attached' } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { data: { attached: true } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error attaching resume:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to attach resume' } },
      { status: 500 }
    );
  }
}
