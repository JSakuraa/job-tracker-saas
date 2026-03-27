# Tasks: Gamified Job Application Tracker

**Input**: Design documents from `/specs/001-gamified-job-tracker/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: Tests follow constitution's Test-First Development requirement. Write tests before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `src/app/` for pages and API routes
- **Components**: `src/components/`
- **Library code**: `src/lib/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14 project with TypeScript, App Router, and ESLint in project root
- [X] T002 Configure TypeScript strict mode in tsconfig.json
- [X] T003 [P] Configure ESLint with Next.js rules in .eslintrc.json
- [X] T004 [P] Configure Prettier for code formatting in .prettierrc
- [X] T005 [P] Create environment variables template in .env.example
- [X] T006 Install and configure Drizzle ORM with Neon driver in drizzle.config.ts
- [X] T007 [P] Install and configure Vitest for unit testing in vitest.config.ts
- [X] T008 [P] Install and configure Playwright for e2e testing in playwright.config.ts
- [X] T009 Create project directory structure per plan.md (src/app, src/components, src/lib, tests/)

**Checkpoint**: Project scaffolding complete, ready for foundational work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T010 Create Drizzle schema for users table in src/lib/db/schema.ts
- [X] T011 Create Drizzle schema for jobApplications table in src/lib/db/schema.ts
- [X] T012 Create Drizzle schema for statusChanges table in src/lib/db/schema.ts
- [X] T013 Create Drizzle schema for resumes table in src/lib/db/schema.ts
- [X] T014 Create Drizzle schema for applicationResumes junction table in src/lib/db/schema.ts
- [X] T015 Create Drizzle schema for quests table in src/lib/db/schema.ts
- [X] T016 Create Drizzle schema for userQuests table in src/lib/db/schema.ts
- [X] T017 Create Drizzle schema for personalGoals table in src/lib/db/schema.ts
- [X] T018 Create Drizzle schema for rankedEmployers table in src/lib/db/schema.ts
- [X] T019 Create Drizzle schema for rewards table in src/lib/db/schema.ts
- [X] T020 Create Drizzle schema for userRewards table in src/lib/db/schema.ts
- [X] T021 Create Drizzle schema for xpEvents audit table in src/lib/db/schema.ts
- [X] T022 Create Drizzle relations definitions in src/lib/db/schema.ts
- [X] T023 Create database client and connection pool in src/lib/db/client.ts
- [ ] T024 Generate and run initial database migration with drizzle-kit

### Authentication

- [X] T025 Install and configure NextAuth.js v5 in src/lib/auth/config.ts
- [X] T026 Create NextAuth.js Drizzle adapter in src/lib/auth/adapter.ts
- [X] T027 Create credentials provider with bcrypt password hashing in src/lib/auth/providers.ts
- [X] T028 Create auth API routes in src/app/api/auth/[...nextauth]/route.ts
- [X] T029 Create auth middleware for protected routes in src/middleware.ts

### 8-bit Design System

- [X] T030 Create CSS custom properties and tokens in src/styles/tokens.css
- [X] T031 Create global CSS reset and base styles in src/styles/globals.css
- [X] T032 Create light theme CSS variables in src/styles/themes/light.css
- [X] T033 Create dark theme CSS variables in src/styles/themes/dark.css
- [X] T034 Create ThemeProvider context with system preference detection in src/lib/theme/provider.tsx
- [X] T035 [P] Create Button component with 8-bit styling in src/components/ui/Button/
- [X] T036 [P] Create Input component with 8-bit styling in src/components/ui/Input/
- [X] T037 [P] Create Card component with 8-bit styling in src/components/ui/Card/
- [X] T038 [P] Create Modal component with 8-bit styling in src/components/ui/Modal/
- [X] T039 [P] Create Toast notification component in src/components/ui/Toast/
- [X] T040 [P] Create ProgressBar component in src/components/ui/ProgressBar/
- [X] T041 [P] Create Badge component in src/components/ui/Badge/

### Layout & Navigation

