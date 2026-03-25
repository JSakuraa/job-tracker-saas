# API Contract: Employer Rankings

## GET /api/rankings

List user's ranked employers in order.

### Response 200

```typescript
{
  data: Array<{
    id: string;
    companyName: string;
    rank: number;
    notes: string | null;
    applicationCount: number;  // Applications to this company
    latestApplication: {
      id: string;
      jobTitle: string;
      status: string;
      dateApplied: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

---

## POST /api/rankings

Add a company to rankings.

### Request Body

```typescript
{
  companyName: string;  // Required, 1-255 chars
  notes?: string;       // Optional
}
```

**Note**: New company is added at the end of the list (highest rank number + 1).

### Response 201

```typescript
{
  data: {
    id: string;
    companyName: string;
    rank: number;
    notes: string | null;
    createdAt: string;
  };
}
```

### Response 409

```typescript
{
  error: {
    code: "ALREADY_RANKED";
    message: "Company is already in your rankings";
  };
}
```

---

## PATCH /api/rankings/:id

Update a ranked employer entry.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | RankedEmployer UUID |

### Request Body

```typescript
{
  companyName?: string;
  notes?: string | null;
}
```

### Response 200

```typescript
{
  data: {
    id: string;
    companyName: string;
    rank: number;
    notes: string | null;
    updatedAt: string;
  };
}
```

---

## DELETE /api/rankings/:id

Remove a company from rankings.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | RankedEmployer UUID |

### Response 204

No content.

**Note**: Remaining companies are automatically re-ranked to close the gap.

---

## PATCH /api/rankings/reorder

Bulk reorder all rankings.

### Request Body

```typescript
{
  order: Array<{
    id: string;     // RankedEmployer UUID
    rank: number;   // New rank (1-based)
  }>;
}
```

**Validation**:
- All current ranked employer IDs must be included
- Ranks must be consecutive starting from 1
- No duplicate ranks

### Response 200

```typescript
{
  data: Array<{
    id: string;
    companyName: string;
    rank: number;
  }>;
}
```

### Response 400

```typescript
{
  error: {
    code: "VALIDATION_ERROR";
    message: "Invalid ranking order";
    details: {
      issue: string;  // e.g., "Missing employer", "Duplicate rank", "Non-consecutive ranks"
    };
  };
}
```
