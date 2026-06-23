import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConnectionById, updateConnection, deleteConnection } from '@/lib/services/connections';
import { z } from 'zod';

const updateConnectionSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).nullable().optional(),
  linkedinUrl: z.string().url().max(500).nullable().optional(),
  phoneNumber: z.string().max(50).nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyName: z.string().min(1).max(255).nullable().optional(),
  relationshipType: z.enum(['established_connection', 'cold_outreach']).optional(),
  notes: z.string().max(5000).nullable().optional(),
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
    const connection = await getConnectionById(id, session.user.id);
    if (!connection) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Connection not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: connection });
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connection' } },
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
    const parsed = updateConnectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const updated = await updateConnection(id, session.user.id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Connection not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update connection' } },
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
    await deleteConnection(id, session.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete connection' } },
      { status: 500 }
    );
  }
}
