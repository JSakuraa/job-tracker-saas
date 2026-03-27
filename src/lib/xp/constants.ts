// T050: XP Constants and Level Thresholds

// XP awarded for different actions
export const XP_REWARDS = {
  APPLICATION_CREATED: 25,
  STATUS_UPDATED: 10,
  RESUME_UPLOADED: 15,
  QUEST_COMPLETED: 50, // Base, can vary per quest
  GOAL_ACHIEVED: 30,
  LOGIN_STREAK_DAILY: 5,
  LOGIN_STREAK_WEEKLY: 25,
  PROFILE_UPDATED: 10,
} as const;

// Action types for XP events
export const XP_ACTION_TYPES = {
  APPLICATION_CREATED: 'application_created',
  STATUS_UPDATED: 'status_updated',
  RESUME_UPLOADED: 'resume_uploaded',
  QUEST_COMPLETED: 'quest_completed',
  GOAL_ACHIEVED: 'goal_achieved',
  LOGIN_STREAK: 'login_streak',
  PROFILE_UPDATED: 'profile_updated',
} as const;

export type XpActionType = (typeof XP_ACTION_TYPES)[keyof typeof XP_ACTION_TYPES];

// Level thresholds - XP required to reach each level
// Uses a progressive formula: level N requires N * 100 XP total
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, // Level 1 (starting level)
  100, // Level 2
  250, // Level 3
  450, // Level 4
  700, // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
  3250, // Level 11
  3850, // Level 12
  4500, // Level 13
  5200, // Level 14
  5950, // Level 15
  6750, // Level 16
  7600, // Level 17
  8500, // Level 18
  9450, // Level 19
  10450, // Level 20
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

// Level titles for display
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Newcomer',
  2: 'Applicant',
  3: 'Job Seeker',
  4: 'Active Hunter',
  5: 'Rising Star',
  6: 'Go-Getter',
  7: 'Networking Pro',
  8: 'Interview Ace',
  9: 'Career Climber',
  10: 'Job Master',
  11: 'Industry Expert',
  12: 'Talent Scout',
  13: 'Executive Tracker',
  14: 'Career Champion',
  15: 'Employment Guru',
  16: 'Hiring Legend',
  17: 'Job Market Maven',
  18: 'Career Conqueror',
  19: 'Employment Elite',
  20: 'Ultimate Job Hunter',
};
