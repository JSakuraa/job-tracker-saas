import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  unique,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Enums
// ============================================================================

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

export const questType = pgEnum('quest_type', ['one_time', 'daily', 'weekly', 'achievement']);

export const userQuestStatus = pgEnum('user_quest_status', [
  'in_progress',
  'completed',
  'claimed',
  'expired',
]);

export const goalStatus = pgEnum('goal_status', ['active', 'achieved', 'abandoned']);

export const rewardType = pgEnum('reward_type', ['badge', 'avatar', 'theme']);

// ============================================================================
// Type Definitions for JSONB columns
// ============================================================================

export type UserCustomization = {
  avatarId?: string;
  themeId?: string;
  badgeIds?: string[];
};

export type QuestRequirements = {
  action: string;
  count: number;
  targetStatus?: string;
  timeframe?: 'day' | 'week' | 'all_time';
};

export type UnlockCriteria = {
  type: 'level' | 'achievement' | 'quest';
  value: number | string;
};

// ============================================================================
// Tables
// ============================================================================

// T010: Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),

    // Gamification
    totalXp: integer('total_xp').notNull().default(0),
    loginStreakCount: integer('login_streak_count').notNull().default(0),
    lastLoginDate: timestamp('last_login_date', { withTimezone: true }),

    // Customization preferences
    customization: jsonb('customization').$type<UserCustomization>().default({}),

    // Account status
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_deleted_at_idx').on(table.deletedAt)]
);

// T011: Job Applications table
export const jobApplications = pgTable(
  'job_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

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
  },
  (table) => [
    index('job_applications_user_id_idx').on(table.userId),
    index('job_applications_user_id_status_idx').on(table.userId, table.status),
    index('job_applications_company_name_idx').on(table.companyName),
  ]
);

// T012: Status Changes table
export const statusChanges = pgTable(
  'status_changes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => jobApplications.id, { onDelete: 'cascade' }),

    previousStatus: applicationStatus('previous_status'),
    newStatus: applicationStatus('new_status').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('status_changes_application_id_changed_at_idx').on(table.applicationId, table.changedAt)]
);

// T013: Resumes table
export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    filename: varchar('filename', { length: 255 }).notNull(),
    blobKey: varchar('blob_key', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSize: integer('file_size').notNull(),

    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('resumes_user_id_idx').on(table.userId)]
);

// T014: Application-Resume junction table
export const applicationResumes = pgTable(
  'application_resumes',
  {
    applicationId: uuid('application_id')
      .notNull()
      .references(() => jobApplications.id, { onDelete: 'cascade' }),
    resumeId: uuid('resume_id')
      .notNull()
      .references(() => resumes.id, { onDelete: 'restrict' }),
    attachedAt: timestamp('attached_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.applicationId, table.resumeId] })]
);

// T015: Quests table
export const quests = pgTable('quests', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: questType('type').notNull(),

  requirements: jsonb('requirements').$type<QuestRequirements>().notNull(),
  xpReward: integer('xp_reward').notNull(),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// T016: User Quests table
export const userQuests = pgTable(
  'user_quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questId: uuid('quest_id')
      .notNull()
      .references(() => quests.id, { onDelete: 'cascade' }),

    status: userQuestStatus('status').notNull().default('in_progress'),
    progress: integer('progress').notNull().default(0),

    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('user_quests_user_id_status_idx').on(table.userId, table.status),
    index('user_quests_expires_at_idx').on(table.expiresAt),
  ]
);

// T017: Personal Goals table
export const personalGoals = pgTable(
  'personal_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetCount: integer('target_count').notNull(),
    currentCount: integer('current_count').notNull().default(0),

    deadline: timestamp('deadline', { withTimezone: true }),
    status: goalStatus('status').notNull().default('active'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    achievedAt: timestamp('achieved_at', { withTimezone: true }),
  },
  (table) => [index('personal_goals_user_id_status_idx').on(table.userId, table.status)]
);

// T018: Ranked Employers table
export const rankedEmployers = pgTable(
  'ranked_employers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    companyName: varchar('company_name', { length: 255 }).notNull(),
    rank: integer('rank').notNull(),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('ranked_employers_user_id_rank_unique').on(table.userId, table.rank),
    index('ranked_employers_user_id_company_name_idx').on(table.userId, table.companyName),
  ]
);

// T019: Rewards table
export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: rewardType('type').notNull(),

  assetKey: varchar('asset_key', { length: 255 }).notNull(),
  unlockCriteria: jsonb('unlock_criteria').$type<UnlockCriteria>().notNull(),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// T020: User Rewards table
export const userRewards = pgTable(
  'user_rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),

    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).notNull().defaultNow(),
    isEquipped: boolean('is_equipped').notNull().default(false),
  },
  (table) => [
    unique('user_rewards_user_id_reward_id_unique').on(table.userId, table.rewardId),
    index('user_rewards_user_id_is_equipped_idx').on(table.userId, table.isEquipped),
  ]
);

// T021: XP Events audit table
export const xpEvents = pgTable(
  'xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    actionType: varchar('action_type', { length: 50 }).notNull(),
    xpAmount: integer('xp_amount').notNull(),

    relatedEntityType: varchar('related_entity_type', { length: 50 }),
    relatedEntityId: uuid('related_entity_id'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('xp_events_user_id_created_at_idx').on(table.userId, table.createdAt)]
);

// ============================================================================
// T022: Relations
// ============================================================================

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
  application: one(jobApplications, {
    fields: [statusChanges.applicationId],
    references: [jobApplications.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  applicationResumes: many(applicationResumes),
}));

export const applicationResumesRelations = relations(applicationResumes, ({ one }) => ({
  application: one(jobApplications, {
    fields: [applicationResumes.applicationId],
    references: [jobApplications.id],
  }),
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
