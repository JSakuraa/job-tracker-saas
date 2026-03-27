// T058: Validation schemas with Zod

import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (data) => {
    // If new password is provided, current password must also be provided
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  { message: 'Current password required to change password', path: ['currentPassword'] }
);

// Application validation schemas
export const createApplicationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(255),
  companyName: z.string().min(1, 'Company name is required').max(255),
  dateApplied: z.string().datetime().or(z.date()),
  referralName: z.string().max(255).optional().nullable(),
  referralContact: z.string().max(255).optional().nullable(),
  jobDescription: z.string().max(50000).optional().nullable(),
});

export const updateApplicationSchema = z.object({
  jobTitle: z.string().min(1).max(255).optional(),
  companyName: z.string().min(1).max(255).optional(),
  dateApplied: z.string().datetime().or(z.date()).optional(),
  referralName: z.string().max(255).optional().nullable(),
  referralContact: z.string().max(255).optional().nullable(),
  jobDescription: z.string().max(50000).optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'applied',
    'phone_screen',
    'technical_interview',
    'onsite',
    'offer',
    'rejected',
    'withdrawn',
    'accepted',
  ]),
});

// Resume validation schemas
export const uploadResumeSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024, 'File size exceeds 10MB limit'),
});

export const registerResumeSchema = z.object({
  filename: z.string().min(1).max(255),
  blobKey: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
});

// Goal validation schemas
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  targetType: z.string().min(1, 'Target type is required').max(50),
  targetCount: z.number().int().positive('Target count must be positive'),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  targetCount: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional().nullable(),
});

// Ranking validation schemas
export const createRankingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateRankingSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const reorderRankingsSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      rank: z.number().int().positive(),
    })
  ),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// Filter schemas
export const applicationFilterSchema = z.object({
  status: z.string().optional(),
  company: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UploadResumeInput = z.infer<typeof uploadResumeSchema>;
export type RegisterResumeInput = z.infer<typeof registerResumeSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateRankingInput = z.infer<typeof createRankingSchema>;
export type UpdateRankingInput = z.infer<typeof updateRankingSchema>;
export type ReorderRankingsInput = z.infer<typeof reorderRankingsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ApplicationFilterInput = z.infer<typeof applicationFilterSchema>;
