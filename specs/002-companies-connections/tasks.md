# Tasks: Companies and Connections Management

**Input**: Design documents from `/specs/002-companies-connections/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, research.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no shared dependencies)
- **[Story]**: Maps task to a specific user story for traceability
- All file paths are relative to the repository root

---

## Phase 1: Setup (New Source Directories)

**Purpose**: Create the directory scaffolding for new components and pages before any implementation begins.

- [x] T001 Create new source directories: `src/components/companies/`, `src/components/connections/`, `src/app/(dashboard)/companies/`, `src/app/(dashboard)/connections/`, `src/app/api/companies/search/`, `src/app/api/companies/reorder/`, `src/app/api/companies/[id]/`, `src/app/api/connections/[id]/status/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes, migrations, type definitions, and routing configuration that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Update `src/lib/db/schema.ts` — add `companySource` pgEnum (`application | companies_tab | contact`), add `relationshipType` pgEnum (`established_connection | cold_outreach`), add `companies` table (id, userId FK→users, name varchar(255) NOT NULL, rank integer nullable, notes text nullable, source companySource NOT NULL, createdAt, updatedAt; unique on userId+name, indexes on userId+rank and userId+name), add nullable `companyId` column referencing `companies.id` ON DELETE SET NULL to `jobApplications` table, add `connections` table (id, userId FK→users, fullName varchar(255) NOT NULL, email varchar(255) nullable, linkedinUrl varchar(500) nullable, phoneNumber varchar(50) nullable, companyId uuid nullable FK→companies ON DELETE SET NULL, relationshipType NOT NULL, notes text nullable, createdAt, updatedAt; indexes on userId, userId+relationshipType, companyId), remove `rankedEmployers` table definition, update all Drizzle relations (usersRelations adds companies+connections, jobApplicationsRelations adds company one-relation, add companiesRelations and connectionsRelations)
- [ ] T003 Run `npm run db:generate` to generate migration files for M001 (create companies + backfill from ranked_employers + drop ranked_employers) and M002 (add company_id FK to job_applications + backfill by matching lower(trim(company_name)) to companies.name + create connections table); review generated SQL to confirm backfill logic is correct
- [ ] T004 Run `npm run db:push` to apply migrations; verify via `npm run db:studio` that: `companies` table exists and contains data from former `ranked_employers`, `ranked_employers` table is gone, `job_applications` has `company_id` column, `connections` table exists
- [x] T005 [P] Update `src/types/entities.ts` — add `Company`, `NewCompany`, `CompanySource`, `Connection`, `NewConnection`, `RelationshipType` types inferred from new schema tables; add composite types `CompanyWithCounts` (Company & `{ applicationCount: number; connectionCount: number }`) and `ConnectionWithCompany` (Connection & `{ company: Pick<Company, 'id' | 'name'> | null }`); mark `RankedEmployer` and `NewRankedEmployer` as deprecated with a comment
- [x] T006 [P] Add a permanent (308) redirect from `/rankings` to `/companies` in `next.config.ts` inside the `redirects()` array; also add a redirect from `/api/rankings` to `/api/companies` for any in-flight API calls

**Checkpoint**: Schema applied, types updated, routing redirect in place — user story implementation can begin.

---

## Phase 3: User Story 1 — Unified Company Database (Priority: P1) 🎯 MVP

**Goal**: Establish the shared company service and API so all entry points write to and read from one company store per user.

**Independent Test**: Create an application with a new company name → navigate to `/api/companies` (authenticated) → confirm the new company appears with `rank: null` and `source: "application"`.

