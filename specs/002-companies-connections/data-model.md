# Data Model: Companies and Connections Management

**Branch**: `002-companies-connections` | **Date**: 2026-06-22

## Overview of Changes

| Change | Type | Replaces / Extends |
|--------|------|--------------------|
| `companies` table | NEW | Replaces `ranked_employers` |
| `connections` table | NEW | — |
| `job_applications.company_id` column | ADDED | Joins to `companies` |
| `company_source` enum | NEW | — |
| `relationship_type` enum | NEW | — |

---

## New Enum: `company_source`

```ts
export const companySource = pgEnum('company_source', [
  'application',    // auto-created when user submits an application
  'companies_tab',  // created directly in the Companies tab (formerly rankings)
  'contact',        // created when user adds a connection with a new company name
]);
```

---

## New Enum: `relationship_type`

```ts
export const relationshipType = pgEnum('relationship_type', [
  'established_connection',
  'cold_outreach',
]);
```

---

## New Table: `companies` (replaces `ranked_employers`)

```ts
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),   // stored lowercase + trimmed
    rank: integer('rank'),                               // null = unranked
    notes: text('notes'),                                // legacy from ranked_employers; optional
    source: companySource('source').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique company name per user (case-insensitive enforced at service layer)
    unique('companies_user_id_name_unique').on(table.userId, table.name),
    // Unique rank per user for ranked companies (partial — NULL ranks are not unique-constrained)
    // Enforced in service layer: check for rank conflict before insert/update
    index('companies_user_id_rank_idx').on(table.userId, table.rank),
    index('companies_user_id_name_idx').on(table.userId, table.name),
  ]
);
```

**Notes**:
- `rank` is nullable; unranked companies have `rank = null`. Ranked companies use a contiguous 1-based integer sequence per user (same logic as existing `ranked_employers`).
- The partial unique constraint on `(userId, rank)` cannot be expressed with a standard Drizzle `unique()` — it is enforced at the service layer via a pre-check before any rank assignment or change.
- `notes` is preserved from `ranked_employers` for data continuity; it is not surfaced prominently in the new UI but remains editable in the Companies tab detail view.

---

## Updated Table: `job_applications`

Added column:

```ts
companyId: uuid('company_id')
  .references(() => companies.id, { onDelete: 'set null' }),
```

- Nullable: existing rows are backfilled by migration; new rows always have `company_id` set.
- `ON DELETE SET NULL`: if a company is deleted (only possible when reference count drops to zero via manual unlinking), the application loses its FK but retains `company_name` as a display fallback.
- `company_name` column is **retained** for this release as a denormalized display cache and backwards-compat safety net. It continues to be written on every application create/update.

---

## New Table: `connections`

```ts
export const connections = pgTable(
  'connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    linkedinUrl: varchar('linkedin_url', { length: 500 }),
    phoneNumber: varchar('phone_number', { length: 50 }),

    companyId: uuid('company_id')
      .references(() => companies.id, { onDelete: 'set null' }),

    relationshipType: relationshipType('relationship_type').notNull(),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('connections_user_id_idx').on(table.userId),
    index('connections_user_id_relationship_type_idx').on(table.userId, table.relationshipType),
    index('connections_company_id_idx').on(table.companyId),
  ]
);
```

---

## Updated Relations

```ts
// Add to usersRelations:
companies: many(companies),
connections: many(connections),

// Add to jobApplicationsRelations:
company: one(companies, {
  fields: [jobApplications.companyId],
  references: [companies.id],
}),

// New relations:
export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, { fields: [companies.userId], references: [users.id] }),
  applications: many(jobApplications),
  connections: many(connections),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, { fields: [connections.userId], references: [users.id] }),
  company: one(companies, { fields: [connections.companyId], references: [companies.id] }),
}));
```

---

## Updated `entities.ts` Types

```ts
// New types (inferred from schema):
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;
export type CompanySource = Company['source'];

export type Connection = InferSelectModel<typeof connections>;
export type NewConnection = InferInsertModel<typeof connections>;
export type RelationshipType = Connection['relationshipType'];

// Deprecated (kept for migration period):
// RankedEmployer — will be removed once ranked_employers table is dropped

// New composite types:
export type CompanyWithCounts = Company & {
  applicationCount: number;
  connectionCount: number;
};

export type ConnectionWithCompany = Connection & {
  company: Pick<Company, 'id' | 'name'> | null;
};
```

---

## Migration Files (generated by `npm run db:generate`)

### M001: `XXXX_create_companies_from_ranked_employers.sql`

1. Create `company_source` enum
2. Create `companies` table
3. `INSERT INTO companies (id, user_id, name, rank, notes, source, created_at, updated_at) SELECT id, user_id, company_name, rank, notes, 'companies_tab', created_at, updated_at FROM ranked_employers`
4. `DROP TABLE ranked_employers`

### M002: `XXXX_add_company_fk_and_connections.sql`

1. Create `relationship_type` enum
2. Add `company_id` nullable column to `job_applications`
3. Backfill: for each distinct `lower(trim(company_name))` in `job_applications`, find or create a matching company, then set `company_id`
4. Create `connections` table
5. Add new indexes

---

## Entity Relationship Summary

```
users
 ├── companies (1:many, per-user)
 │    ├── job_applications (1:many via company_id, nullable)
 │    └── connections (1:many via company_id, nullable)
 ├── job_applications (1:many)
 └── connections (1:many)
```
