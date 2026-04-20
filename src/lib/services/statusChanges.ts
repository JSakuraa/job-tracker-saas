// T063: Status change service with history tracking

import { db } from '@/lib/db/client';
import { jobApplications, statusChanges } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { awardXp } from '@/lib/xp/service';
import { updateQuestProgress } from '@/lib/services/quests';
import { updateGoalProgress } from '@/lib/services/goals';
import type { StatusChange, ApplicationStatus } from '@/types/entities';

/**
 * Update an application's status and record the change
 */
export async function updateApplicationStatus(
  applicationId: string,
  userId: string,
  newStatus: ApplicationStatus
): Promise<{ statusChange: StatusChange; xpAwarded: number } | null> {
  // Get the current application
  const [application] = await db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, userId)))
    .limit(1);

  if (!application) {
    return null;
  }

  const previousStatus = application.status;

  // Don't record if status hasn't changed
  if (previousStatus === newStatus) {
    return null;
  }

  // Update application status
  await db
    .update(jobApplications)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(jobApplications.id, applicationId));

  // Create status change record
  const [statusChange] = await db
    .insert(statusChanges)
    .values({
      applicationId,
      previousStatus,
      newStatus,
    })
    .returning();

  if (!statusChange) {
    throw new Error('Failed to create status change');
  }

  // Award XP for status update (T072)
  const xpResult = await awardXp(
    userId,
    'status_updated',
    undefined,
    'status_change',
    statusChange.id
  );

  // Update quest progress for status change
  await updateQuestProgress(userId, 'status_updated', newStatus);

  // Update goal progress for status change
  await updateGoalProgress(userId, 'status_updated');

  return {
    statusChange,
    xpAwarded: xpResult.xpAwarded,
  };
}

/**
 * Get status change history for an application
 */
export async function getStatusHistory(
  applicationId: string,
  userId: string
): Promise<StatusChange[]> {
  // First verify the application belongs to the user
  const [application] = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, userId)))
    .limit(1);

  if (!application) {
    return [];
  }

  // Get status change history
  const history = await db
    .select()
    .from(statusChanges)
    .where(eq(statusChanges.applicationId, applicationId))
    .orderBy(desc(statusChanges.changedAt));

  return history;
}

/**
 * Get the latest status change for an application
 */
export async function getLatestStatusChange(applicationId: string): Promise<StatusChange | null> {
  const [latest] = await db
    .select()
    .from(statusChanges)
    .where(eq(statusChanges.applicationId, applicationId))
    .orderBy(desc(statusChanges.changedAt))
    .limit(1);

  return latest ?? null;
}
