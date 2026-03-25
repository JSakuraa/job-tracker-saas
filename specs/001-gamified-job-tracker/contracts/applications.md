# API Contract: Applications

## GET /api/applications

List all job applications for the authenticated user.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| search | string | No | Search in job title or company |
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 20, max: 100) |
| sortBy | string | No | Sort field: `dateApplied`, `updatedAt`, `companyName` |
| sortOrder | string | No | `asc` or `desc` (default: `desc`) |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    jobTitle: string;
    companyName: string;
    dateApplied: string;        // ISO 8601
    status: ApplicationStatus;
    isRankedEmployer: boolean;  // Matches user's ranked list
    resumeCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

## POST /api/applications

Create a new job application.

### Request Body

```typescript
{
  jobTitle: string;           // Required, 1-255 chars
  companyName: string;        // Required, 1-255 chars
  dateApplied: string;        // Required, ISO 8601, not future
  referralName?: string;      // Optional, 1-255 chars
  referralContact?: string;   // Optional, 1-255 chars
  jobDescription?: string;    // Optional, max 50000 chars
  status?: ApplicationStatus; // Optional, default: 'applied'
}
```

### Response 201

```typescript
{
  data: {
    id: string;
    jobTitle: string;
    companyName: string;
    dateApplied: string;
    referralName: string | null;
    referralContact: string | null;
    jobDescription: string | null;
    status: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
  };
  xpAwarded: number;  // XP earned for this action
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

---

## GET /api/applications/:id

Get a single application with full details.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Response 200

```typescript
{
  data: {
    id: string;
    jobTitle: string;
    companyName: string;
    dateApplied: string;
    referralName: string | null;
    referralContact: string | null;
    jobDescription: string | null;
    status: ApplicationStatus;
    isRankedEmployer: boolean;
    rankedPosition: number | null;  // Position in user's rankings
    resumes: Array<{
      id: string;
      filename: string;
      attachedAt: string;
    }>;
    statusHistory: Array<{
      id: string;
      previousStatus: ApplicationStatus | null;
      newStatus: ApplicationStatus;
      changedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}
```

### Response 404

```typescript
{
  error: {
    code: "NOT_FOUND";
    message: "Application not found";
  };
}
```

---

## PATCH /api/applications/:id

Update an application's details (not status).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Request Body

```typescript
{
  jobTitle?: string;
  companyName?: string;
  dateApplied?: string;
  referralName?: string | null;
  referralContact?: string | null;
  jobDescription?: string | null;
}
```

### Response 200

```typescript
{
  data: {
    // Full application object (same as GET)
  };
}
```

---

## DELETE /api/applications/:id

Delete an application.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Response 204

No content.

---

## PATCH /api/applications/:id/status

Update an application's status with history tracking.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Request Body

```typescript
{
  status: ApplicationStatus;  // Required
}
```

### Response 200

```typescript
{
  data: {
    id: string;
    status: ApplicationStatus;
    previousStatus: ApplicationStatus;
    changedAt: string;
  };
  xpAwarded: number;  // XP earned for status update
}
```

---

## GET /api/applications/:id/history

Get status change history for an application.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    previousStatus: ApplicationStatus | null;
    newStatus: ApplicationStatus;
    changedAt: string;
  }>;
}
```

---

## POST /api/applications/:id/resumes

Attach a resume to an application.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |

### Request Body

```typescript
{
  resumeId: string;  // Required, existing resume UUID
}
```

### Response 201

```typescript
{
  data: {
    applicationId: string;
    resumeId: string;
    attachedAt: string;
  };
}
```

### Response 409

```typescript
{
  error: {
    code: "ALREADY_ATTACHED";
    message: "Resume is already attached to this application";
  };
}
```

---

## DELETE /api/applications/:id/resumes/:resumeId

Detach a resume from an application.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Application UUID |
| resumeId | string | Resume UUID |

### Response 204

No content.

---

## Types

```typescript
type ApplicationStatus =
  | 'applied'
  | 'phone_screen'
  | 'technical_interview'
  | 'onsite'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'accepted';
```