- [x] T007 [US1] Create `src/lib/services/companies.ts` — implement the following functions using the `companies` table (normalize all name inputs with `name.toLowerCase().trim()` before any query): `getCompanies(userId)` returns all companies with applicationCount + connectionCount, ranked first by rank ASC then unranked by name ASC; `getCompanyById(id, userId)` returns single company with counts or null; `searchCompanies(userId, query)` returns up to 10 matches where name starts with or contains the normalized query, ranked companies first; `createOrGetCompany(userId, name, source)` — find by normalized name first and return if exists, else insert new unranked company; `updateCompany(id, userId, input)` — updates name (normalize + check uniqueness), rank (shift other ranks as needed using port of reorderRanking logic from `src/lib/services/rankings.ts`), notes; `getCompanyReferenceCount(companyId)` returns `{ applicationCount, connectionCount }`; `deleteCompany(id, userId)` — calls getCompanyReferenceCount first, throws `REFERENCE_CONFLICT` error if either count > 0 (include counts in error), else deletes; `bulkReorderCompanies(userId, orderedIds)` — port of `bulkReorderRankings` from rankings.ts adapted for companies table
- [x] T008 [P] [US1] Create `src/app/api/companies/route.ts` — GET handler calls `getCompanies(userId)` and returns `{ data: companies }`; POST handler validates body with Zod (`name` required string 1–255, `rank` optional integer or null, `notes` optional string max 1000 or null, `source` required enum), calls `createOrGetCompany`, returns 201 if created or 200 if already existed (check by comparing returned id to a prior lookup)
- [x] T009 [P] [US1] Create `src/app/api/companies/search/route.ts` — GET handler reads `q` query param (required, min 1 char; return 400 if missing), calls `searchCompanies(userId, q)`, returns `{ data: [{ id, name, rank }] }`
- [x] T010 [P] [US1] Create `src/app/api/companies/[id]/route.ts` — GET calls `getCompanyById` (404 if not found); PUT validates body with Zod (all fields optional: name, rank, notes), calls `updateCompany`, returns updated company (409 on name conflict); DELETE calls `deleteCompany` — on `REFERENCE_CONFLICT` error returns 409 with `{ error: { code: "REFERENCE_CONFLICT", message: "...", details: { applicationCount, connectionCount } } }`, on success returns 204
- [x] T011 [P] [US1] Create `src/app/api/companies/reorder/route.ts` — POST handler validates `{ orderedIds: string[] }` with Zod, calls `bulkReorderCompanies(userId, orderedIds)`, returns `{ data: { success: true } }` or 400 if validation/ownership check fails
- [x] T012 [P] [US1] Update `src/lib/services/applications.ts` — in the application create function, after validating input, call `createOrGetCompany(userId, companyName, 'application')` to get or create the company entity, then include `companyId: company.id` when inserting the new job application row; keep writing `companyName` (existing field) unchanged for backwards compatibility; do the same in the application update function when `companyName` changes

**Checkpoint**: US1 complete — the shared company database is live. The `/api/companies` endpoints work, new applications auto-create companies, and all company data is unified.

---

## Phase 4: User Story 2 — Company Autofill in Application Creation (Priority: P2)

**Goal**: Replace the plain text company input in the application form with a live autofill component backed by the companies API.

**Independent Test**: Pre-populate one company via POST `/api/companies`. Open `/applications/new`, type the first two characters of the company name → autofill dropdown should appear with a matching suggestion. Select it → field populates. Submit the application → it is linked to the existing company (no duplicate created).

- [x] T013 [US2] Create `src/components/companies/CompanyAutocomplete.tsx` — client component (`'use client'`); accepts props: `value: string`, `onChange: (value: string) => void`, `onSelect: (company: { id: string; name: string; rank: number | null }) => void`, `onCreateNew: (name: string) => void`, `placeholder?: string`, `disabled?: boolean`; internally debounces `value` changes by 250ms before fetching `GET /api/companies/search?q={value}`; renders a text input with a dropdown list of results below it; keyboard navigation: ArrowDown/ArrowUp moves highlight, Enter selects highlighted item or calls `onCreateNew(value)` if no highlight, Escape closes dropdown; when user selects an existing company calls `onSelect(company)`; when user types a value not matching any suggestion and blurs or submits calls `onCreateNew(value)`; shows a loading indicator during the debounce/fetch window; uses ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `role="listbox"` on dropdown, `role="option"` on each item); style with CSS module `CompanyAutocomplete.module.css` matching the 8-bit design system
- [x] T014 [P] [US2] Create `src/components/companies/index.ts` — barrel export for `CompanyAutocomplete` (and placeholder exports for CompanyCard, CompanyList, AddCompanyForm to be filled in Phase 6)
- [x] T015 [US2] Update `src/components/applications/ApplicationForm.tsx` — replace the existing plain text `companyName` input with `<CompanyAutocomplete>`; add `companyId` to the form state (initially empty string); on `onSelect(company)`: set `companyName = company.name` and `companyId = company.id`; on `onCreateNew(name)`: set `companyName = name` and `companyId = ''` (server will create the company on submit); ensure the form submission payload includes both `companyName` and `companyId` (companyId may be empty string, which the API treats as "create new company")

