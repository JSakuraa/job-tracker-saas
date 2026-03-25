# Research: Gamified Job Application Tracker

**Branch**: `001-gamified-job-tracker` | **Date**: 2025-03-25
**Purpose**: Document technology decisions, best practices, and architectural patterns

## Technology Stack Decisions

### 1. Next.js 14 with App Router

**Decision**: Use Next.js 14 with App Router for the full-stack application framework.

**Rationale**:
- App Router provides React Server Components for optimal performance
- Built-in API routes eliminate need for separate backend
- File-based routing simplifies page organization
- Server Actions reduce boilerplate for form handling
- Excellent TypeScript support out of the box
- Vercel deployment optimized (but not required)

**Alternatives Considered**:
- Remix: Strong forms but smaller ecosystem
- SvelteKit: Learning curve for team, less React ecosystem access
- Separate React SPA + Express: More complexity, worse initial load

**Best Practices**:
- Use Server Components by default, Client Components only when needed
- Leverage `loading.tsx` and `error.tsx` for automatic loading/error states
- Use Route Groups `(folder)` to organize without affecting URL
- Implement ISR (Incremental Static Regeneration) for semi-static content

### 2. Neon PostgreSQL

**Decision**: Use Neon as the serverless PostgreSQL provider.

**Rationale**:
- Serverless scaling matches Next.js serverless model
- Branching feature useful for development/staging
- PostgreSQL compatibility ensures standard SQL features
- Connection pooling built-in (Neon Proxy)
- Cost-effective for variable traffic patterns

**Alternatives Considered**:
- Supabase: More features but overkill for this use case
- PlanetScale: MySQL, not PostgreSQL
- Railway PostgreSQL: Less serverless optimization

