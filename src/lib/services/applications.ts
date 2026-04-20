// T062: Applications service with CRUD operations

import { db } from '@/lib/db/client';
import { jobApplications, statusChanges } from '@/lib/db/schema';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { awardXp } from '@/lib/xp/service';
import { updateQuestProgress } from '@/lib/services/quests';
import { updateGoalProgress } from '@/lib/services/goals';
import type { JobApplication, ApplicationStatus } from '@/types/entities';
import type { ApplicationFilterInput, PaginationInput } from '@/lib/validations';

export interface CreateApplicationInput {
  userId: string;
  jobTitle: string;
  companyName: string;
  dateApplied: Date;
  referralName?: string | null;
  referralContact?: string | null;
  jobDescription?: string | null;
}

export interface UpdateApplicationInput {
  jobTitle?: string;
  companyName?: string;
  dateApplied?: Date;
  referralName?: string | null;
  referralContact?: string | null;
  jobDescription?: string | null;
}

/**
 * Create a new job application
 */
export async function createApplication(
  input: CreateApplicationInput
): Promise<{ application: JobApplication; xpAwarded: number }> {
  const [application] = await db
    .insert(jobApplications)
    .values({
      userId: input.userId,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      dateApplied: input.dateApplied,
      referralName: input.referralName,
      referralContact: input.referralContact,
      jobDescription: input.jobDescription,
    })
    .returning();

  if (!application) {
    throw new Error('Failed to create application');
  }

  // Create initial status change entry
  await db.insert(statusChanges).values({
    applicationId: application.id,
    previousStatus: null,
    newStatus: 'applied',
  });

  // Award XP for creating an application
  const xpResult = await awardXp(
    input.userId,
    'application_created',
    undefined,
    'job_application',
    application.id
  );

  // Update quest progress for application creation
  await updateQuestProgress(input.userId, 'application_created');

  // Update goal progress for application creation
  await updateGoalProgress(input.userId, 'application_created');

  return {
    application,
    xpAwarded: xpResult.xpAwarded,
  };
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(
  applicationId: string,
  userId: string
): Promise<JobApplication | null> {
  const [application] = await db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, userId)))
    .limit(1);

  return application ?? null;
}

/**
 * Get all applications for a user with pagination and filtering
 */
export async function getApplications(
  userId: string,
  filters?: ApplicationFilterInput,
  pagination?: PaginationInput
): Promise<{ applications: JobApplication[]; total: number }> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(jobApplications.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(jobApplications.status, filters.status as ApplicationStatus));
  }

  if (filters?.company) {
    conditions.push(like(jobApplications.companyName, `%${filters.company}%`));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(jobApplications.jobTitle, `%${filters.search}%`),
        like(jobApplications.companyName, `%${filters.search}%`)
      )!
    );
  }

  // Get applications
  const applications = await db
    .select()
    .from(jobApplications)
    .where(and(...conditions))
    .orderBy(desc(jobApplications.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobApplications)
    .where(and(...conditions));

  return {
    applications,
    total: Number(countResult?.count ?? 0),
  };
}

/**
 * Update an application
 */
export async function updateApplication(
  applicationId: string,
  userId: string,
  input: UpdateApplicationInput
): Promise<JobApplication | null> {
  const [updated] = await db
    .update(jobApplications)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Delete an application
 */
export async function deleteApplication(applicationId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get application count by status for a user
 */
export async function getApplicationStats(userId: string): Promise<Record<string, number>> {
  const stats = await db
    .select({
      status: jobApplications.status,
      count: sql<number>`count(*)`,
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.status);

  return stats.reduce(
    (acc, stat) => {
      acc[stat.status] = Number(stat.count);
      return acc;
    },
    {} as Record<string, number>
  );
}
