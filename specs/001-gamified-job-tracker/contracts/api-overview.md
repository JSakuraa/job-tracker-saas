# API Contracts: Gamified Job Application Tracker

**Branch**: `001-gamified-job-tracker` | **Date**: 2025-03-25
**Base URL**: `/api`
**Authentication**: NextAuth.js session cookies (HttpOnly, Secure)

## Overview

All API routes are implemented as Next.js App Router Route Handlers. Protected routes require authentication via session cookie.

## Common Response Formats

### Success Response
```typescript
{
  data: T,
  meta?: {
    page?: number,
    pageSize?: number,
    total?: number,
  }
}
```

### Error Response
```typescript
{
  error: {
    code: string,        // Machine-readable code
    message: string,     // Human-readable message
    details?: object,    // Additional context
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Not authorized for this resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Server error

## API Routes

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/recover` | Initiate account recovery |

### User

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| PATCH | `/api/user/profile` | Update profile |
| GET | `/api/user/stats` | Get XP, level, streaks |
| DELETE | `/api/user/account` | Request account deletion |
| POST | `/api/user/account/recover` | Cancel account deletion |

### Applications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/applications` | List user's applications |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/:id` | Get application details |
| PATCH | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |
| PATCH | `/api/applications/:id/status` | Update status (with history) |
| GET | `/api/applications/:id/history` | Get status history |
| POST | `/api/applications/:id/resumes` | Attach resume |
| DELETE | `/api/applications/:id/resumes/:resumeId` | Detach resume |

### Resumes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/resumes` | List user's resumes |
| POST | `/api/resumes/upload-url` | Get signed upload URL |
| POST | `/api/resumes` | Register uploaded resume |
| GET | `/api/resumes/:id` | Get resume metadata |
| GET | `/api/resumes/:id/download` | Get signed download URL |
| DELETE | `/api/resumes/:id` | Delete resume |

### Quests

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quests` | List available quests |
| GET | `/api/quests/active` | List user's active quests |
| GET | `/api/quests/completed` | List user's completed quests |
| POST | `/api/quests/:id/claim` | Claim quest reward |

### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List user's goals |
| POST | `/api/goals` | Create personal goal |
| GET | `/api/goals/:id` | Get goal details |
| PATCH | `/api/goals/:id` | Update goal |
| POST | `/api/goals/:id/achieve` | Mark goal as achieved |
| POST | `/api/goals/:id/abandon` | Abandon goal |
| DELETE | `/api/goals/:id` | Delete goal |

### Rankings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings` | List ranked employers |
| POST | `/api/rankings` | Add employer to rankings |
| PATCH | `/api/rankings/:id` | Update rank/notes |
| DELETE | `/api/rankings/:id` | Remove from rankings |
| PATCH | `/api/rankings/reorder` | Bulk reorder rankings |

### Rewards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rewards` | List all rewards (with unlock status) |
| GET | `/api/rewards/unlocked` | List user's unlocked rewards |
| POST | `/api/rewards/:id/equip` | Equip reward (avatar/theme) |
| POST | `/api/rewards/:id/unequip` | Unequip reward |
