import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCompanyById, updateCompany, deleteCompany } from '@/lib/services/companies';
import { z } from 'zod';

const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  rank: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

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
    const company = await getCompanyById(id, session.user.id);
    if (!company) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Company not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: company });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch company' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const updated = await updateCompany(id, session.user.id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Company not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'NAME_CONFLICT') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: err.message } },
        { status: 409 }
      );
    }
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update company' } },
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
    await deleteCompany(id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const err = error as Error & { code?: string; details?: { applicationCount: number; connectionCount: number } };
    if (err.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Company not found' } },
        { status: 404 }
      );
    }
    if (err.code === 'REFERENCE_CONFLICT') {
      return NextResponse.json(
        { error: { code: 'REFERENCE_CONFLICT', message: err.message, details: err.details } },
        { status: 409 }
      );
    }
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete company' } },
      { status: 500 }
    );
  }
}
