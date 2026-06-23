# Research: Companies and Connections Management

**Branch**: `002-companies-connections` | **Date**: 2026-06-22

## Decision 1: Autofill Implementation Pattern

**Decision**: Server-side search endpoint (`GET /api/companies/search?q=...`) with client-side debounce at 250ms.

**Rationale**: Filtering server-side keeps the initial page payload small and prevents exposing the full company list to the client on every page load. A single indexed `ILIKE` query on the normalized `name` column easily meets the 300ms SC-002 requirement. The client debounces at 250ms to leave headroom for network latency.

**Alternatives considered**:
- Load all companies on mount and filter client-side — acceptable for <50 companies but degrades UX as the list grows; ruled out for scalability.
- React Query / SWR for cache management — adds a dependency not yet in the project; standard `fetch` + `useState` is sufficient.

**Implementation note**: The shared `CompanyAutocomplete` component accepts an `onSelect` and `onCreateNew` callback. When a user types a value not in the list and submits, `onCreateNew(name)` fires, which the parent form uses to create the company server-side alongside the primary record (application, connection, etc.).

---

## Decision 2: Schema Migration Approach — `rankedEmployers` → `companies`

**Decision**: Two-step Drizzle migration. M001 creates `companies` and backfills from `ranked_employers`. M002 adds `company_id` FK to `job_applications` and creates `connections`.

**Rationale**: Drizzle does not support table renames natively in the push-based migration model — a CREATE + INSERT + DROP sequence is the idiomatic approach. Splitting into two migrations makes rollback easier: M001 can be applied independently and verified before M002 touches the applications table.

**Alternatives considered**:
- Soft rename via `drizzle-kit` introspection — unreliable in Neon serverless environment; rejected.
- Single migration doing all changes — harder to debug if the applications backfill fails partway; rejected.

**Data integrity note**: The backfill in M002 uses a case-insensitive match (`lower(company_name) = companies.name`). For application rows whose `company_name` matches no existing company, a new unranked company is inserted first, then the FK is set. This guarantees 100% `company_id` coverage post-migration (not nullable after backfill, but column definition remains nullable to handle the SET NULL cascade on company delete).

---

## Decision 3: Company Name Normalization

**Decision**: Normalize to lowercase + `trim()` at the service layer before any read or write. Store the normalized form in the database.

**Rationale**: The existing `rankings.ts` service already lowercases names. Extending this to also `trim()` whitespace covers the edge case in the spec ("Google" vs " Google "). Normalization at the service layer (not the DB layer) keeps the DB schema simple and ensures all entry points (application form, Companies tab, Connections form) go through the same path.

**Alternatives considered**:
- Postgres `citext` extension — adds a DB-level dependency; overkill when service-layer normalization covers the requirement.
- Normalize to title case — would change "amazon web services" to "Amazon Web Services", introducing display inconsistency with user-entered names; rejected.

---

## Decision 4: Deletion Protection Implementation

**Decision**: In the `DELETE /api/companies/[id]` handler, run two `COUNT` queries before deletion — one against `job_applications WHERE company_id = ?` and one against `connections WHERE company_id = ?`. If either count is > 0, return HTTP 409 with a structured error body containing both counts.

**Rationale**: Keeping the check in the API handler (not a DB constraint) allows the error response to include user-friendly counts that map directly to the FR-017 requirement ("display a message indicating how many records reference that company"). A DB-level cascade restrict would return a cryptic Postgres error instead.

**Alternatives considered**:
- DB RESTRICT constraint only — returns a generic 500; bad UX; rejected.
- Single query with JOINs — slightly more complex SQL for marginal benefit; two COUNT queries are clearer and independently testable.

---

## Decision 5: `rankings` → `companies` Route Rename

**Decision**: Create new route at `src/app/(dashboard)/companies/` and add a `redirects()` entry in `next.config.ts` from `/rankings` → `/companies`. The old API routes at `/api/rankings` are deprecated but kept as 301 redirects for one release cycle.

**Rationale**: A Next.js `redirects()` config redirect is permanent (301), handles bookmarked links and any external references, and requires zero client code. The API redirects prevent breaking any in-flight client-side calls during the transition.

**Alternatives considered**:
- Rename the directory in-place — not possible in Next.js App Router; creating a new directory is the correct approach.
- Keep `/rankings` and `/companies` both live — confusing; defeats the purpose of the rename; rejected.

---

## Decision 6: "Mark as Connected" Quick Action

**Decision**: `PATCH /api/connections/[id]/status` endpoint that accepts `{ relationshipType: 'established_connection' }`. Client fires this from the contact card button without opening the edit modal.

**Rationale**: A dedicated PATCH endpoint for status change is minimal (one field update), keeps the UI fast (no full modal open/submit cycle), and is independently testable. It maps cleanly to the "Mark as Connected" button described in FR-012a.

**Alternatives considered**:
- Reuse `PUT /api/connections/[id]` with a partial body — would require the client to send the full connection object or the server to handle partial updates; PATCH is semantically correct for a partial update.

---

## Decision 7: Connections Search / Filter

**Decision**: Client-side filtering of the connections list using a controlled search input. No dedicated search endpoint.

**Rationale**: SC-005 requires finding a contact in under 10 seconds on a list of up to 200 contacts. At 200 records, client-side filtering on a pre-loaded array is instantaneous and adds no network latency. Introducing a server-side search endpoint for 200 records is over-engineering.

**Alternatives considered**:
- Server-side search endpoint — appropriate at >1000 records; deferred as a future optimization.
