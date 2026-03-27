// T087: POST /api/resumes - Register uploaded resume
// T088: GET /api/resumes - List user's resumes

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createResume, getResumes } from '@/lib/services/resumes';
import { z } from 'zod';

const createResumeSchema = z.object({
  filename: z.string().min(1).max(255),
  blobKey: z.string().min(1).max(500),
  mimeType: z.string(),
  fileSize: z.number().positive(),
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

    const resumeList = await getResumes(session.user.id);

    return NextResponse.json({
      data: resumeList,
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch resumes' } },
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

    const result = createResumeSchema.safeParse(body);
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

    const { filename, blobKey, mimeType, fileSize } = result.data;

    const { resume, xpAwarded } = await createResume({
      userId: session.user.id,
      filename,
      blobKey,
      mimeType,
      fileSize,
    });

    return NextResponse.json(
      {
        data: resume,
        xpAwarded,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create resume' } },
      { status: 500 }
    );
  }
}
