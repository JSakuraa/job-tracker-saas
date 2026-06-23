# API Contract: Companies

**Base path**: `/api/companies`  
**Auth**: All endpoints require a valid NextAuth session. Returns `401` if unauthenticated.  
**Scope**: All operations are scoped to the authenticated user's companies only.

---

## GET /api/companies

List all companies for the current user. Ranked companies are returned first (sorted by `rank` ascending), followed by unranked companies (sorted by `name` ascending).

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "stripe",
      "rank": 1,
      "notes": null,
      "source": "companies_tab",
      "applicationCount": 2,
      "connectionCount": 1,
      "createdAt": "2026-06-22T00:00:00Z",
      "updatedAt": "2026-06-22T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "google",
      "rank": null,
      "notes": null,
      "source": "application",
      "applicationCount": 1,
      "connectionCount": 0,
      "createdAt": "2026-06-22T00:00:00Z",
      "updatedAt": "2026-06-22T00:00:00Z"
    }
  ]
}
```

---

## GET /api/companies/search?q={query}

Autofill endpoint. Returns up to 10 companies whose normalized name starts with or contains the query string. Ranked companies appear first in results.

**Query params**:
- `q` (required): search string, min 1 character

**Response 200**:
```json
{
  "data": [
    { "id": "uuid", "name": "stripe", "rank": 1 },
    { "id": "uuid", "name": "striveworks", "rank": null }
  ]
}
```

**Response 400** (missing or empty `q`):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Query parameter 'q' is required" } }
```

---

## POST /api/companies

Create a new company. If a company with the same normalized name already exists for this user, returns the existing company instead of creating a duplicate (idempotent by name).

**Request body**:
```json
{
  "name": "Stripe",
  "rank": null,
  "notes": null,
  "source": "companies_tab"
}
```

**Validation**:
- `name`: required, string, 1–255 chars
- `rank`: optional integer ≥ 1, or null
- `notes`: optional string, max 1000 chars, or null
- `source`: required, one of `"application" | "companies_tab" | "contact"`

**Response 201** (created):
```json
{ "data": { "id": "uuid", "name": "stripe", "rank": null, ... } }
```

**Response 200** (already existed — returned as-is):
```json
{ "data": { "id": "uuid", "name": "stripe", "rank": 1, ... } }
```

**Response 400**: validation error

---

## GET /api/companies/[id]

Get a single company with reference counts.

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "name": "stripe",
    "rank": 1,
    "notes": null,
    "source": "companies_tab",
    "applicationCount": 2,
    "connectionCount": 1,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Response 404**: company not found or does not belong to user

---

## PUT /api/companies/[id]

Update a company's name, rank, or notes.

**Request body** (all fields optional):
```json
{
  "name": "Stripe Inc",
  "rank": 2,
  "notes": "Great benefits"
}
```

**Validation**:
- `name`: optional string, 1–255 chars; if provided, normalized and checked for uniqueness (excluding this record)
- `rank`: optional integer ≥ 1 or null
- `notes`: optional string, max 1000 chars, or null

**Rank conflict handling**: if the requested `rank` is already taken by another company, the service shifts existing ranks to make room (same logic as existing reorder service).

**Response 200**:
```json
{ "data": { "id": "uuid", "name": "stripe inc", "rank": 2, ... } }
```

**Response 404**: not found  
**Response 409**: name conflict with another company

---

## DELETE /api/companies/[id]

Delete a company. Blocked if referenced by any applications or connections.

**Response 204**: deleted successfully (no body)

**Response 409** (blocked — references exist):
```json
{
  "error": {
    "code": "REFERENCE_CONFLICT",
    "message": "This company cannot be deleted because it is referenced by 2 application(s) and 1 connection(s). Remove or reassign those records first.",
    "details": {
      "applicationCount": 2,
      "connectionCount": 1
    }
  }
}
```

**Response 404**: not found

---

## POST /api/companies/reorder

Bulk reorder ranked companies. Accepts an ordered array of company IDs; their positions in the array become their new ranks (1-based). Only affects currently-ranked companies included in the array.

**Request body**:
```json
{ "orderedIds": ["uuid-1", "uuid-2", "uuid-3"] }
```

**Validation**:
- `orderedIds`: required array of UUIDs; all IDs must belong to the current user

**Response 200**:
```json
{ "data": { "success": true } }
```

**Response 400**: validation error or ID ownership check failed
