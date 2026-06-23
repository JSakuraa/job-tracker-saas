import { db } from '@/lib/db/client';
import { connections, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createOrGetCompany } from '@/lib/services/companies';
import type { Connection, ConnectionWithCompany, RelationshipType } from '@/types/entities';

export interface CreateConnectionInput {
  fullName: string;
  email?: string | null | undefined;
  linkedinUrl?: string | null | undefined;
  phoneNumber?: string | null | undefined;
  companyId?: string | null | undefined;
  companyName?: string | null | undefined;
  relationshipType: RelationshipType;
  notes?: string | null | undefined;
}

export interface UpdateConnectionInput {
  fullName?: string | undefined;
  email?: string | null | undefined;
  linkedinUrl?: string | null | undefined;
  phoneNumber?: string | null | undefined;
  companyId?: string | null | undefined;
  companyName?: string | null | undefined;
  relationshipType?: RelationshipType | undefined;
  notes?: string | null | undefined;
}

export async function getConnections(userId: string): Promise<ConnectionWithCompany[]> {
  const rows = await db
    .select({
      id: connections.id,
      userId: connections.userId,
      fullName: connections.fullName,
      email: connections.email,
      linkedinUrl: connections.linkedinUrl,
      phoneNumber: connections.phoneNumber,
      companyId: connections.companyId,
      relationshipType: connections.relationshipType,
      notes: connections.notes,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      companyName: companies.name,
      companyIdJoined: companies.id,
    })
    .from(connections)
    .leftJoin(companies, eq(connections.companyId, companies.id))
    .where(eq(connections.userId, userId))
    .orderBy(connections.createdAt);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    email: row.email,
    linkedinUrl: row.linkedinUrl,
    phoneNumber: row.phoneNumber,
    companyId: row.companyId,
    relationshipType: row.relationshipType,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    company: row.companyIdJoined ? { id: row.companyIdJoined, name: row.companyName! } : null,
  }));
}

export async function getConnectionById(id: string, userId: string): Promise<ConnectionWithCompany | null> {
  const rows = await db
    .select({
      id: connections.id,
      userId: connections.userId,
      fullName: connections.fullName,
      email: connections.email,
      linkedinUrl: connections.linkedinUrl,
      phoneNumber: connections.phoneNumber,
      companyId: connections.companyId,
      relationshipType: connections.relationshipType,
      notes: connections.notes,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      companyName: companies.name,
      companyIdJoined: companies.id,
    })
    .from(connections)
    .leftJoin(companies, eq(connections.companyId, companies.id))
    .where(and(eq(connections.id, id), eq(connections.userId, userId)));

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    email: row.email,
    linkedinUrl: row.linkedinUrl,
    phoneNumber: row.phoneNumber,
    companyId: row.companyId,
    relationshipType: row.relationshipType,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    company: row.companyIdJoined ? { id: row.companyIdJoined, name: row.companyName! } : null,
  };
}

async function resolveCompanyId(
  userId: string,
  input: { companyId?: string | null | undefined; companyName?: string | null | undefined }
): Promise<string | null> {
  if (input.companyId) return input.companyId;
  if (input.companyName?.trim()) {
    const company = await createOrGetCompany(userId, input.companyName.trim(), 'contact');
    return company.id;
  }
  return null;
}

export async function createConnection(
  userId: string,
  input: CreateConnectionInput
): Promise<Connection> {
  const companyId = await resolveCompanyId(userId, input);

  const [created] = await db
    .insert(connections)
    .values({
      userId,
      fullName: input.fullName,
      email: input.email ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      phoneNumber: input.phoneNumber ?? null,
      companyId: companyId ?? null,
      relationshipType: input.relationshipType,
      notes: input.notes ?? null,
    })
    .returning();

  if (!created) throw new Error('Failed to create connection');
  return created;
}

export async function updateConnection(
  id: string,
  userId: string,
  input: UpdateConnectionInput
): Promise<Connection | null> {
  const [existing] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, id), eq(connections.userId, userId)));

  if (!existing) return null;

  const updateData: Partial<typeof connections.$inferInsert> = { updatedAt: new Date() };

  if (input.fullName !== undefined) updateData.fullName = input.fullName;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.linkedinUrl !== undefined) updateData.linkedinUrl = input.linkedinUrl;
  if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;
  if (input.relationshipType !== undefined) updateData.relationshipType = input.relationshipType;
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (input.companyId !== undefined || input.companyName !== undefined) {
    updateData.companyId = await resolveCompanyId(userId, input);
  }

  const [updated] = await db
    .update(connections)
    .set(updateData)
    .where(and(eq(connections.id, id), eq(connections.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function deleteConnection(id: string, userId: string): Promise<void> {
  await db.delete(connections).where(and(eq(connections.id, id), eq(connections.userId, userId)));
}

export async function markAsConnected(id: string, userId: string): Promise<Connection | null> {
  const [updated] = await db
    .update(connections)
    .set({ relationshipType: 'established_connection', updatedAt: new Date() })
    .where(and(eq(connections.id, id), eq(connections.userId, userId)))
    .returning();

  return updated ?? null;
}