**Checkpoint**: US2 complete — the application creation form offers live company autofill. Ranked companies appear first in suggestions.

---

## Phase 5: User Story 3 — Connections Phone Book (Priority: P3)

**Goal**: Full connections CRUD with a dedicated `/connections` tab, contact cards with relationship type visual distinction, "Mark as Connected" quick action, and client-side search.

**Independent Test**: Navigate to `/connections` → add a new contact with all fields → contact appears in list. For a cold-outreach contact, "Mark as Connected" button is visible → clicking it updates the contact status without opening the edit modal. Search by name filters the list.

- [x] T016 [US3] Create `src/lib/services/connections.ts` — implement: `getConnections(userId)` returns all connections joined with company name; `getConnectionById(id, userId)` returns single connection with company or null; `createConnection(userId, input)` — if input contains `companyName` (and no `companyId`), first call `createOrGetCompany(userId, companyName, 'contact')` to resolve to a companyId; insert connection row; `updateConnection(id, userId, input)` — partial update, same companyName→companyId resolution logic; `deleteConnection(id, userId)` — no reference protection needed; `markAsConnected(id, userId)` — sets `relationshipType = 'established_connection'` and updates `updatedAt`
- [x] T017 [P] [US3] Create `src/app/api/connections/route.ts` — GET handler calls `getConnections(userId)`, returns `{ data: connections }`; POST handler validates body with Zod (`fullName` required string 1–255; `email` optional valid email max 255; `linkedinUrl` optional URL max 500; `phoneNumber` optional string max 50; `companyId` optional UUID; `companyName` optional string 1–255 (mutually exclusive with companyId); `relationshipType` required enum; `notes` optional string max 5000), calls `createConnection`, returns 201
- [x] T018 [P] [US3] Create `src/app/api/connections/[id]/route.ts` — GET calls `getConnectionById` (404 if not found or not owned); PUT validates same Zod schema as POST (all fields optional), calls `updateConnection`, returns 200; DELETE calls `deleteConnection`, returns 204
- [x] T019 [P] [US3] Create `src/app/api/connections/[id]/status/route.ts` — PATCH handler validates `{ relationshipType: 'established_connection' }` with Zod, calls `markAsConnected(id, userId)`, returns `{ data: { id, relationshipType, updatedAt } }`; return 400 if `relationshipType` is any value other than `'established_connection'`
- [x] T020 [P] [US3] Create `src/components/connections/ConnectionCard.tsx` — displays: full name, company name (if linked), relationship type badge (distinct colour/style between `established_connection` and `cold_outreach` per 8-bit design system), truncated notes preview (max ~80 chars with ellipsis if longer), contact links (email mailto, LinkedIn URL, phone tel:); shows "MARK AS CONNECTED" action button only when `relationshipType === 'cold_outreach'`; clicking "MARK AS CONNECTED" sends PATCH to `/api/connections/[id]/status` and updates local state; includes Edit and Delete actions; style with `ConnectionCard.module.css`
- [x] T021 [P] [US3] Create `src/components/connections/AddConnectionForm.tsx` — form fields: fullName (required text), email (optional), linkedinUrl (optional), phoneNumber (optional), company (optional — uses `<CompanyAutocomplete>` from `src/components/companies`), relationshipType (required select: established_connection / cold_outreach), notes (optional textarea); on submit POSTs to `/api/connections`; clears form on success; inline validation matching Zod schema; style with `AddConnectionForm.module.css`
- [x] T022 [US3] Create `src/components/connections/ConnectionList.tsx` — renders search/filter bar (controlled text input for name search + dropdown for relationship type filter); filters the passed `connections` array client-side on `fullName` and `company.name` for text search, `relationshipType` for type filter; renders a `<ConnectionCard>` for each filtered result; renders empty state message if no connections exist (first-time user) or no results match the filter; style with `ConnectionList.module.css`
- [x] T023 [P] [US3] Create `src/components/connections/index.ts` — barrel export for `ConnectionList`, `ConnectionCard`, `AddConnectionForm`
- [x] T024 [US3] Create `src/app/(dashboard)/connections/page.tsx` — async server component; calls `auth()` (redirect to `/login` if no session); calls `getConnections(session.user.id)`; renders a two-column layout: main area has `<ConnectionList connections={connections} />` and sidebar has `<AddConnectionForm />`; heading "CONNECTIONS"; create `src/app/(dashboard)/connections/page.module.css` with layout styles matching the rankings/companies page CSS pattern
- [x] T025 [US3] Update `src/components/layout/Sidebar.tsx` — add `{ label: 'CONNECTIONS', href: '/connections', icon: '>' }` to the `navItems` array, positioned after the (to-be-renamed) RANKINGS entry

