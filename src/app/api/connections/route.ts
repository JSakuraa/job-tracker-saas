import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getConnections, createConnection } from '@/lib/services/connections';
import { z } from 'zod';

const createConnectionSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().email().max(255).nullable().optional(),
  linkedinUrl: z.string().url().max(500).nullable().optional(),
  phoneNumber: z.string().max(50).nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyName: z.string().min(1).max(255).nullable().optional(),
  relationshipType: z.enum(['established_connection', 'cold_outreach']),
  notes: z.string().max(5000).nullable().optional(),
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
    const data = await getConnections(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connections' } },
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
    const parsed = createConnectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const connection = await createConnection(session.user.id, parsed.data);
    return NextResponse.json({ data: connection }, { status: 201 });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create connection' } },
      { status: 500 }
    );
  }
}
