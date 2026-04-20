// T115: Quests service with progress tracking
// T116: Quest progress update logic triggered by user actions

import { db } from '@/lib/db/client';
import { quests, userQuests } from '@/lib/db/schema';
import { eq, and, desc, isNull, or, gt } from 'drizzle-orm';
import { awardXp } from '@/lib/xp/service';
import type { Quest, UserQuest } from '@/types/entities';
import type { QuestRequirements } from '@/lib/db/schema';

export interface QuestWithProgress extends Quest {
  userQuest: UserQuest | null;
  progressPercent: number;
}

/**
 * Get all available quests for a user
 */
export async function getQuests(userId: string): Promise<QuestWithProgress[]> {
  // Get all active quests
  const activeQuests = await db
    .select()
    .from(quests)
    .where(eq(quests.isActive, true))
    .orderBy(desc(quests.createdAt));

  // Get user's quest progress
  const userQuestProgress = await db
    .select()
    .from(userQuests)
    .where(eq(userQuests.userId, userId));

  // Map quests with user progress
  return activeQuests.map((quest) => {
    const userQuest = userQuestProgress.find((uq) => uq.questId === quest.id) ?? null;
    const requirements = quest.requirements as QuestRequirements;
    const progress = userQuest?.progress ?? 0;
    const progressPercent = Math.min(100, Math.floor((progress / requirements.count) * 100));

    return {
      ...quest,
      userQuest,
      progressPercent,
    };
  });
}

/**
 * Get active (in-progress) quests for a user
 */
export async function getActiveQuests(userId: string): Promise<QuestWithProgress[]> {
  const allQuests = await getQuests(userId);
  const now = new Date();

  return allQuests.filter((q) => {
    // Not started or in progress
    const status = q.userQuest?.status;
    if (!status || status === 'in_progress') {
      // Check if not expired
      if (q.userQuest?.expiresAt && new Date(q.userQuest.expiresAt) < now) {
        return false;
      }
      return true;
    }
    return false;
  });
}

/**
 * Get completed quests for a user
 */
export async function getCompletedQuests(userId: string): Promise<QuestWithProgress[]> {
  const allQuests = await getQuests(userId);

  return allQuests.filter((q) => {
    const status = q.userQuest?.status;
    return status === 'completed' || status === 'claimed';
  });
}

/**
 * Start a quest for a user
 */
export async function startQuest(
  userId: string,
  questId: string
): Promise<UserQuest | null> {
  // Check if quest exists
  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, questId));

  if (!quest || !quest.isActive) {
    return null;
  }

  // Check if already started
  const [existing] = await db
    .select()
    .from(userQuests)
    .where(and(eq(userQuests.userId, userId), eq(userQuests.questId, questId)));

  if (existing) {
    return existing;
  }

  // Calculate expiration for daily/weekly quests
  let expiresAt: Date | null = null;
  if (quest.type === 'daily') {
    expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);
  } else if (quest.type === 'weekly') {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (7 - expiresAt.getDay()));
    expiresAt.setHours(23, 59, 59, 999);
  }

  const [userQuest] = await db
    .insert(userQuests)
    .values({
      userId,
      questId,
      expiresAt,
    })
    .returning();

  return userQuest ?? null;
}

/**
 * Update quest progress based on an action
 * Auto-enrolls users in matching quests they haven't started yet
 */
export async function updateQuestProgress(
  userId: string,
  actionType: string,
  targetStatus?: string
): Promise<{ questsCompleted: string[] }> {
  const questsCompleted: string[] = [];

  // First, auto-enroll user in any matching active quests they haven't started
  const allActiveQuests = await db
    .select()
    .from(quests)
    .where(eq(quests.isActive, true));

  const existingUserQuests = await db
    .select()
    .from(userQuests)
    .where(eq(userQuests.userId, userId));

  const existingQuestIds = new Set(existingUserQuests.map(uq => uq.questId));

  // Auto-start matching quests
  for (const quest of allActiveQuests) {
    if (existingQuestIds.has(quest.id)) {
      continue;
    }

    const requirements = quest.requirements as QuestRequirements;

    // Only auto-start if the action matches
    if (requirements.action !== actionType) {
      continue;
    }

    // Check target status if required
    if (requirements.targetStatus && requirements.targetStatus !== targetStatus) {
      continue;
    }

    // Calculate expiration for daily/weekly quests
    let expiresAt: Date | null = null;
    if (quest.type === 'daily') {
      expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999);
    } else if (quest.type === 'weekly') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (7 - expiresAt.getDay()));
      expiresAt.setHours(23, 59, 59, 999);
    }

    await db.insert(userQuests).values({
      userId,
      questId: quest.id,
      progress: 0,
      expiresAt,
    });
  }

  // Now get all active quests for user that match this action (including newly enrolled)
  const activeUserQuests = await db
    .select({
      userQuest: userQuests,
      quest: quests,
    })
    .from(userQuests)
    .innerJoin(quests, eq(userQuests.questId, quests.id))
    .where(
      and(
        eq(userQuests.userId, userId),
        eq(userQuests.status, 'in_progress'),
        or(
          isNull(userQuests.expiresAt),
          gt(userQuests.expiresAt, new Date())
        )
      )
    );

  for (const { userQuest, quest } of activeUserQuests) {
    const requirements = quest.requirements as QuestRequirements;

    // Check if this action matches the quest requirements
    if (requirements.action !== actionType) {
      continue;
    }

    // Check target status if required
    if (requirements.targetStatus && requirements.targetStatus !== targetStatus) {
      continue;
    }

    // Increment progress
    const newProgress = userQuest.progress + 1;
    const isComplete = newProgress >= requirements.count;

    await db
      .update(userQuests)
      .set({
        progress: newProgress,
        status: isComplete ? 'completed' : 'in_progress',
        completedAt: isComplete ? new Date() : null,
      })
      .where(eq(userQuests.id, userQuest.id));

    if (isComplete) {
      questsCompleted.push(quest.id);
    }
  }

  return { questsCompleted };
}

/**
 * Claim rewards for a completed quest
 */
export async function claimQuestReward(
  userId: string,
  questId: string
): Promise<{ success: boolean; xpAwarded: number }> {
  // Get the user quest
  const [userQuest] = await db
    .select({
      userQuest: userQuests,
      quest: quests,
    })
    .from(userQuests)
    .innerJoin(quests, eq(userQuests.questId, quests.id))
    .where(
      and(
        eq(userQuests.userId, userId),
        eq(userQuests.questId, questId),
        eq(userQuests.status, 'completed')
      )
    );

  if (!userQuest) {
    return { success: false, xpAwarded: 0 };
  }

  // Award XP
  const xpResult = await awardXp(
    userId,
    'quest_completed',
    userQuest.quest.xpReward,
    'quest',
    questId
  );

  // Mark as claimed
  await db
    .update(userQuests)
    .set({
      status: 'claimed',
      claimedAt: new Date(),
    })
    .where(eq(userQuests.id, userQuest.userQuest.id));

  return { success: true, xpAwarded: xpResult.xpAwarded };
}

/**
 * Get a single quest by ID
 */
export async function getQuestById(questId: string): Promise<Quest | null> {
  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, questId));

  return quest ?? null;
}
