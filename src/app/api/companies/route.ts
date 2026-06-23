import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCompanies, createOrGetCompany } from '@/lib/services/companies';
import { z } from 'zod';

const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  rank: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  source: z.enum(['application', 'companies_tab', 'contact']).default('companies_tab'),
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
    const data = await getCompanies(session.user.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch companies' } },
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
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const company = await createOrGetCompany(session.user.id, parsed.data.name, parsed.data.source);
    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create company' } },
      { status: 500 }
    );
  }
}
