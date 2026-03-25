# Data Model: Gamified Job Application Tracker

**Branch**: `001-gamified-job-tracker` | **Date**: 2025-03-25
**ORM**: Drizzle ORM with PostgreSQL (Neon)

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│      User       │────<│  JobApplication  │────<│  StatusChange   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ├──────────────────────>│
        │               ┌───────┴───────┐
        │               │               │
        v               v               v
┌─────────────────┐  ┌──────────────────┐
│     Resume      │──│ApplicationResume │ (junction)
└─────────────────┘  └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│      User       │────<│    UserQuest     │────>│      Quest      │
└─────────────────┘     └──────────────────┘     └─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│      User       │────<│   PersonalGoal   │
└─────────────────┘     └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│      User       │────<│  RankedEmployer  │
└─────────────────┘     └──────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│      User       │────<│    UserReward    │────>│     Reward      │
└─────────────────┘     └──────────────────┘     └─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│      User       │────<│     XPEvent      │ (audit log)
└─────────────────┘     └──────────────────┘
```

## Schema Definitions (Drizzle ORM)

### Users Table

```typescript
import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),

  // Gamification
  totalXp: integer('total_xp').notNull().default(0),
  loginStreakCount: integer('login_streak_count').notNull().default(0),
  lastLoginDate: timestamp('last_login_date', { withTimezone: true }),

  // Customization preferences (JSON for flexibility)
  customization: jsonb('customization').$type<{
    avatarId?: string;
    themeId?: string;
    badgeIds?: string[];
  }>().default({}),

  // Account status
  isActive: boolean('is_active').notNull().default(true),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Computed Fields** (calculated, not stored):
- `level`: Derived from `totalXp` using threshold formula
- `xpToNextLevel`: Calculated from current level thresholds

**Indexes**:
- `email` (unique, for login lookups)
- `deletedAt` (for grace period cleanup job)

### Job Applications Table

```typescript
export const applicationStatus = pgEnum('application_status', [
  'applied',
  'phone_screen',
  'technical_interview',
  'onsite',
  'offer',
  'rejected',
  'withdrawn',
  'accepted',
]);

export const jobApplications = pgTable('job_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Required fields
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  dateApplied: timestamp('date_applied', { withTimezone: true }).notNull(),

  // Optional fields
  referralName: varchar('referral_name', { length: 255 }),
  referralContact: varchar('referral_contact', { length: 255 }),
  jobDescription: text('job_description'),

  // Current status
  status: applicationStatus('status').notNull().default('applied'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Indexes**:
- `userId` (for user's applications list)
- `userId, status` (for filtered views)
- `companyName` (for employer ranking matching)

### Status Changes Table

```typescript
export const statusChanges = pgTable('status_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),

  previousStatus: applicationStatus('previous_status'),
  newStatus: applicationStatus('new_status').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Indexes**:
- `applicationId, changedAt` (for timeline display)

### Resumes Table

```typescript
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  filename: varchar('filename', { length: 255 }).notNull(),
  blobKey: varchar('blob_key', { length: 500 }).notNull(), // Azure Blob Storage key
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // bytes

  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Indexes**:
- `userId` (for user's resume library)

### Application-Resume Junction Table

```typescript
export const applicationResumes = pgTable('application_resumes', {
  applicationId: uuid('application_id').notNull().references(() => jobApplications.id, { onDelete: 'cascade' }),
  resumeId: uuid('resume_id').notNull().references(() => resumes.id, { onDelete: 'restrict' }),
  attachedAt: timestamp('attached_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.applicationId, table.resumeId] }),
}));
```

### Quests Table

```typescript
export const questType = pgEnum('quest_type', [
  'one_time',
  'daily',
  'weekly',
  'achievement',
]);

export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: questType('type').notNull(),

  // Requirements (JSON for flexible conditions)
  requirements: jsonb('requirements').$type<{
    action: string;           // e.g., 'application_created', 'status_updated'
    count: number;            // How many times
    targetStatus?: string;    // For status-based quests
    timeframe?: 'day' | 'week' | 'all_time';
  }>().notNull(),

  xpReward: integer('xp_reward').notNull(),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### User Quests Table

```typescript
export const userQuestStatus = pgEnum('user_quest_status', [
  'in_progress',
  'completed',
  'claimed',
  'expired',
]);

export const userQuests = pgTable('user_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questId: uuid('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),

  status: userQuestStatus('status').notNull().default('in_progress'),
  progress: integer('progress').notNull().default(0),

  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // For daily/weekly quests
});
```

**Indexes**:
- `userId, status` (for active quests view)
- `expiresAt` (for expiration job)

### Personal Goals Table

```typescript
export const goalStatus = pgEnum('goal_status', [
  'active',
  'achieved',
  'abandoned',
]);

export const personalGoals = pgTable('personal_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Target configuration
  targetType: varchar('target_type', { length: 50 }).notNull(), // e.g., 'applications', 'interviews'
  targetCount: integer('target_count').notNull(),
  currentCount: integer('current_count').notNull().default(0),

  deadline: timestamp('deadline', { withTimezone: true }),
  status: goalStatus('status').notNull().default('active'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  achievedAt: timestamp('achieved_at', { withTimezone: true }),
});
```

**Indexes**:
- `userId, status` (for active goals view)

### Ranked Employers Table

```typescript
export const rankedEmployers = pgTable('ranked_employers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  companyName: varchar('company_name', { length: 255 }).notNull(),
  rank: integer('rank').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueUserRank: unique().on(table.userId, table.rank),
}));
```

**Indexes**:
- `userId, rank` (unique, for ordered list)
- `userId, companyName` (for matching applications)

### Rewards Table

```typescript
export const rewardType = pgEnum('reward_type', [
  'badge',
  'avatar',
  'theme',
]);

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: rewardType('type').notNull(),

  // Visual asset reference
  assetKey: varchar('asset_key', { length: 255 }).notNull(), // CSS class or image key

  // Unlock criteria
  unlockCriteria: jsonb('unlock_criteria').$type<{
    type: 'level' | 'achievement' | 'quest';
    value: number | string; // Level number or achievement/quest ID
  }>().notNull(),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### User Rewards Table

```typescript
export const userRewards = pgTable('user_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id').notNull().references(() => rewards.id, { onDelete: 'cascade' }),

  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
  isEquipped: boolean('is_equipped').notNull().default(false), // For avatars/themes
}, (table) => ({
  uniqueUserReward: unique().on(table.userId, table.rewardId),
}));
```

**Indexes**:
- `userId, isEquipped` (for active customizations)

### XP Events Table (Audit Log)

```typescript
export const xpEvents = pgTable('xp_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  actionType: varchar('action_type', { length: 50 }).notNull(),
  xpAmount: integer('xp_amount').notNull(),

  // Optional reference to related entity
  relatedEntityType: varchar('related_entity_type', { length: 50 }),
  relatedEntityId: uuid('related_entity_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Indexes**:
- `userId, createdAt` (for XP history)

## Relations (Drizzle)

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(jobApplications),
  resumes: many(resumes),
  userQuests: many(userQuests),
  personalGoals: many(personalGoals),
  rankedEmployers: many(rankedEmployers),
  userRewards: many(userRewards),
  xpEvents: many(xpEvents),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one, many }) => ({
  user: one(users, { fields: [jobApplications.userId], references: [users.id] }),
  statusChanges: many(statusChanges),
  applicationResumes: many(applicationResumes),
}));

