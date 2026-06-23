# Job Tracker SaaS Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-22

## Active Technologies

- TypeScript 5.x with Node.js 20 LTS + Next.js 14 (App Router), Drizzle ORM, Azure Blob Storage SDK, NextAuth.js (001-gamified-job-tracker)
- Neon PostgreSQL (serverless) (001-gamified-job-tracker)

## Project Structure

```text
src/
├── app/                     # Next.js App Router pages
│   ├── (auth)/              # Auth routes
│   ├── (dashboard)/         # Protected dashboard routes
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # 8-bit design system components
│   ├── applications/        # Application-specific components
│   ├── resumes/             # Resume-specific components
│   ├── gamification/        # XP, level, quest components
│   ├── companies/           # Companies tab + CompanyAutocomplete (shared)
│   ├── connections/         # Connections tab components
│   └── layout/              # Navigation, sidebar
├── lib/
│   ├── db/                  # Drizzle schema and client
│   ├── storage/             # Azure Blob Storage utilities
│   ├── auth/                # NextAuth.js configuration
│   ├── xp/                  # XP calculation and leveling
│   └── utils/               # Shared utilities
├── styles/
│   ├── globals.css          # CSS reset and base styles
│   ├── tokens.css           # CSS custom properties (8-bit theme)
│   └── themes/              # Light/dark mode overrides
├── types/                   # TypeScript type definitions
└── hooks/                   # Custom React hooks

tests/
├── unit/                    # Vitest unit tests
├── integration/             # API integration tests
├── e2e/                     # Playwright e2e tests
└── fixtures/                # Test data and mocks

drizzle/                     # Drizzle config and migrations
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright e2e tests
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Apply migrations to database
npm run db:seed      # Seed initial data
npm run db:studio    # Open Drizzle Studio
```

## Code Style

TypeScript/Next.js:
- Use strict TypeScript (`strict: true`, no `any`)
- Server Components by default, Client Components when needed
- ESLint + Prettier for formatting
- Feature-based folder organization
- Drizzle ORM for type-safe database access

CSS:
- Custom 8-bit retro design system
- CSS Modules for component isolation
- CSS custom properties for theming
- Light/dark mode via `prefers-color-scheme` and user preference

## Recent Changes

- 002-companies-connections: Replaces `ranked_employers` with unified `companies` table; renames `/rankings` → `/companies`; adds `/connections` tab; introduces shared `CompanyAutocomplete` component used in applications, companies, and connections forms; adds `connections` table for professional contact tracking
- 001-gamified-job-tracker: Added TypeScript 5.x with Node.js 20 LTS + Next.js 14 (App Router), Drizzle ORM, Azure Blob Storage SDK, NextAuth.js

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