- [X] T042 Create root layout with ThemeProvider in src/app/layout.tsx
- [X] T043 Create landing page in src/app/page.tsx
- [X] T044 Create auth layout for login/register pages in src/app/(auth)/layout.tsx
- [X] T045 [P] Create login page in src/app/(auth)/login/page.tsx
- [X] T046 [P] Create register page in src/app/(auth)/register/page.tsx
- [X] T047 Create dashboard layout with sidebar navigation in src/app/(dashboard)/layout.tsx
- [X] T048 Create sidebar navigation component in src/components/layout/Sidebar.tsx
- [X] T049 Create header component with user menu in src/components/layout/Header.tsx

### XP System Core

- [X] T050 Create XP constants and level thresholds in src/lib/xp/constants.ts
- [X] T051 Create XP calculation utilities (level from XP, XP to next level) in src/lib/xp/utils.ts
- [X] T052 Create XP award service with event logging in src/lib/xp/service.ts

### Azure Blob Storage

- [X] T053 Install Azure Blob Storage SDK and configure client in src/lib/storage/client.ts
- [X] T054 Create SAS token generation utilities in src/lib/storage/sas.ts
- [X] T055 Create file upload/download helpers in src/lib/storage/helpers.ts

### Shared Types

- [X] T056 Create TypeScript types for all entities in src/types/entities.ts
- [X] T057 Create TypeScript types for API responses in src/types/api.ts
- [X] T058 Create validation schemas with Zod in src/lib/validations/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Track Job Applications (Priority: P1) 🎯 MVP

**Goal**: Allow users to create, view, edit, and track job applications with status history

**Independent Test**: Create a job application, update its status, verify status history is recorded

### Tests for User Story 1

- [ ] T059 [P] [US1] Unit test for application service in tests/unit/services/applications.test.ts
- [ ] T060 [P] [US1] Integration test for applications API in tests/integration/api/applications.test.ts
- [ ] T061 [P] [US1] E2E test for application creation flow in tests/e2e/applications.spec.ts

### Implementation for User Story 1

- [X] T062 [US1] Create applications service with CRUD operations in src/lib/services/applications.ts
- [X] T063 [US1] Create status change service with history tracking in src/lib/services/statusChanges.ts
- [X] T064 [US1] Create GET /api/applications route in src/app/api/applications/route.ts
- [X] T065 [US1] Create POST /api/applications route in src/app/api/applications/route.ts
- [X] T066 [US1] Create GET /api/applications/[id] route in src/app/api/applications/[id]/route.ts
- [X] T067 [US1] Create PATCH /api/applications/[id] route in src/app/api/applications/[id]/route.ts
- [X] T068 [US1] Create DELETE /api/applications/[id] route in src/app/api/applications/[id]/route.ts
- [X] T069 [US1] Create PATCH /api/applications/[id]/status route in src/app/api/applications/[id]/status/route.ts
- [X] T070 [US1] Create GET /api/applications/[id]/history route in src/app/api/applications/[id]/history/route.ts
- [X] T071 [US1] Integrate XP award on application creation in applications service
- [X] T072 [US1] Integrate XP award on status update in statusChanges service
- [X] T073 [P] [US1] Create ApplicationCard component in src/components/applications/ApplicationCard.tsx
- [X] T074 [P] [US1] Create ApplicationList component in src/components/applications/ApplicationList.tsx
- [X] T075 [P] [US1] Create ApplicationForm component in src/components/applications/ApplicationForm.tsx
- [X] T076 [P] [US1] Create ApplicationDetail component in src/components/applications/ApplicationDetail.tsx
- [X] T077 [P] [US1] Create StatusTimeline component in src/components/applications/StatusTimeline.tsx
- [X] T078 [US1] Create applications list page in src/app/(dashboard)/applications/page.tsx
- [X] T079 [US1] Create application detail page in src/app/(dashboard)/applications/[id]/page.tsx
- [X] T080 [US1] Create new application page in src/app/(dashboard)/applications/new/page.tsx
- [X] T081 [US1] Add search and filter functionality to applications list

