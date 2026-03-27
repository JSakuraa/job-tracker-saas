// T057: TypeScript types for API responses

// Base response types
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
  xpAwarded?: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string> | Array<{ field: string; issue: string }>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Helper type guard
export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return 'error' in response;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Sort params
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter params for applications
export interface ApplicationFilterParams {
  status?: string;
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Common error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  ALREADY_RANKED: 'ALREADY_RANKED',
  QUEST_NOT_COMPLETE: 'QUEST_NOT_COMPLETE',
  ALREADY_CLAIMED: 'ALREADY_CLAIMED',
  NOT_UNLOCKED: 'NOT_UNLOCKED',
  NOT_DELETED: 'NOT_DELETED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Auth response types
export interface AuthRegisterResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthLoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: string;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: string;
}

// User stats response
export interface UserStatsResponse {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number;
  loginStreakCount: number;
  lastLoginDate: string | null;
  activeQuestCount: number;
  activeGoalCount: number;
  unlockedRewardCount: number;
}

// Resume upload URL response
export interface UploadUrlResponse {
  uploadUrl: string;
  blobKey: string;
}

// Account deletion response
export interface AccountDeletionResponse {
  deletedAt: string;
  permanentDeleteAt: string;
  message: string;
}
