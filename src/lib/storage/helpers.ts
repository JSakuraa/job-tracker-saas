// T055: File Upload/Download Helpers

import { getContainerClient } from './client';
import { generateUploadSasUrl, generateDownloadSasUrl } from './sas';
import { randomUUID } from 'crypto';

// Allowed MIME types for resume uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate a file for upload
 */
export function validateFile(
  mimeType: string,
  fileSize: number
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF and DOCX files are allowed.',
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique blob key for a file
 */
export function generateBlobKey(userId: string, filename: string): string {
  const sanitizedFilename = sanitizeFilename(filename);
  const uniqueId = randomUUID();
  const extension = getFileExtension(sanitizedFilename);

  return `${userId}/${uniqueId}${extension}`;
}

/**
 * Sanitize a filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Get a presigned URL for uploading a file
 */
export async function getUploadUrl(
  userId: string,
  filename: string,
  mimeType: string,
  fileSize: number
): Promise<
  | { success: true; uploadUrl: string; blobKey: string }
  | { success: false; error: string }
> {
  const validation = validateFile(mimeType, fileSize);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const blobKey = generateBlobKey(userId, filename);

  try {
    const { url } = await generateUploadSasUrl(blobKey);
    return {
      success: true,
      uploadUrl: url,
      blobKey,
    };
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return {
      success: false,
      error: 'Failed to generate upload URL',
    };
  }
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getDownloadUrl(blobKey: string): Promise<string> {
  return generateDownloadSasUrl(blobKey);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(blobKey: string): Promise<boolean> {
  try {
    const containerClient = getContainerClient();
    const blobClient = containerClient.getBlockBlobClient(blobKey);
    await blobClient.deleteIfExists();
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(blobKey: string): Promise<boolean> {
  try {
    const containerClient = getContainerClient();
    const blobClient = containerClient.getBlockBlobClient(blobKey);
    return await blobClient.exists();
  } catch {
    return false;
  }
}
