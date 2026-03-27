// T085: Resumes service with CRUD and blob operations

import { db } from '@/lib/db/client';
import { resumes, applicationResumes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { awardXp } from '@/lib/xp/service';
import { getUploadUrl, getDownloadUrl, deleteFile } from '@/lib/storage/helpers';
import type { Resume } from '@/types/entities';

export interface CreateResumeInput {
  userId: string;
  filename: string;
  blobKey: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Get an upload URL for a resume
 */
export async function getResumeUploadUrl(
  userId: string,
  filename: string,
  mimeType: string,
  fileSize: number
): Promise<
  | { success: true; uploadUrl: string; blobKey: string }
  | { success: false; error: string }
> {
  return getUploadUrl(userId, filename, mimeType, fileSize);
}

/**
 * Register an uploaded resume in the database
 */
export async function createResume(
  input: CreateResumeInput
): Promise<{ resume: Resume; xpAwarded: number }> {
  const [resume] = await db
    .insert(resumes)
    .values({
      userId: input.userId,
      filename: input.filename,
      blobKey: input.blobKey,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    })
    .returning();

  if (!resume) {
    throw new Error('Failed to create resume');
  }

  // Award XP for uploading a resume
  const xpResult = await awardXp(
    input.userId,
    'resume_uploaded',
    undefined,
    'resume',
    resume.id
  );

  return {
    resume,
    xpAwarded: xpResult.xpAwarded,
  };
}

/**
 * Get a resume by ID
 */
export async function getResumeById(
  resumeId: string,
  userId: string
): Promise<Resume | null> {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);

  return resume ?? null;
}

/**
 * Get all resumes for a user
 */
export async function getResumes(userId: string): Promise<Resume[]> {
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.uploadedAt));
}

/**
 * Get a download URL for a resume
 */
export async function getResumeDownloadUrl(
  resumeId: string,
  userId: string
): Promise<string | null> {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    return null;
  }

  return getDownloadUrl(resume.blobKey);
}

/**
 * Delete a resume
 */
export async function deleteResume(
  resumeId: string,
  userId: string
): Promise<boolean> {
  // First get the resume to get the blob key
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    return false;
  }

  // Delete from storage
  await deleteFile(resume.blobKey);

  // Delete from database (this will also cascade to applicationResumes)
  const result = await db
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

  return (result.rowCount ?? 0) > 0;
}

/**
 * Attach a resume to an application
 */
export async function attachResumeToApplication(
  applicationId: string,
  resumeId: string,
  userId: string
): Promise<boolean> {
  // Verify the resume belongs to the user
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    return false;
  }

  try {
    await db.insert(applicationResumes).values({
      applicationId,
      resumeId,
    });
    return true;
  } catch {
    // Handle unique constraint violation (already attached)
    return false;
  }
}

/**
 * Detach a resume from an application
 */
export async function detachResumeFromApplication(
  applicationId: string,
  resumeId: string
): Promise<boolean> {
  const result = await db
    .delete(applicationResumes)
    .where(
      and(
        eq(applicationResumes.applicationId, applicationId),
        eq(applicationResumes.resumeId, resumeId)
      )
    );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Get resumes attached to an application
 */
export async function getResumesForApplication(
  applicationId: string,
  userId: string
): Promise<Resume[]> {
  const result = await db
    .select({
      resume: resumes,
    })
    .from(applicationResumes)
    .innerJoin(resumes, eq(applicationResumes.resumeId, resumes.id))
    .where(
      and(
        eq(applicationResumes.applicationId, applicationId),
        eq(resumes.userId, userId)
      )
    );

  return result.map((r) => r.resume);
}
