// T051: XP Calculation Utilities

import { LEVEL_THRESHOLDS, MAX_LEVEL, LEVEL_TITLES } from './constants';

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && totalXp >= threshold) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required to reach a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) return LEVEL_THRESHOLDS[MAX_LEVEL - 1] ?? 0;
  return LEVEL_THRESHOLDS[level - 1] ?? 0;
}

/**
 * Get XP required to reach the next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) {
    return LEVEL_THRESHOLDS[MAX_LEVEL - 1] ?? 0;
  }
  return LEVEL_THRESHOLDS[currentLevel] ?? 0;
}

/**
 * Calculate progress towards next level (0-100)
 */
export function getLevelProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
  isMaxLevel: boolean;
} {
  const level = getLevelFromXp(totalXp);
  const isMaxLevel = level >= MAX_LEVEL;
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = isMaxLevel ? currentLevelXp : getXpForNextLevel(level);

  const progressXp = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.floor((progressXp / xpNeeded) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    progressPercent,
    isMaxLevel,
  };
}

/**
 * Get level title for display
 */
export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, MAX_LEVEL)] ?? 'Unknown';
}

/**
 * Check if adding XP would result in a level-up
 */
export function wouldLevelUp(currentXp: number, xpToAdd: number): boolean {
  const currentLevel = getLevelFromXp(currentXp);
  const newLevel = getLevelFromXp(currentXp + xpToAdd);
  return newLevel > currentLevel;
}

/**
 * Calculate how many levels would be gained
 */
export function calculateLevelsGained(currentXp: number, xpToAdd: number): number {
  const currentLevel = getLevelFromXp(currentXp);
  const newLevel = getLevelFromXp(currentXp + xpToAdd);
  return Math.max(0, newLevel - currentLevel);
}