**Checkpoint**: User Story 1 complete - users can track job applications with full status history

---

## Phase 4: User Story 2 - Manage Resumes (Priority: P2)

**Goal**: Allow users to upload resumes and attach them to job applications

**Independent Test**: Upload a resume, attach it to an application, download it

### Tests for User Story 2

- [ ] T082 [P] [US2] Unit test for resume service in tests/unit/services/resumes.test.ts
- [ ] T083 [P] [US2] Integration test for resumes API in tests/integration/api/resumes.test.ts
- [ ] T084 [P] [US2] E2E test for resume upload flow in tests/e2e/resumes.spec.ts

### Implementation for User Story 2

- [X] T085 [US2] Create resumes service with CRUD and blob operations in src/lib/services/resumes.ts
- [X] T086 [US2] Create POST /api/resumes/upload-url route in src/app/api/resumes/upload-url/route.ts
- [X] T087 [US2] Create POST /api/resumes route (register upload) in src/app/api/resumes/route.ts
- [X] T088 [US2] Create GET /api/resumes route in src/app/api/resumes/route.ts
- [X] T089 [US2] Create GET /api/resumes/[id] route in src/app/api/resumes/[id]/route.ts
- [X] T090 [US2] Create GET /api/resumes/[id]/download route in src/app/api/resumes/[id]/download/route.ts
- [X] T091 [US2] Create DELETE /api/resumes/[id] route in src/app/api/resumes/[id]/route.ts
- [X] T092 [US2] Create POST /api/applications/[id]/resumes route in src/app/api/applications/[id]/resumes/route.ts
- [X] T093 [US2] Create DELETE /api/applications/[id]/resumes/[resumeId] route in src/app/api/applications/[id]/resumes/[resumeId]/route.ts
- [X] T094 [US2] Integrate XP award on resume upload in resumes service
- [X] T095 [P] [US2] Create ResumeUploader component with drag-drop in src/components/resumes/ResumeUploader.tsx
- [X] T096 [P] [US2] Create ResumeCard component in src/components/resumes/ResumeCard.tsx
- [X] T097 [P] [US2] Create ResumeList component in src/components/resumes/ResumeList.tsx
- [X] T098 [P] [US2] Create ResumePicker modal for attaching to applications in src/components/resumes/ResumePicker.tsx
- [X] T099 [US2] Create resumes library page in src/app/(dashboard)/resumes/page.tsx
- [X] T100 [US2] Integrate ResumePicker into ApplicationForm and ApplicationDetail

**Checkpoint**: User Story 2 complete - users can manage resumes and attach to applications

---

## Phase 5: User Story 3 - Earn XP and Level Up (Priority: P3)

**Goal**: Display XP, levels, and celebrate level-ups with notifications

**Independent Test**: Perform actions, verify XP increases and level-up triggers celebration

### Tests for User Story 3

- [ ] T101 [P] [US3] Unit test for XP/level calculations in tests/unit/lib/xp.test.ts
- [ ] T102 [P] [US3] Integration test for user stats API in tests/integration/api/user-stats.test.ts

### Implementation for User Story 3

- [X] T103 [US3] Create GET /api/user/stats route in src/app/api/user/stats/route.ts
- [X] T104 [US3] Create GET /api/user/xp-history route in src/app/api/user/xp-history/route.ts
- [X] T105 [US3] Add level-up detection to XP award service
- [X] T106 [P] [US3] Create XPDisplay component showing current XP/level in src/components/gamification/XPDisplay.tsx
- [X] T107 [P] [US3] Create LevelProgressBar component in src/components/gamification/LevelProgressBar.tsx
- [X] T108 [P] [US3] Create LevelUpCelebration modal with 8-bit animation in src/components/gamification/LevelUpCelebration.tsx
- [X] T109 [P] [US3] Create XPNotification toast component in src/components/gamification/XPNotification.tsx
- [X] T110 [US3] Add XPDisplay to dashboard header/sidebar
- [X] T111 [US3] Create profile page with XP history in src/app/(dashboard)/profile/page.tsx
- [ ] T112 [US3] Implement login streak tracking and XP award

