# Quickstart: Companies and Connections Management

**Branch**: `002-companies-connections`

This guide orients a developer picking up this feature from scratch.

---

## What This Feature Does

1. **Replaces `ranked_employers` with `companies`** — a unified, per-user company store shared by applications, the Companies tab, and connections.
2. **Renames `/rankings` → `/companies`** — the tab now shows all companies (ranked + unranked) and is the management hub for company CRUD.
3. **Adds `/connections`** — a new phone book tab for tracking professional contacts with autofill for the company field.
4. **Adds shared `CompanyAutocomplete` component** — used identically in the application creation form, Companies tab, and connection creation form.

---

## Files to Read First

In order:

1. `specs/002-companies-connections/spec.md` — what we're building and why
2. `specs/002-companies-connections/data-model.md` — schema changes (start here before touching `schema.ts`)
3. `specs/002-companies-connections/contracts/companies.md` — Companies API shape
4. `specs/002-companies-connections/contracts/connections.md` — Connections API shape
5. `src/lib/db/schema.ts` — existing schema to understand what changes
6. `src/lib/services/rankings.ts` — the service being replaced by `companies.ts`
7. `src/app/(dashboard)/rankings/page.tsx` — the page being renamed/expanded

---

## Key Constraints to Know

- **Company names are always stored lowercase + trimmed**. The service layer normalizes before any read or write. Never bypass the service layer for company name comparisons.
- **Rank is nullable**. Unranked companies have `rank = null`. Ranked companies use a contiguous 1-based sequence per user, enforced in the service layer (not a DB constraint). The reorder logic from `rankings.ts` is ported unchanged to `companies.ts`.
- **Deletion is blocked** when `applicationCount > 0 || connectionCount > 0`. The DELETE endpoint returns HTTP 409 with counts. Do not add a DB-level cascade restrict — the count-based error message is the required UX.
- **`company_name` stays on `job_applications`** for this release. New applications write both `company_name` (string) and `company_id` (FK). This is intentional backwards-compat; do not remove `company_name` in this PR.
- **`CompanyAutocomplete` is a shared client component**. It fires a debounced fetch to `GET /api/companies/search?q=...` (250ms debounce). It accepts two callbacks: `onSelect(company)` when an existing company is chosen and `onCreateNew(name)` when the typed value is not in the list.

---

## Implementation Order

Follow this sequence to avoid dependency issues:

1. **Schema** — update `src/lib/db/schema.ts` (add enums, `companies`, `connections`, `company_id` on applications)
2. **Migration** — run `npm run db:generate` to produce migration files; review and apply with `npm run db:push`
3. **Types** — update `src/types/entities.ts`
4. **Service: companies** — create `src/lib/services/companies.ts` (port from `rankings.ts`, extend with unranked support, search, deletion protection)
5. **Service: connections** — create `src/lib/services/connections.ts`
6. **API: companies** — create `src/app/api/companies/` routes
7. **API: connections** — create `src/app/api/connections/` routes
8. **Redirect config** — add `/rankings` → `/companies` in `next.config.ts`
9. **Component: CompanyAutocomplete** — create `src/components/companies/CompanyAutocomplete.tsx`
10. **Component: Companies tab UI** — create `src/components/companies/` (CompanyList, CompanyCard, AddCompanyForm)
11. **Page: /companies** — create `src/app/(dashboard)/companies/page.tsx`
12. **Component: update ApplicationForm** — integrate `CompanyAutocomplete` in place of the existing plain text `companyName` input
13. **Component: Connections UI** — create `src/components/connections/` (ConnectionList, ConnectionCard, AddConnectionForm)
14. **Page: /connections** — create `src/app/(dashboard)/connections/page.tsx`
15. **Sidebar** — update `Sidebar.tsx`: rename `RANKINGS` → `COMPANIES`, add `CONNECTIONS` nav item
16. **Tests** — unit tests for service layer; contract tests for all new API routes

---

## Running Locally

```bash
# Apply schema changes
npm run db:generate    # generates migration files
npm run db:push        # applies to Neon dev database

# Start dev server
npm run dev

# Verify
# 1. Navigate to /companies — should show existing ranked employers migrated over
# 2. Create a new application with a new company name — company should appear in /companies unranked
# 3. Navigate to /connections — should show empty state
# 4. Navigate to /rankings — should redirect to /companies
```

---

## Test Checklist (pre-PR)

- [ ] `npm run lint` — zero warnings
- [ ] `npm run test` — all existing + new tests pass
- [ ] `/rankings` redirects to `/companies` (301)
- [ ] All companies from existing ranked employers appear in Companies tab
- [ ] New application with unknown company auto-creates company (unranked)
- [ ] Company autofill works in application form, Companies tab, and Connections form
- [ ] Deleting a company with linked records returns 409 with counts
- [ ] Deleting a company with no linked records succeeds (204)
- [ ] "Mark as Connected" quick action updates status without opening the edit modal
- [ ] Connections search filters by name and company
- [ ] Mobile layout verified for both Companies and Connections tabs