export const statusChangesRelations = relations(statusChanges, ({ one }) => ({
  application: one(jobApplications, { fields: [statusChanges.applicationId], references: [jobApplications.id] }),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  applicationResumes: many(applicationResumes),
}));

export const applicationResumesRelations = relations(applicationResumes, ({ one }) => ({
  application: one(jobApplications, { fields: [applicationResumes.applicationId], references: [jobApplications.id] }),
  resume: one(resumes, { fields: [applicationResumes.resumeId], references: [resumes.id] }),
}));

export const questsRelations = relations(quests, ({ many }) => ({
  userQuests: many(userQuests),
}));

export const userQuestsRelations = relations(userQuests, ({ one }) => ({
  user: one(users, { fields: [userQuests.userId], references: [users.id] }),
  quest: one(quests, { fields: [userQuests.questId], references: [quests.id] }),
}));

export const personalGoalsRelations = relations(personalGoals, ({ one }) => ({
  user: one(users, { fields: [personalGoals.userId], references: [users.id] }),
}));

export const rankedEmployersRelations = relations(rankedEmployers, ({ one }) => ({
  user: one(users, { fields: [rankedEmployers.userId], references: [users.id] }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  userRewards: many(userRewards),
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, { fields: [userRewards.userId], references: [users.id] }),
  reward: one(rewards, { fields: [userRewards.rewardId], references: [rewards.id] }),
}));

export const xpEventsRelations = relations(xpEvents, ({ one }) => ({
  user: one(users, { fields: [xpEvents.userId], references: [users.id] }),
}));
```

## Validation Rules

### User
- Email: Valid email format, unique
- Password: Minimum 8 characters, hashed before storage
- Name: 1-255 characters

### Job Application
- Job title: 1-255 characters
- Company name: 1-255 characters
- Date applied: Cannot be in the future
- Job description: Max 50,000 characters

### Resume
- File size: Max 10MB
- MIME type: Must be `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Filename: Sanitized, 1-255 characters

### Personal Goal
- Title: 1-255 characters
- Target count: Positive integer
- Deadline: Must be in the future when created

### Ranked Employer
- Rank: Positive integer, unique per user
- Company name: 1-255 characters

## State Transitions

### Application Status Flow

```
                    ┌──────────────┐
                    │   Applied    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌───────────┐  ┌──────────┐
       │ Rejected │  │Phone Screen│  │Withdrawn │
       └──────────┘  └─────┬─────┘  └──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌───────────┐  ┌──────────┐
       │ Rejected │  │ Technical │  │Withdrawn │
       └──────────┘  │ Interview │  └──────────┘
                     └─────┬─────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌───────────┐  ┌──────────┐
       │ Rejected │  │   Onsite  │  │Withdrawn │
       └──────────┘  └─────┬─────┘  └──────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌───────────┐  ┌──────────┐
       │ Rejected │  │   Offer   │──│Withdrawn │
       └──────────┘  └─────┬─────┘  └──────────┘
                           │
                           ▼
                    ┌──────────┐
                    │ Accepted │
                    └──────────┘
```

**Note**: Backward transitions are allowed and logged. Any status can transition to Withdrawn or Rejected at any time.

### Quest Status Flow

```
┌─────────────┐    complete     ┌───────────┐    claim     ┌─────────┐
│ in_progress │───────────────>│ completed │─────────────>│ claimed │
└──────┬──────┘                 └───────────┘              └─────────┘
       │
       │ expires
       ▼
┌─────────────┐
│   expired   │
└─────────────┘
```

### Goal Status Flow

```
┌────────┐    achieve    ┌──────────┐
│ active │──────────────>│ achieved │
└────┬───┘               └──────────┘
     │
     │ abandon
     ▼
┌───────────┐
│ abandoned │
└───────────┘
```
