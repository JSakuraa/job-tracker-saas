// T066: GET /api/applications/[id] - Get application
// T067: PATCH /api/applications/[id] - Update application
// T068: DELETE /api/applications/[id] - Delete application

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '@/lib/services/applications';
import { updateApplicationSchema } from '@/lib/validations';

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
    const application = await getApplicationById(id, session.user.id);

    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch application' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const result = updateApplicationSchema.safeParse(body);
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

    const updateData: Parameters<typeof updateApplication>[2] = {};

    if (result.data.jobTitle !== undefined) {
      updateData.jobTitle = result.data.jobTitle;
    }
    if (result.data.companyName !== undefined) {
      updateData.companyName = result.data.companyName;
    }
    if (result.data.dateApplied !== undefined) {
      updateData.dateApplied = new Date(result.data.dateApplied);
    }
    if (result.data.referralName !== undefined) {
      updateData.referralName = result.data.referralName ?? null;
    }
    if (result.data.referralContact !== undefined) {
      updateData.referralContact = result.data.referralContact ?? null;
    }
    if (result.data.jobDescription !== undefined) {
      updateData.jobDescription = result.data.jobDescription ?? null;
    }

    const application = await updateApplication(id, session.user.id, updateData);

    if (!application) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update application' } },
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
    const deleted = await deleteApplication(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Application not found' } },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete application' } },
      { status: 500 }
    );
  }
}
