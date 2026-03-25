# API Contract: Resumes

## GET /api/resumes

List all resumes for the authenticated user.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| pageSize | number | No | Items per page (default: 20, max: 100) |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;       // bytes
    uploadedAt: string;     // ISO 8601
    applicationCount: number; // Number of applications using this resume
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

## POST /api/resumes/upload-url

Get a signed URL for direct upload to Azure Blob Storage.

### Request Body

```typescript
{
  filename: string;   // Required, original filename
  mimeType: string;   // Required, must be PDF or DOCX
  fileSize: number;   // Required, in bytes, max 10MB
}
```

### Response 200

```typescript
{
  data: {
    uploadUrl: string;    // SAS URL for PUT request
    blobKey: string;      // Key to use when registering
    expiresAt: string;    // ISO 8601, URL expiration
  };
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

**Validation Rules**:
- `mimeType` must be `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `fileSize` must be ≤ 10,485,760 bytes (10MB)

---

## POST /api/resumes

Register an uploaded resume in the database.

### Request Body

```typescript
{
  filename: string;   // Required, sanitized filename
  blobKey: string;    // Required, from upload-url response
  mimeType: string;   // Required
  fileSize: number;   // Required
}
```

### Response 201

```typescript
{
  data: {
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  };
  xpAwarded: number;  // XP earned for uploading
}
```

### Response 400

```typescript
{
  error: {
    code: "BLOB_NOT_FOUND";
    message: "The specified blob does not exist";
  };
}
```

---

## GET /api/resumes/:id

Get resume metadata.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Resume UUID |

### Response 200

```typescript
{
  data: {
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
    applications: Array<{
      id: string;
      jobTitle: string;
      companyName: string;
      attachedAt: string;
    }>;
  };
}
```

### Response 404

```typescript
{
  error: {
    code: "NOT_FOUND";
    message: "Resume not found";
  };
}
```

---

## GET /api/resumes/:id/download

Get a signed download URL for the resume file.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Resume UUID |

### Response 200

```typescript
{
  data: {
    downloadUrl: string;  // SAS URL for GET request
    filename: string;     // Original filename
    expiresAt: string;    // ISO 8601, URL expiration (1 hour)
  };
}
```

### Response 404

```typescript
{
  error: {
    code: "NOT_FOUND";
    message: "Resume not found";
  };
}
```

---

## DELETE /api/resumes/:id

Delete a resume.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Resume UUID |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| force | boolean | No | If true, detach from all applications first |

### Response 204

No content.

### Response 409

```typescript
{
  error: {
    code: "RESUME_IN_USE";
    message: "Resume is attached to applications";
    details: {
      applicationCount: number;
      applications: Array<{
        id: string;
        jobTitle: string;
        companyName: string;
      }>;
    };
  };
}
```

**Note**: If `force=true`, the resume will be detached from all applications before deletion.
