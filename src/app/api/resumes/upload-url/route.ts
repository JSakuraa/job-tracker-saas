// T086: POST /api/resumes/upload-url - Get presigned upload URL

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getResumeUploadUrl } from '@/lib/services/resumes';
import { z } from 'zod';

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  fileSize: z.number().positive(),
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

    const result = uploadUrlSchema.safeParse(body);
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

    const { filename, mimeType, fileSize } = result.data;

    const uploadResult = await getResumeUploadUrl(
      session.user.id,
      filename,
      mimeType,
      fileSize
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: uploadResult.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        uploadUrl: uploadResult.uploadUrl,
        blobKey: uploadResult.blobKey,
      },
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 }
    );
  }
}
