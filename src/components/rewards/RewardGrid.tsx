// T164: RewardGrid component

'use client';

import { RewardCard } from './RewardCard';
import type { Reward } from '@/types/entities';
import styles from './RewardGrid.module.css';

interface RewardWithStatus extends Reward {
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: Date | null;
}

interface RewardGridProps {
  rewards: RewardWithStatus[];
  onUpdate?: (() => void) | undefined;
  emptyMessage?: string | undefined;
  filterType?: 'badge' | 'avatar' | 'theme' | undefined;
}

export function RewardGrid({
  rewards,
  onUpdate,
  emptyMessage = 'No rewards available.',
  filterType,
}: RewardGridProps) {
  const filteredRewards = filterType
    ? rewards.filter((r) => r.type === filterType)
    : rewards;

  if (filteredRewards.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {filteredRewards.map((reward) => (
        <RewardCard key={reward.id} reward={reward} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
