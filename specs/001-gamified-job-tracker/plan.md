# Implementation Plan: Gamified Job Application Tracker

**Branch**: `001-gamified-job-tracker` | **Date**: 2025-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-gamified-job-tracker/spec.md`

## Summary

Build a gamified web application for job seekers to track applications, manage resumes, and stay motivated through XP, levels, quests, and rewards. The application uses Next.js with TypeScript, Neon PostgreSQL with Drizzle ORM, and Azure Blob Storage for resume files. The UI features a custom retro 8-bit aesthetic with light/dark mode support.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20 LTS
**Primary Dependencies**: Next.js 14 (App Router), Drizzle ORM, Azure Blob Storage SDK, NextAuth.js
**Storage**: Neon PostgreSQL (serverless), Azure Blob Storage (resumes)
**Testing**: Vitest (unit), Playwright (e2e), Testing Library (components)
**Target Platform**: Web browsers (desktop, tablet, mobile responsive)
**Project Type**: Full-stack web application (Next.js monolith)
**Performance Goals**: <200ms API response p95, <3s initial page load, 10k concurrent users
**Constraints**: <250KB gzipped per route chunk, WCAG 2.1 AA compliance, 10MB max resume upload
**Scale/Scope**: 10,000 users, ~15 pages/routes, 10 database tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Standards

| Requirement | Plan Compliance |
|-------------|-----------------|
| Readability & naming | TypeScript with strict mode; ESLint + Prettier enforced |
| Single Responsibility | Feature-based folder structure; services separated from UI |
| DRY Compliance | Shared utilities in `/lib`; abstraction after 3 occurrences |
| Type Safety | `strict: true` in tsconfig; no `any` types allowed |
| Error Handling | Global error boundary; API error responses standardized |
| Linting & Formatting | ESLint, Prettier, TypeScript strict mode in CI |

**Status**: ✅ PASS

### II. Testing Standards

| Requirement | Plan Compliance |
|-------------|-----------------|
| Test-First Development | Tests written before implementation per task list |
| Coverage Requirements | Business logic 80%+ unit coverage; critical paths have e2e |
| Test Independence | Each test isolated with test database reset |
| Test Clarity | `describe`/`it` naming with arrange-act-assert |
| Contract Testing | API routes tested against OpenAPI schema |
| No Flaky Tests | Deterministic seeds; no timing dependencies |

**Status**: ✅ PASS

### III. User Experience Consistency

| Requirement | Plan Compliance |
|-------------|-----------------|
| Design System | Custom 8-bit CSS design system with tokens (approved custom style) |
| Responsive Design | Mobile-first CSS; breakpoints for tablet/desktop |
| Loading States | Skeleton loaders and spinners for async operations |
| Error Messaging | User-friendly toast notifications; technical errors logged |
| Accessibility | WCAG 2.1 AA; keyboard nav; ARIA labels; color contrast |
| Feedback Loops | Immediate visual feedback for all actions; XP animations |

**Status**: ✅ PASS (custom 8-bit styling explicitly approved per user requirements)

### IV. Performance Requirements

| Requirement | Plan Compliance |
|-------------|-----------------|
| Response Time | API routes <200ms p95; React Server Components for speed |
| Page Load | Next.js static generation where possible; <3s target |
| Bundle Size | Route-based code splitting; dynamic imports; <250KB chunks |
| Database Queries | Drizzle relations prevent N+1; indexes on foreign keys |
| Memory & CPU | Serverless functions; no long-running processes |
| Scalability | Neon auto-scaling; Azure Blob CDN; stateless API |

**Status**: ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-gamified-job-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/              # Auth routes (login, register, etc.)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── applications/    # Job application pages
│   │   ├── resumes/         # Resume management pages
│   │   ├── quests/          # Quests and goals pages
│   │   ├── rankings/        # Employer rankings page
│   │   ├── rewards/         # Rewards and customization
│   │   └── profile/         # User profile and settings
│   ├── api/                 # API routes
│   │   ├── applications/
│   │   ├── resumes/
│   │   ├── quests/
│   │   ├── goals/
│   │   ├── rankings/
│   │   ├── rewards/
│   │   ├── user/
│   │   └── auth/
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # 8-bit design system components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── ProgressBar/
│   │   └── Badge/
│   ├── applications/        # Application-specific components
│   ├── resumes/             # Resume-specific components
│   ├── gamification/        # XP, level, quest components
│   └── layout/              # Navigation, sidebar, etc.
├── lib/
│   ├── db/                  # Drizzle schema and client
│   │   ├── schema.ts        # All table definitions
│   │   ├── client.ts        # Database connection
│   │   └── migrations/      # Drizzle migrations
│   ├── storage/             # Azure Blob Storage utilities
│   ├── auth/                # NextAuth.js configuration
│   ├── xp/                  # XP calculation and leveling logic
│   └── utils/               # Shared utilities
├── styles/
│   ├── globals.css          # CSS reset and base styles
│   ├── tokens.css           # CSS custom properties (8-bit theme)
│   ├── components/          # Component-specific CSS modules
│   └── themes/
│       ├── light.css        # Light mode overrides
│       └── dark.css         # Dark mode overrides
├── types/                   # TypeScript type definitions
└── hooks/                   # Custom React hooks

tests/
├── unit/                    # Vitest unit tests
├── integration/             # API integration tests
├── e2e/                     # Playwright end-to-end tests
└── fixtures/                # Test data and mocks

drizzle/                     # Drizzle config and migrations output
├── drizzle.config.ts
└── migrations/
```

**Structure Decision**: Next.js App Router monolith with colocated API routes. Feature-based organization under `app/(dashboard)/` for protected routes. Shared UI components in `components/ui/` implementing the 8-bit design system. Database schema centralized in `lib/db/schema.ts` using Drizzle ORM.

## Complexity Tracking

> No constitution violations requiring justification. The custom 8-bit CSS design system is explicitly approved per user requirements (overrides Design System Compliance with documented approval).

| Deviation | Why Needed | Alternative Rejected Because |
|-----------|------------|------------------------------|
| Custom 8-bit CSS instead of standard design system | User requirement for retro aesthetic with gamification theme | Standard design systems don't support the desired visual identity |