**Checkpoint**: US3 complete — the Connections tab is fully functional. Users can add, view, search, and manage contacts. "Mark as Connected" quick action works.

---

## Phase 6: User Story 4 — Companies Tab: Full List and Ranking (Priority: P4)

**Goal**: Replace the existing `/rankings` page with a fully functional `/companies` page showing ranked + unranked companies, company CRUD (rename, delete), and ranking management.

**Independent Test**: Navigate to `/companies` → all companies (ranked and unranked) are visible in two sections. Click rank on an unranked company → it moves to the ranked section. Rename a company → the updated name reflects in the applications and contacts that reference it. Attempt to delete a company with linked records → blocked with a message showing the reference counts.

- [x] T026 [P] [US4] Create `src/components/companies/CompanyCard.tsx` — displays: company name, rank badge (e.g. "#1" chip) or "UNRANKED" badge, application count and connection count as small labels; includes inline rename (click-to-edit name field) with save/cancel; delete button — on click, sends DELETE to `/api/companies/[id]`, handles 409 REFERENCE_CONFLICT response by showing an inline message like "Used by 2 application(s) and 1 connection(s). Remove links first."; handles 204 success by removing the card from the list; style with `CompanyCard.module.css`
- [x] T027 [P] [US4] Create `src/components/companies/AddCompanyForm.tsx` — form with: company name field using `<CompanyAutocomplete>` (if existing company selected, show a message "Company already exists — you can rank it below" and populate rank input); rank input (optional integer, leave blank for unranked); notes field (optional textarea); on submit POSTs to `POST /api/companies`; style with `AddCompanyForm.module.css`
- [x] T028 [US4] Create `src/components/companies/CompanyList.tsx` — renders two sections: "RANKED" section showing ranked companies sorted by rank with drag handles (reuse drag-to-reorder logic from existing `src/components/rankings/RankedEmployerList.tsx`, adapted to call `POST /api/companies/reorder`); "UNRANKED" section showing unranked companies sorted alphabetically; each company rendered as a `<CompanyCard>`; handles optimistic UI for rank changes; style with `CompanyList.module.css`
- [x] T029 [US4] Create `src/app/(dashboard)/companies/page.tsx` — async server component; calls `auth()` (redirect if no session); calls `getCompanies(session.user.id)`; renders two-column layout: main area has `<CompanyList companies={companies} />`, sidebar has `<AddCompanyForm />`; heading "COMPANIES", subtitle "Rank your preferred employers. Drag to reorder."; create `src/app/(dashboard)/companies/page.module.css` (can copy structure from `src/app/(dashboard)/rankings/page.module.css`)
- [x] T030 [US4] Update `src/components/layout/Sidebar.tsx` — rename the `RANKINGS` nav item label to `COMPANIES` and its href from `/rankings` to `/companies` (the T025 CONNECTIONS entry should already be present from Phase 5)