**Checkpoint**: User Story 3 complete - users see XP, levels, and celebrations

---

## Phase 6: User Story 4 - Complete Quests (Priority: P4)

**Goal**: Display quests, track progress automatically, allow reward claiming

**Independent Test**: View quests, complete requirements, claim rewards

### Tests for User Story 4

- [ ] T113 [P] [US4] Unit test for quest service in tests/unit/services/quests.test.ts
- [ ] T114 [P] [US4] Integration test for quests API in tests/integration/api/quests.test.ts

### Implementation for User Story 4

- [X] T115 [US4] Create quests service with progress tracking in src/lib/services/quests.ts
- [X] T116 [US4] Create quest progress update logic triggered by user actions
- [X] T117 [US4] Create GET /api/quests route in src/app/api/quests/route.ts
- [X] T118 [US4] Create GET /api/quests/active route in src/app/api/quests/active/route.ts
- [X] T119 [US4] Create GET /api/quests/completed route in src/app/api/quests/completed/route.ts
- [X] T120 [US4] Create POST /api/quests/[id]/claim route in src/app/api/quests/[id]/claim/route.ts
- [X] T121 [P] [US4] Create QuestCard component in src/components/gamification/QuestCard.tsx
- [X] T122 [P] [US4] Create QuestList component in src/components/gamification/QuestList.tsx
- [X] T123 [P] [US4] Create QuestProgress component in src/components/gamification/QuestProgress.tsx
- [X] T124 [US4] Create quests page in src/app/(dashboard)/quests/page.tsx
- [X] T125 [US4] Create database seed script for initial quests in scripts/seed-quests.ts

**Checkpoint**: User Story 4 complete - users can complete quests and earn rewards

---

## Phase 7: User Story 5 - Personal Goals (Priority: P5)

**Goal**: Allow users to create and track personal job search goals

**Independent Test**: Create a goal, make progress, mark as achieved

### Tests for User Story 5

- [ ] T126 [P] [US5] Unit test for goals service in tests/unit/services/goals.test.ts
- [ ] T127 [P] [US5] Integration test for goals API in tests/integration/api/goals.test.ts

### Implementation for User Story 5

- [x] T128 [US5] Create goals service with progress tracking in src/lib/services/goals.ts
- [x] T129 [US5] Create goal progress update logic triggered by user actions
- [x] T130 [US5] Create GET /api/goals route in src/app/api/goals/route.ts
- [x] T131 [US5] Create POST /api/goals route in src/app/api/goals/route.ts
- [x] T132 [US5] Create GET /api/goals/[id] route in src/app/api/goals/[id]/route.ts
- [x] T133 [US5] Create PATCH /api/goals/[id] route in src/app/api/goals/[id]/route.ts
- [x] T134 [US5] Create POST /api/goals/[id]/achieve route in src/app/api/goals/[id]/achieve/route.ts
- [x] T135 [US5] Create POST /api/goals/[id]/abandon route in src/app/api/goals/[id]/abandon/route.ts
- [x] T136 [US5] Create DELETE /api/goals/[id] route in src/app/api/goals/[id]/route.ts
- [x] T137 [US5] Integrate XP award on goal achievement
- [x] T138 [P] [US5] Create GoalCard component in src/components/gamification/GoalCard.tsx
- [x] T139 [P] [US5] Create GoalForm component in src/components/gamification/GoalForm.tsx
- [x] T140 [P] [US5] Create GoalList component in src/components/gamification/GoalList.tsx
- [x] T141 [US5] Add goals section to quests page or create dedicated goals page

**Checkpoint**: User Story 5 complete - users can set and track personal goals

---

## Phase 8: User Story 6 - Rank Employers (Priority: P6)

**Goal**: Allow users to create and maintain a ranked list of preferred employers

