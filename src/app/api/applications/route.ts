// T064: GET /api/applications - List applications
// T065: POST /api/applications - Create application

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApplication, getApplications } from '@/lib/services/applications';
import { createApplicationSchema, paginationSchema, applicationFilterSchema } from '@/lib/validations';

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

    // Parse pagination
    const pagination = paginationSchema.parse({
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });

    // Parse filters
    const filters = applicationFilterSchema.parse({
      status: searchParams.get('status') ?? undefined,
      company: searchParams.get('company') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    });

    const { applications, total } = await getApplications(session.user.id, filters, pagination);

    return NextResponse.json({
      data: applications,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch applications' } },
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

    const result = createApplicationSchema.safeParse(body);
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

    const { jobTitle, companyName, dateApplied, referralName, referralContact, jobDescription } =
      result.data;

    const { application, xpAwarded } = await createApplication({
      userId: session.user.id,
      jobTitle,
      companyName,
      dateApplied: new Date(dateApplied),
      referralName: referralName ?? null,
      referralContact: referralContact ?? null,
      jobDescription: jobDescription ?? null,
    });

    return NextResponse.json(
      {
        data: application,
        xpAwarded,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create application' } },
      { status: 500 }
    );
  }
}
