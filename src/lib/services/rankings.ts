// T144: Rankings service with reorder logic

import { db } from '@/lib/db/client';
import { rankedEmployers } from '@/lib/db/schema';
import { eq, and, asc, gt, lt } from 'drizzle-orm';
import type { RankedEmployer } from '@/types/entities';

export interface CreateRankingInput {
  userId: string;
  companyName: string;
  notes?: string | null | undefined;
}

export interface UpdateRankingInput {
  companyName?: string | undefined;
  notes?: string | null | undefined;
}

/**
 * Get all ranked employers for a user, ordered by rank
 */
export async function getRankings(userId: string): Promise<RankedEmployer[]> {
  return db
    .select()
    .from(rankedEmployers)
    .where(eq(rankedEmployers.userId, userId))
    .orderBy(asc(rankedEmployers.rank));
}

/**
 * Get a single ranking by ID
 */
export async function getRankingById(
  rankingId: string,
  userId: string
): Promise<RankedEmployer | null> {
  const [ranking] = await db
    .select()
    .from(rankedEmployers)
    .where(and(eq(rankedEmployers.id, rankingId), eq(rankedEmployers.userId, userId)));

  return ranking ?? null;
}

/**
 * Check if a company is ranked for a user
 */
export async function isCompanyRanked(
  userId: string,
  companyName: string
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(rankedEmployers)
    .where(
      and(
        eq(rankedEmployers.userId, userId),
        eq(rankedEmployers.companyName, companyName.toLowerCase())
      )
    );

  return !!existing;
}

/**
 * Get the rank of a company for a user
 */
export async function getCompanyRank(
  userId: string,
  companyName: string
): Promise<number | null> {
  const [ranking] = await db
    .select({ rank: rankedEmployers.rank })
    .from(rankedEmployers)
    .where(
      and(
        eq(rankedEmployers.userId, userId),
        eq(rankedEmployers.companyName, companyName.toLowerCase())
      )
    );

  return ranking?.rank ?? null;
}

/**
 * Add a new ranked employer (at the end of the list)
 */
export async function createRanking(input: CreateRankingInput): Promise<RankedEmployer> {
  // Get the highest current rank
  const existing = await getRankings(input.userId);
  const nextRank = existing.length > 0 ? Math.max(...existing.map((r) => r.rank)) + 1 : 1;

  const [ranking] = await db
    .insert(rankedEmployers)
    .values({
      userId: input.userId,
      companyName: input.companyName.toLowerCase(),
      notes: input.notes ?? null,
      rank: nextRank,
    })
    .returning();

  if (!ranking) {
    throw new Error('Failed to create ranking');
  }

  return ranking;
}

/**
 * Update a ranking's details (not rank)
 */
export async function updateRanking(
  rankingId: string,
  userId: string,
  input: UpdateRankingInput
): Promise<RankedEmployer | null> {
  const updateData: Partial<typeof rankedEmployers.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.companyName !== undefined) {
    updateData.companyName = input.companyName.toLowerCase();
  }
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  const [updated] = await db
    .update(rankedEmployers)
    .set(updateData)
    .where(and(eq(rankedEmployers.id, rankingId), eq(rankedEmployers.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Delete a ranking and reorder remaining items
 */
export async function deleteRanking(rankingId: string, userId: string): Promise<boolean> {
  const ranking = await getRankingById(rankingId, userId);
  if (!ranking) {
    return false;
  }

  // Delete the ranking
  await db
    .delete(rankedEmployers)
    .where(and(eq(rankedEmployers.id, rankingId), eq(rankedEmployers.userId, userId)));

  // Shift down all rankings after this one
  const remaining = await db
    .select()
    .from(rankedEmployers)
    .where(and(eq(rankedEmployers.userId, userId), gt(rankedEmployers.rank, ranking.rank)))
    .orderBy(asc(rankedEmployers.rank));

  for (const item of remaining) {
    await db
      .update(rankedEmployers)
      .set({ rank: item.rank - 1, updatedAt: new Date() })
      .where(eq(rankedEmployers.id, item.id));
  }

  return true;
}

/**
 * Reorder a ranking to a new position
 * Moves the item at oldRank to newRank, shifting other items as needed
 */
export async function reorderRanking(
  rankingId: string,
  userId: string,
  newRank: number
): Promise<boolean> {
  const ranking = await getRankingById(rankingId, userId);
  if (!ranking) {
    return false;
  }

  const oldRank = ranking.rank;
  if (oldRank === newRank) {
    return true; // No change needed
  }

  // Get total count to validate newRank
  const allRankings = await getRankings(userId);
  const maxRank = allRankings.length;

  if (newRank < 1 || newRank > maxRank) {
    return false; // Invalid rank
  }

  if (newRank < oldRank) {
    // Moving up: shift items between newRank and oldRank down
    const toShift = await db
      .select()
      .from(rankedEmployers)
      .where(
        and(
          eq(rankedEmployers.userId, userId),
          gt(rankedEmployers.rank, newRank - 1),
          lt(rankedEmployers.rank, oldRank)
        )
      )
      .orderBy(asc(rankedEmployers.rank));

    for (const item of toShift) {
      await db
        .update(rankedEmployers)
        .set({ rank: item.rank + 1, updatedAt: new Date() })
        .where(eq(rankedEmployers.id, item.id));
    }
  } else {
    // Moving down: shift items between oldRank and newRank up
    const toShift = await db
      .select()
      .from(rankedEmployers)
      .where(
        and(
          eq(rankedEmployers.userId, userId),
          gt(rankedEmployers.rank, oldRank),
          lt(rankedEmployers.rank, newRank + 1)
        )
      )
      .orderBy(asc(rankedEmployers.rank));

    for (const item of toShift) {
      await db
        .update(rankedEmployers)
        .set({ rank: item.rank - 1, updatedAt: new Date() })
        .where(eq(rankedEmployers.id, item.id));
    }
  }

  // Set the item's new rank
  await db
    .update(rankedEmployers)
    .set({ rank: newRank, updatedAt: new Date() })
    .where(eq(rankedEmployers.id, rankingId));

  return true;
}

/**
 * Bulk reorder rankings based on an array of IDs
 * The order of IDs in the array determines the new ranking order
 */
export async function bulkReorderRankings(
  userId: string,
  orderedIds: string[]
): Promise<boolean> {
  const rankings = await getRankings(userId);

  // Validate that all IDs belong to the user
  const userRankingIds = new Set(rankings.map((r) => r.id));
  for (const id of orderedIds) {
    if (!userRankingIds.has(id)) {
      return false; // Invalid ID
    }
  }

  // Update each ranking with its new rank
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (id) {
      await db
        .update(rankedEmployers)
        .set({ rank: i + 1, updatedAt: new Date() })
        .where(and(eq(rankedEmployers.id, id), eq(rankedEmployers.userId, userId)));
    }
  }

  return true;
}
