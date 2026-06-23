# API Contract: Connections

**Base path**: `/api/connections`  
**Auth**: All endpoints require a valid NextAuth session. Returns `401` if unauthenticated.  
**Scope**: All operations are scoped to the authenticated user's connections only.

---

## GET /api/connections

List all connections for the current user. Returns connections with their linked company name (if any).

**Query params** (all optional):
- `q`: text search string — filters by `full_name` or company name (client-side only; this param is reserved for future server-side search)
- `type`: filter by relationship type — `established_connection` or `cold_outreach`

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "linkedinUrl": "https://linkedin.com/in/janesmith",
      "phoneNumber": null,
      "companyId": "uuid",
      "company": { "id": "uuid", "name": "stripe" },
      "relationshipType": "established_connection",
      "notes": "Met at JSConf 2025",
      "createdAt": "2026-06-22T00:00:00Z",
      "updatedAt": "2026-06-22T00:00:00Z"
    }
  ]
}
```

---

## POST /api/connections

Create a new connection. If `companyName` is provided instead of `companyId`, the server looks up or creates the company automatically (normalized, scoped to the user).

**Request body**:
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "linkedinUrl": "https://linkedin.com/in/janesmith",
  "phoneNumber": null,
  "companyId": "uuid",
  "relationshipType": "established_connection",
  "notes": "Met at JSConf 2025"
}
```

Alternatively, pass `companyName` instead of `companyId` to auto-resolve:
```json
{
  "fullName": "Jane Smith",
  "companyName": "Stripe",
  "relationshipType": "cold_outreach"
}
```

**Validation**:
- `fullName`: required, string, 1–255 chars
- `email`: optional, valid email format, max 255 chars
- `linkedinUrl`: optional, valid URL, max 500 chars
- `phoneNumber`: optional, string, max 50 chars
- `companyId`: optional UUID (mutually exclusive with `companyName`; `companyId` takes precedence)
- `companyName`: optional string, 1–255 chars — triggers company lookup-or-create
- `relationshipType`: required, `"established_connection" | "cold_outreach"`
- `notes`: optional string, max 5000 chars

**Response 201**:
```json
{ "data": { "id": "uuid", "fullName": "Jane Smith", ... } }
```

**Response 400**: validation error

---

## GET /api/connections/[id]

Get a single connection.

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "linkedinUrl": "https://linkedin.com/in/janesmith",
    "phoneNumber": null,
    "companyId": "uuid",
    "company": { "id": "uuid", "name": "stripe" },
    "relationshipType": "established_connection",
    "notes": "Met at JSConf 2025",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Response 404**: not found or does not belong to user

---

## PUT /api/connections/[id]

Full update of a connection record. All fields optional; omitted fields are unchanged.

**Request body** (same shape as POST, all fields optional):
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@newcompany.com",
  "companyId": "uuid",
  "relationshipType": "established_connection",
  "notes": "Now at Stripe as a senior engineer"
}
```

**Response 200**:
```json
{ "data": { "id": "uuid", ... } }
```

**Response 404**: not found  
**Response 400**: validation error

---

## DELETE /api/connections/[id]

Delete a connection. No reference protection needed — connections are leaf nodes.

**Response 204**: deleted (no body)  
**Response 404**: not found

---

## PATCH /api/connections/[id]/status

Quick-action endpoint for "Mark as Connected". Sets `relationshipType` to `established_connection` without requiring a full PUT.

**Request body**:
```json
{ "relationshipType": "established_connection" }
```

**Validation**:
- `relationshipType`: required, must be `"established_connection"` for this endpoint (only upgrade direction is supported; use PUT to revert)

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "relationshipType": "established_connection",
    "updatedAt": "2026-06-22T00:00:00Z"
  }
}
```

**Response 404**: not found  
**Response 400**: validation error
