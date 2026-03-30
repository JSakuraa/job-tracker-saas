// T052: XP Award Service with Event Logging

import { db } from '@/lib/db/client';
import { users, xpEvents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { XP_REWARDS, type XpActionType } from './constants';
import { getLevelFromXp, wouldLevelUp, calculateLevelsGained } from './utils';

export interface XpAwardResult {
  previousXp: number;
  newXp: number;
  xpAwarded: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
}

/**
 * Award XP to a user for a specific action
 */
export async function awardXp(
  userId: string,
  actionType: XpActionType,
  xpAmount?: number,
  relatedEntityType?: string,
  relatedEntityId?: string
): Promise<XpAwardResult> {
  // Determine XP amount based on action type if not provided
  const xpToAward = xpAmount ?? getDefaultXpForAction(actionType);

  // Get current user XP
  const [user] = await db.select({ totalXp: users.totalXp }).from(users).where(eq(users.id, userId));

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const previousXp = user.totalXp;
  const newXp = previousXp + xpToAward;
  const previousLevel = getLevelFromXp(previousXp);
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = wouldLevelUp(previousXp, xpToAward);
  const levelsGained = calculateLevelsGained(previousXp, xpToAward);

  // Update user's total XP
  await db
    .update(users)
    .set({
      totalXp: sql`${users.totalXp} + ${xpToAward}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Log the XP event
  await db.insert(xpEvents).values({
    userId,
    actionType,
    xpAmount: xpToAward,
    relatedEntityType: relatedEntityType ?? null,
    relatedEntityId: relatedEntityId ?? null,
  });

  return {
    previousXp,
    newXp,
    xpAwarded: xpToAward,
    previousLevel,
    newLevel,
    leveledUp,
    levelsGained,
  };
}

/**
 * Get XP history for a user
 */
export async function getXpHistory(userId: string, limit = 50, offset = 0) {
  const events = await db
    .select()
    .from(xpEvents)
    .where(eq(xpEvents.userId, userId))
    .orderBy(sql`${xpEvents.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  return events;
}

/**
 * Get default XP amount for an action type
 */
function getDefaultXpForAction(actionType: XpActionType): number {
  switch (actionType) {
    case 'application_created':
      return XP_REWARDS.APPLICATION_CREATED;
    case 'status_updated':
      return XP_REWARDS.STATUS_UPDATED;
    case 'resume_uploaded':
      return XP_REWARDS.RESUME_UPLOADED;
    case 'quest_completed':
      return XP_REWARDS.QUEST_COMPLETED;
    case 'goal_achieved':
      return XP_REWARDS.GOAL_ACHIEVED;
    case 'login_streak':
      return XP_REWARDS.LOGIN_STREAK_DAILY;
    case 'profile_updated':
      return XP_REWARDS.PROFILE_UPDATED;
    default:
      return 0;
  }
}
