// T056: TypeScript types for all entities

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  users,
  jobApplications,
  statusChanges,
  resumes,
  applicationResumes,
  quests,
  userQuests,
  personalGoals,
  rankedEmployers,
  companies,
  connections,
  rewards,
  userRewards,
  xpEvents,
} from '@/lib/db/schema';

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserProfile = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'totalXp'
  | 'loginStreakCount'
  | 'customization'
  | 'isActive'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

// Job Application types
export type JobApplication = InferSelectModel<typeof jobApplications>;
export type NewJobApplication = InferInsertModel<typeof jobApplications>;
export type ApplicationStatus = JobApplication['status'];

// Status Change types
export type StatusChange = InferSelectModel<typeof statusChanges>;
export type NewStatusChange = InferInsertModel<typeof statusChanges>;

// Resume types
export type Resume = InferSelectModel<typeof resumes>;
export type NewResume = InferInsertModel<typeof resumes>;

// Application Resume (junction) types
export type ApplicationResume = InferSelectModel<typeof applicationResumes>;
export type NewApplicationResume = InferInsertModel<typeof applicationResumes>;

// Quest types
export type Quest = InferSelectModel<typeof quests>;
export type NewQuest = InferInsertModel<typeof quests>;
export type QuestType = Quest['type'];

// User Quest types
export type UserQuest = InferSelectModel<typeof userQuests>;
export type NewUserQuest = InferInsertModel<typeof userQuests>;
export type UserQuestStatus = UserQuest['status'];

// Personal Goal types
export type PersonalGoal = InferSelectModel<typeof personalGoals>;
export type NewPersonalGoal = InferInsertModel<typeof personalGoals>;
export type GoalStatus = PersonalGoal['status'];

// Ranked Employer types (deprecated — use Company/Connection instead)
export type RankedEmployer = InferSelectModel<typeof rankedEmployers>;
export type NewRankedEmployer = InferInsertModel<typeof rankedEmployers>;

// Company types
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;
export type CompanySource = Company['source'];

// Connection types
export type Connection = InferSelectModel<typeof connections>;
export type NewConnection = InferInsertModel<typeof connections>;
export type RelationshipType = Connection['relationshipType'];

// Reward types
export type Reward = InferSelectModel<typeof rewards>;
export type NewReward = InferInsertModel<typeof rewards>;
export type RewardType = Reward['type'];

// User Reward types
export type UserReward = InferSelectModel<typeof userRewards>;
export type NewUserReward = InferInsertModel<typeof userRewards>;

// XP Event types
export type XpEvent = InferSelectModel<typeof xpEvents>;
export type NewXpEvent = InferInsertModel<typeof xpEvents>;

// Composite types for views
export type JobApplicationWithHistory = JobApplication & {
  statusChanges: StatusChange[];
};

export type JobApplicationWithResumes = JobApplication & {
  resumes: Resume[];
};

export type QuestWithProgress = Quest & {
  userStatus: UserQuestStatus | null;
  progress: number;
  expiresAt: Date | null;
};

export type RewardWithUnlockStatus = Reward & {
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: Date | null;
};

export type RankedEmployerWithApplications = RankedEmployer & {
  applicationCount: number;
  latestApplication: Pick<JobApplication, 'id' | 'jobTitle' | 'status' | 'dateApplied'> | null;
};

// Composite types for new features
export type CompanyWithCounts = Company & {
  applicationCount: number;
  connectionCount: number;
};

export type ConnectionWithCompany = Connection & {
  company: Pick<Company, 'id' | 'name'> | null;
};
