import { db } from '@/lib/db/client';
import { companies, jobApplications, connections } from '@/lib/db/schema';
import { eq, and, gt, lt, isNotNull, ilike, sql } from 'drizzle-orm';
import type { Company, CompanyWithCounts, CompanySource } from '@/types/entities';

function normalizeName(name: string): string {
  return name.toLowerCase().trim();
}

export interface CreateCompanyInput {
  userId: string;
  name: string;
  source: CompanySource;
  rank?: number | null;
  notes?: string | null;
}

export interface UpdateCompanyInput {
  name?: string | undefined;
  rank?: number | null | undefined;
  notes?: string | null | undefined;
}

async function getReferenceCounts(companyId: string): Promise<{ applicationCount: number; connectionCount: number }> {
  const [appCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobApplications)
    .where(eq(jobApplications.companyId, companyId));

  const [connCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(eq(connections.companyId, companyId));

  return {
    applicationCount: Number(appCount?.count ?? 0),
    connectionCount: Number(connCount?.count ?? 0),
  };
}

export async function getCompanies(userId: string): Promise<CompanyWithCounts[]> {
  const rows = await db.select().from(companies).where(eq(companies.userId, userId));

  const withCounts = await Promise.all(
    rows.map(async (company) => {
      const counts = await getReferenceCounts(company.id);
      return { ...company, ...counts };
    })
  );

  return withCounts.sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getCompanyById(id: string, userId: string): Promise<CompanyWithCounts | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)));

  if (!company) return null;
  const counts = await getReferenceCounts(company.id);
  return { ...company, ...counts };
}

export async function searchCompanies(
  userId: string,
  query: string
): Promise<Pick<Company, 'id' | 'name' | 'rank'>[]> {
  const normalized = normalizeName(query);
  const rows = await db
    .select({ id: companies.id, name: companies.name, rank: companies.rank })
    .from(companies)
    .where(and(eq(companies.userId, userId), ilike(companies.name, `%${normalized}%`)))
    .limit(10);

  return rows.sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function createOrGetCompany(
  userId: string,
  name: string,
  source: CompanySource
): Promise<Company> {
  const normalized = normalizeName(name);

  const [existing] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.userId, userId), eq(companies.name, normalized)));

  if (existing) return existing;

  const [created] = await db
    .insert(companies)
    .values({ userId, name: normalized, source, rank: null })
    .returning();

  if (!created) throw new Error('Failed to create company');
  return created;
}

export async function updateCompany(
  id: string,
  userId: string,
  input: UpdateCompanyInput
): Promise<Company | null> {
  const existing = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)))
    .then((r) => r[0] ?? null);

  if (!existing) return null;

  const updateData: Partial<typeof companies.$inferInsert> = { updatedAt: new Date() };

  if (input.name !== undefined) {
    const normalized = normalizeName(input.name);
    const [conflict] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.name, normalized)));
    if (conflict && conflict.id !== id) {
      const err = new Error('A company with this name already exists') as Error & { code: string };
      err.code = 'NAME_CONFLICT';
      throw err;
    }
    updateData.name = normalized;
  }

  if (input.notes !== undefined) updateData.notes = input.notes;

  if (input.rank !== undefined) {
    const newRank = input.rank;
    const oldRank = existing.rank;

    if (newRank !== oldRank) {
      if (newRank === null) {
        // Removing rank: shift down all companies ranked after this one
        if (oldRank !== null) {
          await db
            .update(companies)
            .set({ rank: sql`${companies.rank} - 1`, updatedAt: new Date() })
            .where(and(eq(companies.userId, userId), isNotNull(companies.rank), gt(companies.rank, oldRank)));
        }
        updateData.rank = null;
      } else if (oldRank === null) {
        // Adding rank: insert at newRank, shift others up
        await db
          .update(companies)
          .set({ rank: sql`${companies.rank} + 1`, updatedAt: new Date() })
          .where(and(eq(companies.userId, userId), isNotNull(companies.rank), gt(companies.rank, newRank - 1)));
        updateData.rank = newRank;
      } else {
        // Changing rank
        if (newRank < oldRank) {
          await db
            .update(companies)
            .set({ rank: sql`${companies.rank} + 1`, updatedAt: new Date() })
            .where(and(eq(companies.userId, userId), isNotNull(companies.rank), gt(companies.rank, newRank - 1), lt(companies.rank, oldRank)));
        } else {
          await db
            .update(companies)
            .set({ rank: sql`${companies.rank} - 1`, updatedAt: new Date() })
            .where(and(eq(companies.userId, userId), isNotNull(companies.rank), gt(companies.rank, oldRank), lt(companies.rank, newRank + 1)));
        }
        updateData.rank = newRank;
      }
    }
  }

  const [updated] = await db
    .update(companies)
    .set(updateData)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function deleteCompany(id: string, userId: string): Promise<void> {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, id), eq(companies.userId, userId)));

  if (!company) {
    const err = new Error('Company not found') as Error & { code: string };
    err.code = 'NOT_FOUND';
    throw err;
  }

  const counts = await getReferenceCounts(id);

  if (counts.applicationCount > 0 || counts.connectionCount > 0) {
    const err = new Error(
      `This company cannot be deleted because it is referenced by ${counts.applicationCount} application(s) and ${counts.connectionCount} connection(s). Remove or reassign those records first.`
    ) as Error & { code: string; details: { applicationCount: number; connectionCount: number } };
    err.code = 'REFERENCE_CONFLICT';
    err.details = counts;
    throw err;
  }

  // Shift down ranks after this one
  if (company.rank !== null) {
    await db
      .update(companies)
      .set({ rank: sql`${companies.rank} - 1`, updatedAt: new Date() })
      .where(and(eq(companies.userId, userId), isNotNull(companies.rank), gt(companies.rank, company.rank)));
  }

  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

export async function bulkReorderCompanies(userId: string, orderedIds: string[]): Promise<boolean> {
  const allCompanies = await db.select().from(companies).where(eq(companies.userId, userId));
  const userCompanyIds = new Set(allCompanies.map((c) => c.id));

  for (const id of orderedIds) {
    if (!userCompanyIds.has(id)) return false;
  }

  // Phase 1: set temporary negative ranks to avoid unique conflicts
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (id) {
      await db
        .update(companies)
        .set({ rank: -(i + 1), updatedAt: new Date() })
        .where(and(eq(companies.id, id), eq(companies.userId, userId)));
    }
  }

  // Phase 2: set final ranks
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (id) {
      await db
        .update(companies)
        .set({ rank: i + 1, updatedAt: new Date() })
        .where(and(eq(companies.id, id), eq(companies.userId, userId)));
    }
  }

  return true;
}

export { getReferenceCounts };