**Independent Test**: Add companies to list, reorder them, see highlight on applications

### Tests for User Story 6

- [ ] T142 [P] [US6] Unit test for rankings service in tests/unit/services/rankings.test.ts
- [ ] T143 [P] [US6] Integration test for rankings API in tests/integration/api/rankings.test.ts

### Implementation for User Story 6

- [x] T144 [US6] Create rankings service with reorder logic in src/lib/services/rankings.ts
- [x] T145 [US6] Create GET /api/rankings route in src/app/api/rankings/route.ts
- [x] T146 [US6] Create POST /api/rankings route in src/app/api/rankings/route.ts
- [x] T147 [US6] Create PATCH /api/rankings/[id] route in src/app/api/rankings/[id]/route.ts
- [x] T148 [US6] Create DELETE /api/rankings/[id] route in src/app/api/rankings/[id]/route.ts
- [x] T149 [US6] Create PATCH /api/rankings/reorder route in src/app/api/rankings/reorder/route.ts
- [x] T150 [P] [US6] Create RankedEmployerCard component in src/components/rankings/RankedEmployerCard.tsx
- [x] T151 [P] [US6] Create RankedEmployerList with drag-drop reordering in src/components/rankings/RankedEmployerList.tsx
- [x] T152 [P] [US6] Create AddEmployerForm component in src/components/rankings/AddEmployerForm.tsx
- [x] T153 [US6] Create rankings page in src/app/(dashboard)/rankings/page.tsx
- [x] T154 [US6] Add ranked employer indicator to ApplicationCard component

**Checkpoint**: User Story 6 complete - users can maintain employer rankings

---

## Phase 9: User Story 7 - Rewards and Customization (Priority: P7)

**Goal**: Allow users to unlock and equip rewards (badges, avatars, themes)

**Independent Test**: Reach unlock threshold, view reward, equip it

### Tests for User Story 7

- [ ] T155 [P] [US7] Unit test for rewards service in tests/unit/services/rewards.test.ts
- [ ] T156 [P] [US7] Integration test for rewards API in tests/integration/api/rewards.test.ts

### Implementation for User Story 7

- [x] T157 [US7] Create rewards service with unlock logic in src/lib/services/rewards.ts
- [x] T158 [US7] Create reward unlock check triggered by level-up
- [x] T159 [US7] Create GET /api/rewards route in src/app/api/rewards/route.ts
- [x] T160 [US7] Create GET /api/rewards/unlocked route in src/app/api/rewards/unlocked/route.ts
- [x] T161 [US7] Create POST /api/rewards/[id]/equip route in src/app/api/rewards/[id]/equip/route.ts
- [x] T162 [US7] Create POST /api/rewards/[id]/unequip route in src/app/api/rewards/[id]/unequip/route.ts
- [x] T163 [P] [US7] Create RewardCard component in src/components/rewards/RewardCard.tsx
- [x] T164 [P] [US7] Create RewardGrid component in src/components/rewards/RewardGrid.tsx
- [x] T165 [P] [US7] Create AvatarSelector component in src/components/rewards/AvatarSelector.tsx
- [x] T166 [P] [US7] Create ThemeSelector component in src/components/rewards/ThemeSelector.tsx
- [x] T167 [US7] Create rewards page in src/app/(dashboard)/rewards/page.tsx
- [x] T168 [US7] Integrate equipped avatar into user profile display
- [x] T169 [US7] Integrate theme selection into ThemeProvider
- [x] T170 [US7] Create database seed script for initial rewards in scripts/seed-rewards.ts

**Checkpoint**: User Story 7 complete - users can unlock and customize their experience

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### User Account Management

- [x] T171 Create GET /api/user/profile route in src/app/api/user/profile/route.ts
- [x] T172 Create PATCH /api/user/profile route in src/app/api/user/profile/route.ts
- [x] T173 Create DELETE /api/user/account route with 30-day grace period in src/app/api/user/account/route.ts
- [x] T174 Create POST /api/user/account/recover route in src/app/api/user/account/recover/route.ts
- [x] T175 Add profile editing to profile page
- [x] T176 Add account deletion UI with confirmation

