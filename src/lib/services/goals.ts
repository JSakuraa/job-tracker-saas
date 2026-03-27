// T128: Goals service with progress tracking
// T129: Goal progress update logic triggered by user actions
// T137: Integrate XP award on goal achievement

import { db } from '@/lib/db/client';
import { personalGoals } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { awardXp } from '@/lib/xp/service';
import type { PersonalGoal } from '@/types/entities';

export interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string | null;
  targetType: string;
  targetCount: number;
  deadline?: Date | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  targetCount?: number;
  deadline?: Date | null;
}

/**
 * Create a new personal goal
 */
export async function createGoal(input: CreateGoalInput): Promise<PersonalGoal> {
  const [goal] = await db
    .insert(personalGoals)
    .values({
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      targetType: input.targetType,
      targetCount: input.targetCount,
      deadline: input.deadline ?? null,
    })
    .returning();

  if (!goal) {
    throw new Error('Failed to create goal');
  }

  return goal;
}

/**
 * Get a goal by ID
 */
export async function getGoalById(
  goalId: string,
  userId: string
): Promise<PersonalGoal | null> {
  const [goal] = await db
    .select()
    .from(personalGoals)
    .where(and(eq(personalGoals.id, goalId), eq(personalGoals.userId, userId)));

  return goal ?? null;
}

/**
 * Get all goals for a user
 */
export async function getGoals(userId: string): Promise<PersonalGoal[]> {
  return db
    .select()
    .from(personalGoals)
    .where(eq(personalGoals.userId, userId))
    .orderBy(desc(personalGoals.createdAt));
}

/**
 * Get active goals for a user
 */
export async function getActiveGoals(userId: string): Promise<PersonalGoal[]> {
  return db
    .select()
    .from(personalGoals)
    .where(and(eq(personalGoals.userId, userId), eq(personalGoals.status, 'active')))
    .orderBy(desc(personalGoals.createdAt));
}

/**
 * Update a goal
 */
export async function updateGoal(
  goalId: string,
  userId: string,
  input: UpdateGoalInput
): Promise<PersonalGoal | null> {
  const [updated] = await db
    .update(personalGoals)
    .set(input)
    .where(and(eq(personalGoals.id, goalId), eq(personalGoals.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Update goal progress based on an action
 */
export async function updateGoalProgress(
  userId: string,
  actionType: string
): Promise<{ goalsAchieved: string[] }> {
  const goalsAchieved: string[] = [];

  // Get active goals that match this action type
  const activeGoals = await db
    .select()
    .from(personalGoals)
    .where(
      and(
        eq(personalGoals.userId, userId),
        eq(personalGoals.status, 'active'),
        eq(personalGoals.targetType, actionType)
      )
    );

  for (const goal of activeGoals) {
    const newCount = goal.currentCount + 1;
    const isAchieved = newCount >= goal.targetCount;

    await db
      .update(personalGoals)
      .set({
        currentCount: newCount,
        status: isAchieved ? 'achieved' : 'active',
        achievedAt: isAchieved ? new Date() : null,
      })
      .where(eq(personalGoals.id, goal.id));

    if (isAchieved) {
      goalsAchieved.push(goal.id);

      // Award XP for achieving a goal
      await awardXp(
        userId,
        'goal_achieved',
        undefined,
        'personal_goal',
        goal.id
      );
    }
  }

  return { goalsAchieved };
}

/**
 * Mark a goal as achieved manually
 */
export async function achieveGoal(
  goalId: string,
  userId: string
): Promise<{ success: boolean; xpAwarded: number }> {
  const goal = await getGoalById(goalId, userId);
  if (!goal || goal.status !== 'active') {
    return { success: false, xpAwarded: 0 };
  }

  await db
    .update(personalGoals)
    .set({
      status: 'achieved',
      currentCount: goal.targetCount,
      achievedAt: new Date(),
    })
    .where(eq(personalGoals.id, goalId));

  const xpResult = await awardXp(
    userId,
    'goal_achieved',
    undefined,
    'personal_goal',
    goalId
  );

  return { success: true, xpAwarded: xpResult.xpAwarded };
}

/**
 * Abandon a goal
 */
export async function abandonGoal(
  goalId: string,
  userId: string
): Promise<boolean> {
  const goal = await getGoalById(goalId, userId);
  if (!goal || goal.status !== 'active') {
    return false;
  }

  await db
    .update(personalGoals)
    .set({
      status: 'abandoned',
    })
    .where(eq(personalGoals.id, goalId));

  return true;
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(personalGoals)
    .where(and(eq(personalGoals.id, goalId), eq(personalGoals.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}