**Best Practices**:
- Use connection pooling mode for serverless (Neon's default)
- Keep connections short-lived in API routes
- Use database branching for PR previews
- Set appropriate connection limits for serverless

### 3. Drizzle ORM

**Decision**: Use Drizzle ORM for database access and migrations.

**Rationale**:
- TypeScript-first with excellent type inference
- SQL-like syntax reduces abstraction overhead
- Lightweight compared to Prisma (smaller bundle)
- Great performance with prepared statements
- Easy migration workflow

**Alternatives Considered**:
- Prisma: Heavier bundle, more abstraction
- Kysely: Lower-level, more manual typing
- Raw SQL: No type safety, more error-prone

**Best Practices**:
- Define schema in single `schema.ts` file
- Use relations for type-safe joins
- Generate migrations with `drizzle-kit generate`
- Use `drizzle-kit push` for development iteration
- Never use `any` in query results

### 4. Azure Blob Storage

**Decision**: Use Azure Blob Storage for resume file uploads with SAS tokens.

**Rationale**:
- Specified in requirements for file storage
- SAS (Shared Access Signature) tokens provide secure, time-limited access
- CDN integration for fast downloads
- Cost-effective for large files
- Supports direct browser uploads

**Alternatives Considered**:
- AWS S3: Equal capability but Azure specified
- Cloudflare R2: Cheaper egress but less feature-rich

**Best Practices**:
- Generate short-lived SAS tokens (1 hour max for downloads)
- Use upload SAS tokens for direct browser uploads (bypass server)
- Store blob URLs/keys in database, not full SAS URLs
- Implement virus scanning on upload (Azure Defender or custom)
- Set appropriate CORS for direct uploads
- Use container-level access policies

### 5. NextAuth.js (Auth.js)

**Decision**: Use NextAuth.js v5 for authentication.

**Rationale**:
- First-party Next.js integration
- Supports email/password (Credentials provider)
- Easy to add OAuth providers later
- Session management built-in
- Database adapter for Drizzle available

**Alternatives Considered**:
- Clerk: More features but added cost
- Lucia: More manual setup required
- Custom JWT: Security risks, maintenance burden

**Best Practices**:
- Use database sessions (not JWT) for better security
- Implement Drizzle adapter for session storage
- Hash passwords with bcrypt (cost factor 12)
- Add rate limiting on auth endpoints
- Implement account recovery flow

### 6. Testing Stack

**Decision**: Vitest for unit/integration, Playwright for e2e, Testing Library for components.

**Rationale**:
- Vitest: Fast, Vite-compatible, Jest-like API
- Playwright: Cross-browser, reliable, great DX
- Testing Library: Encourages accessible queries

**Best Practices**:
- Run Vitest in watch mode during development
- Use Playwright's test generator for initial e2e tests
- Test user interactions, not implementation details
- Use MSW for API mocking in integration tests
- Maintain test database separate from development

### 7. 8-bit Retro CSS Design System

**Decision**: Custom CSS design system with retro 8-bit aesthetic, supporting light/dark modes.

**Rationale**:
- Unique visual identity supporting gamification theme
- CSS custom properties for theming
- No external UI library dependencies
- Full control over pixel-perfect retro styling

**Design Tokens**:
```css
/* Core 8-bit palette */
--color-primary: #00ff00;      /* Retro green */
--color-secondary: #ff00ff;    /* Magenta */
--color-accent: #ffff00;       /* Yellow */
--color-danger: #ff0000;       /* Red */
--color-success: #00ff00;      /* Green */

/* Typography */
--font-family-pixel: 'Press Start 2P', monospace;
--font-family-body: 'VT323', monospace;

/* Borders - pixel-perfect */
--border-width: 4px;
--border-style: solid;

/* Shadows - no blur for 8-bit look */
--shadow-offset: 4px;
```

**Best Practices**:
- Use CSS modules for component isolation
- Define all colors as custom properties for theming
- Use `prefers-color-scheme` media query as default
- Store user preference in localStorage
- Sync theme preference with user profile in database
- Ensure WCAG 2.1 AA contrast ratios despite retro palette

## Architectural Patterns

### XP and Leveling System

**Pattern**: Event-driven XP awards with calculated levels.

**Implementation**:
```typescript
// XP values by action type
const XP_AWARDS = {
  APPLICATION_CREATED: 25,
  STATUS_UPDATED: 10,
  RESUME_UPLOADED: 15,
  QUEST_COMPLETED: 50,  // Base, actual from quest
  GOAL_ACHIEVED: 30,
  LOGIN_STREAK_DAY: 5,
  PROFILE_COMPLETED: 20,
} as const;

// Level thresholds (exponential)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  // ... continues exponentially
];
```

**Best Practices**:
- Award XP atomically with the action (same transaction)
- Calculate level from XP (don't store separately)
- Emit events for UI notifications
- Log all XP changes for audit/debugging

### Quest System

**Pattern**: Template-based quests with progress tracking.

**Quest Types**:
- **One-time**: Complete once, never repeats (e.g., "Create first application")
- **Daily**: Resets daily (e.g., "Log in today")
- **Weekly**: Resets weekly (e.g., "Apply to 5 jobs this week")
- **Achievement**: Milestone-based (e.g., "Reach 100 total applications")

**Best Practices**:
- Store quest templates separately from user progress
- Use cron/scheduled function for daily/weekly resets
- Track progress as JSON for flexible conditions
- Support multiple completion conditions (AND/OR logic)

### Account Deletion with Grace Period

**Pattern**: Soft delete with scheduled hard delete.

**Implementation**:
1. User requests deletion → `deleted_at` timestamp set
2. Account marked inactive, user logged out
3. Grace period: 30 days to recover
4. Scheduled job: Hard delete after grace period expires
5. Hard delete: Remove all user data, delete blobs, anonymize logs

**Best Practices**:
- Clear all sessions immediately on soft delete
- Send confirmation email with recovery link
- Block new logins during grace period
- Run hard delete job daily, batch process
- Keep audit log of deletion (anonymized)

## Security Considerations

### Authentication Security
- Password hashing: bcrypt with cost 12
- Session tokens: Secure, HttpOnly, SameSite=Strict cookies
- CSRF protection: Built into NextAuth.js
- Rate limiting: 5 attempts per minute on login

### File Upload Security
- Validate MIME types server-side
- Limit file size (10MB)
- Generate random blob names (UUID)
- Scan for malware before allowing download
- SAS tokens expire in 1 hour

### Data Protection
- All database connections over TLS
- Environment variables for secrets
- No sensitive data in client bundles
- User data isolated by user_id in all queries

## Performance Optimizations

### Database
- Index all foreign keys
- Composite indexes for common query patterns
- Use `select` to limit returned columns
- Pagination with cursor-based approach

### Frontend
- React Server Components by default
- Dynamic imports for heavy components
- Image optimization with next/image
- Font subsetting for pixel fonts

### Caching
- Static pages with ISR where applicable
- API response caching with appropriate headers
- Client-side SWR for real-time data

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| How to handle file storage? | Azure Blob Storage with SAS tokens (from clarification) |
| What actions grant XP? | Comprehensive: apps, status, quests, goals, resumes, streaks, profile (from clarification) |
| Account deletion behavior? | 30-day grace period then hard delete (from clarification) |