**Checkpoint**: US4 complete — the Companies tab is the single management hub for the company database. All four user stories are now independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, lint, and cleanup across all user stories.

- [ ] T031 [P] Manually verify the `/rankings` → `/companies` permanent redirect works in the browser (open `/rankings`, confirm 308 redirect lands on `/companies`)
- [x] T032 [P] Run `npm run lint` and fix any zero-warning violations in all new and modified files
- [ ] T033 Run `npm run test` — confirm all pre-existing tests still pass (no regressions from schema changes or service layer updates)
- [ ] T034 Run through the test checklist in `specs/002-companies-connections/quickstart.md` end-to-end and confirm all items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — no dependency on US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 3 (T007 service + T008-T010 API must exist) — no dependency on US3/US4
- **Phase 5 (US3)**: Depends on Phase 3 (T007 `createOrGetCompany` must exist) and Phase 4 (T013 `CompanyAutocomplete` must exist for AddConnectionForm) — no dependency on US4
- **Phase 6 (US4)**: Depends on Phase 3 (API must be live), Phase 4 (CompanyAutocomplete must exist)
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Parallel With |
|-------|-----------|---------------|
| US1 (P1) | Phase 2 | — |
| US2 (P2) | US1 (T007, T008-T010) | US3 (after T013 is done) |
| US3 (P3) | US1 (T007), US2 (T013) | US4 |
| US4 (P4) | US1 (T007-T011), US2 (T013) | — |

### Within Each Phase

- Models/services before API routes
- API routes before components (components call the API)
- Components before pages
- Tasks marked [P] can run simultaneously once their phase's non-parallel prerequisites are done

---

## Parallel Execution Examples

### Phase 3 (US1) — after T007 service is complete

```
Parallel batch:
  T008 — /api/companies/route.ts
  T009 — /api/companies/search/route.ts
  T010 — /api/companies/[id]/route.ts
  T011 — /api/companies/reorder/route.ts
  T012 — update applications service
```

### Phase 5 (US3) — after T016 service is complete

```
Parallel batch A (API routes):
  T017 — /api/connections/route.ts
  T018 — /api/connections/[id]/route.ts
  T019 — /api/connections/[id]/status/route.ts

Parallel batch B (components, can overlap with batch A):
  T020 — ConnectionCard.tsx
  T021 — AddConnectionForm.tsx
  T023 — connections/index.ts
```

### Phase 6 (US4) — after Phase 3 API and T013 CompanyAutocomplete exist

```
Parallel batch:
  T026 — CompanyCard.tsx
  T027 — AddCompanyForm.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006) — CRITICAL BLOCKER
3. Complete Phase 3: US1 (T007–T012)
4. **STOP and VALIDATE**: Hit `/api/companies` authenticated and confirm company data exists; create an application and confirm the company auto-creates
5. Data layer is live — safe to demo or deploy behind a feature flag

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Shared company database live; validate via API
3. Phase 4 (US2) → Autofill in application form; validate in UI
4. Phase 5 (US3) → Connections tab live; validate full CRUD + quick action
5. Phase 6 (US4) → Companies tab live; validate full list, ranking, rename, delete protection
6. Phase 7 → Polish and final validation

---

## Notes

- [P] tasks share no file conflicts and have no incomplete-task dependencies — safe to run simultaneously
- Company name normalization (`toLowerCase().trim()`) must be applied consistently in **every** service function that accepts a name — this is the single most error-prone area
- Do not remove `companyName` from `jobApplications` in this PR — it is intentionally kept as a display cache
- Commit after each complete phase checkpoint
- The drag-to-reorder logic in `CompanyList.tsx` (T028) should be extracted from `src/components/rankings/RankedEmployerList.tsx` — do not rewrite it from scratch
- Total tasks: **34** | Setup: 1 | Foundational: 5 | US1: 6 | US2: 3 | US3: 10 | US4: 5 | Polish: 4
