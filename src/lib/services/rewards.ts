// T157: Rewards service with unlock logic
// T158: Reward unlock check triggered by level-up

import { db } from '@/lib/db/client';
import { rewards, userRewards, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLevelFromXp } from '@/lib/xp/utils';
import type { Reward, UserReward } from '@/types/entities';
import type { UnlockCriteria } from '@/lib/db/schema';

export interface RewardWithStatus extends Reward {
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: Date | null;
}

/**
 * Get all rewards with unlock status for a user
 */
export async function getRewards(userId: string): Promise<RewardWithStatus[]> {
  const [allRewards, userRewardsList] = await Promise.all([
    db.select().from(rewards).where(eq(rewards.isActive, true)),
    db.select().from(userRewards).where(eq(userRewards.userId, userId)),
  ]);

  const userRewardsMap = new Map(userRewardsList.map((ur) => [ur.rewardId, ur]));

  return allRewards.map((reward) => {
    const userReward = userRewardsMap.get(reward.id);
    return {
      ...reward,
      isUnlocked: !!userReward,
      isEquipped: userReward?.isEquipped ?? false,
      unlockedAt: userReward?.unlockedAt ?? null,
    };
  });
}

/**
 * Get unlocked rewards for a user
 */
export async function getUnlockedRewards(userId: string): Promise<RewardWithStatus[]> {
  const all = await getRewards(userId);
  return all.filter((r) => r.isUnlocked);
}

/**
 * Get a single reward by ID
 */
export async function getRewardById(rewardId: string): Promise<Reward | null> {
  const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
  return reward ?? null;
}

/**
 * Check if user has unlocked a reward
 */
export async function isRewardUnlocked(userId: string, rewardId: string): Promise<boolean> {
  const [userReward] = await db
    .select()
    .from(userRewards)
    .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));

  return !!userReward;
}

/**
 * Unlock a reward for a user
 */
export async function unlockReward(userId: string, rewardId: string): Promise<UserReward | null> {
  // Check if already unlocked
  const alreadyUnlocked = await isRewardUnlocked(userId, rewardId);
  if (alreadyUnlocked) {
    return null;
  }

  const [userReward] = await db
    .insert(userRewards)
    .values({
      userId,
      rewardId,
    })
    .returning();

  return userReward ?? null;
}

/**
 * Check and unlock rewards based on user's current level
 */
export async function checkAndUnlockLevelRewards(
  userId: string,
  totalXp: number
): Promise<{ newRewards: Reward[] }> {
  const currentLevel = getLevelFromXp(totalXp);
  const newRewards: Reward[] = [];

  // Get all level-based rewards
  const allRewards = await db.select().from(rewards).where(eq(rewards.isActive, true));

  const levelRewards = allRewards.filter((r) => {
    const criteria = r.unlockCriteria as UnlockCriteria;
    return criteria.type === 'level' && typeof criteria.value === 'number';
  });

  // Check which ones user hasn't unlocked yet but qualifies for
  const userUnlockedIds = await db
    .select({ rewardId: userRewards.rewardId })
    .from(userRewards)
    .where(eq(userRewards.userId, userId));

  const unlockedSet = new Set(userUnlockedIds.map((ur) => ur.rewardId));

  for (const reward of levelRewards) {
    if (unlockedSet.has(reward.id)) {
      continue; // Already unlocked
    }

    const criteria = reward.unlockCriteria as UnlockCriteria;
    const requiredLevel = criteria.value as number;

    if (currentLevel >= requiredLevel) {
      await unlockReward(userId, reward.id);
      newRewards.push(reward);
    }
  }

  return { newRewards };
}

/**
 * Equip a reward (unequip others of same type)
 */
export async function equipReward(
  userId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user has unlocked this reward
  const [userReward] = await db
    .select()
    .from(userRewards)
    .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));

  if (!userReward) {
    return { success: false, error: 'Reward not unlocked' };
  }

  // Get the reward to check type
  const reward = await getRewardById(rewardId);
  if (!reward) {
    return { success: false, error: 'Reward not found' };
  }

  // Unequip all other rewards of the same type for this user
  const sameTypeRewards = await db
    .select({ id: rewards.id })
    .from(rewards)
    .where(eq(rewards.type, reward.type));

  const sameTypeIds = sameTypeRewards.map((r) => r.id);

  for (const id of sameTypeIds) {
    await db
      .update(userRewards)
      .set({ isEquipped: false })
      .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, id)));
  }

  // Equip the selected reward
  await db
    .update(userRewards)
    .set({ isEquipped: true })
    .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));

  // Update user's customization based on reward type
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (user) {
    const customization = user.customization ?? {};
    if (reward.type === 'avatar') {
      customization.avatarId = reward.assetKey;
    } else if (reward.type === 'theme') {
      customization.themeId = reward.assetKey;
    } else if (reward.type === 'badge') {
      if (!customization.badgeIds) {
        customization.badgeIds = [];
      }
      if (!customization.badgeIds.includes(reward.assetKey)) {
        customization.badgeIds.push(reward.assetKey);
      }
    }

    await db
      .update(users)
      .set({ customization, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return { success: true };
}

/**
 * Unequip a reward
 */
export async function unequipReward(
  userId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user has this reward equipped
  const [userReward] = await db
    .select()
    .from(userRewards)
    .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));

  if (!userReward || !userReward.isEquipped) {
    return { success: false, error: 'Reward not equipped' };
  }

  // Unequip the reward
  await db
    .update(userRewards)
    .set({ isEquipped: false })
    .where(and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)));

  // Update user's customization
  const reward = await getRewardById(rewardId);
  if (reward) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const customization = { ...(user.customization ?? {}) };
      if (reward.type === 'avatar' && customization.avatarId === reward.assetKey) {
        delete customization.avatarId;
      } else if (reward.type === 'theme' && customization.themeId === reward.assetKey) {
        delete customization.themeId;
      } else if (reward.type === 'badge' && customization.badgeIds) {
        customization.badgeIds = customization.badgeIds.filter((id) => id !== reward.assetKey);
      }

      await db
        .update(users)
        .set({ customization, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
  }

  return { success: true };
}

/**
 * Get user's equipped rewards
 */
export async function getEquippedRewards(userId: string): Promise<RewardWithStatus[]> {
  const all = await getRewards(userId);
  return all.filter((r) => r.isEquipped);
}