### Performance & Polish

- [x] T177 [P] Add loading skeletons for all list views
- [x] T178 [P] Add error boundaries for graceful error handling
- [ ] T179 [P] Implement optimistic updates for status changes
- [ ] T180 Add pagination to all list endpoints
- [x] T181 Add proper indexes to database schema (already defined)
- [ ] T182 Configure Next.js image optimization

### Accessibility & Responsiveness

- [ ] T183 [P] Audit and fix keyboard navigation across all pages
- [ ] T184 [P] Add ARIA labels and roles to all interactive elements
- [ ] T185 [P] Test and fix responsive layouts for mobile/tablet
- [ ] T186 [P] Verify color contrast meets WCAG 2.1 AA

### Final Validation

- [ ] T187 Run full e2e test suite
- [ ] T188 Run quickstart.md validation steps
- [ ] T189 Performance audit with Lighthouse
- [ ] T190 Security review of authentication and authorization

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if team capacity allows)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6 → P7)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 - Applications (P1) | Foundational | Phase 2 complete |
| US2 - Resumes (P2) | Foundational | Phase 2 complete |
| US3 - XP/Levels (P3) | Foundational, XP integration in US1/US2 | Phase 2 complete |
| US4 - Quests (P4) | Foundational, XP system | Phase 2 complete |
| US5 - Goals (P5) | Foundational, XP system | Phase 2 complete |
| US6 - Rankings (P6) | Foundational | Phase 2 complete |
| US7 - Rewards (P7) | Foundational, Level system (US3) | Phase 2 complete, US3 recommended |

### Within Each User Story

1. Tests written and verified to FAIL before implementation
2. Service layer before API routes
3. API routes before UI components
4. UI components before pages
5. Integration and polish last

### Parallel Opportunities

**Phase 2 (Foundational) - Many tasks can run in parallel:**
```
Parallel group 1: T010-T024 (Schema can be written in one file, but individual tables are independent)
Parallel group 2: T025-T029 (Auth setup)
Parallel group 3: T030-T041 (Design system components)
Parallel group 4: T042-T049 (Layout - some dependencies)
```

**Phase 3+ (User Stories) - All marked [P] tasks within a phase can run in parallel**

---

## Parallel Example: User Story 1

```bash
# Launch all tests together (write first, verify they fail):
- T059: Unit test for application service
- T060: Integration test for applications API
- T061: E2E test for application creation flow

# Then launch service and API routes:
- T062: Applications service (must complete first)
- T063: Status change service
- Then T064-T070: API routes (depend on services)

# Then UI components (all parallel):
- T073: ApplicationCard
- T074: ApplicationList
- T075: ApplicationForm
- T076: ApplicationDetail
- T077: StatusTimeline

# Finally pages (depend on components):
- T078: Applications list page
- T079: Application detail page
- T080: New application page
- T081: Search and filter
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Track Job Applications
4. **STOP and VALIDATE**: Test independently, ensure XP awards work
5. Deploy/demo if ready - this is a functional job tracker

### Incremental Delivery

1. MVP: Setup + Foundational + US1 (Track Applications) → Core value delivered
2. Add US2 (Resumes) → Enhanced value with resume management
3. Add US3 (XP/Levels) → Gamification becomes visible
4. Add US4 (Quests) → Structured engagement goals
5. Add US5 (Goals) → Personalized tracking
6. Add US6 (Rankings) → Employer prioritization
7. Add US7 (Rewards) → Full customization experience
8. Polish → Production-ready

### Recommended MVP Scope

**For initial release, complete through Phase 5 (US3):**
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: US1 - Track Applications
- Phase 4: US2 - Manage Resumes
- Phase 5: US3 - XP and Levels

This delivers a complete, gamified job tracker with core functionality.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- XP integration happens in US1/US2 but display is US3
- Quest/Goal progress tracking builds on action hooks from US1/US2
