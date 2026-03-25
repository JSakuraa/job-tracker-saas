# API Contract: User & Authentication

## Authentication

### POST /api/auth/register

Create a new user account.

### Request Body

```typescript
{
  email: string;     // Required, valid email format
  password: string;  // Required, min 8 chars
  name: string;      // Required, 1-255 chars
}
```

### Response 201

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
}
```

### Response 409

```typescript
{
  error: {
    code: "EMAIL_EXISTS";
    message: "An account with this email already exists";
  };
}
```

---

### POST /api/auth/login

Authenticate and create session.

### Request Body

```typescript
{
  email: string;
  password: string;
}
```

### Response 200

```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    expiresAt: string;  // Session expiration
  };
}
```

**Note**: Session cookie is set automatically (HttpOnly, Secure, SameSite=Strict).

### Response 401

```typescript
{
  error: {
    code: "INVALID_CREDENTIALS";
    message: "Invalid email or password";
  };
}
```

### Response 429

```typescript
{
  error: {
    code: "TOO_MANY_ATTEMPTS";
    message: "Too many login attempts. Try again later.";
    details: {
      retryAfter: number;  // Seconds until retry allowed
    };
  };
}
```

---

### POST /api/auth/logout

End the current session.

### Response 200

```typescript
{
  data: {
    success: true;
  };
}
```

---

### GET /api/auth/session

Get current session info.

### Response 200 (Authenticated)

```typescript
{
  data: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    expiresAt: string;
  };
}
```

### Response 200 (Not authenticated)

```typescript
{
  data: null;
}
```

---

### POST /api/auth/recover

Initiate password recovery.

### Request Body

```typescript
{
  email: string;
}
```

### Response 200

```typescript
{
  data: {
    message: "If an account exists, a recovery email has been sent.";
  };
}
```

**Note**: Always returns success to prevent email enumeration.

---

## User Profile

### GET /api/user/profile

Get current user's profile.

### Response 200

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    totalXp: number;
    level: number;
    loginStreakCount: number;
    customization: {
      avatarId: string | null;
      themeId: string | null;
      badgeIds: string[];
    };
    isActive: boolean;
    deletedAt: string | null;  // Present if in deletion grace period
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### PATCH /api/user/profile

Update user profile.

### Request Body

```typescript
{
  name?: string;
  email?: string;
  currentPassword?: string;  // Required if changing password
  newPassword?: string;      // Requires currentPassword
}
```

### Response 200

```typescript
{
  data: {
    id: string;
    email: string;
    name: string;
    updatedAt: string;
  };
  xpAwarded?: number;  // XP for profile completion milestones
}
```

### Response 400

```typescript
{
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: {
      field: string;
      issue: string;
    }[];
  };
}
```

### Response 401

```typescript
{
  error: {
    code: "INVALID_PASSWORD";
    message: "Current password is incorrect";
  };
}
```

---

## Account Management

### DELETE /api/user/account

Request account deletion (starts 30-day grace period).

### Response 200

```typescript
{
  data: {
    deletedAt: string;       // When deletion was requested
    permanentDeleteAt: string;  // When data will be permanently deleted
    message: "Account scheduled for deletion. You can recover within 30 days.";
  };
}
```

---

### POST /api/user/account/recover

Cancel account deletion during grace period.

### Response 200

```typescript
{
  data: {
    isActive: true;
    message: "Account recovered successfully.";
  };
}
```

### Response 400

```typescript
{
  error: {
    code: "NOT_DELETED";
    message: "Account is not pending deletion";
  };
}
```

---

## XP Events History

### GET /api/user/xp-history

Get user's XP event history.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 50) |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    actionType: string;
    xpAmount: number;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    createdAt: string;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

## Types

```typescript
type XpActionType =
  | 'application_created'
  | 'status_updated'
  | 'resume_uploaded'
  | 'quest_completed'
  | 'goal_achieved'
  | 'login_streak'
  | 'profile_updated';
```
